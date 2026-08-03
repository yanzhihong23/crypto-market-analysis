/**
 * What counts as unusual, and what combination of unusual is worth crossing the
 * grid for.
 *
 * Every reading on the board is measured against its own recent history rather
 * than against a fixed band, because "normal" is per instrument and cannot be a
 * constant: BTC's account ratio lives around 2 while a small cap can sit under
 * 1 for weeks, and a five-minute move of one percent is a headline on the first
 * and a quiet afternoon on the second. One threshold would either scream on one
 * or never fire on the other.
 *
 * Which readings exist and how each is taken belongs to the module that owns
 * it. This file owns the statistics they share, the bar they are all held to,
 * and the rule that decides when enough of them agree.
 */

/** Samples of history needed before a mean and a spread mean anything. */
const MIN_SAMPLES = 20

/**
 * How far from its own mean a reading sits before it earns the flag.
 *
 * Three, not the textbook two. These series trend rather than jitter around a
 * fixed level, so the latest point sits far from its window's mean far more
 * often than a normal distribution would predict: across the 347 symbols on the
 * Binance grid the median reading is already 1.2 sigma out, and two sigma
 * flagged 15% of them. Three flags the top 3%, which is what "worth a look"
 * should mean on a screen this dense.
 */
const DEVIATION_SIGMAS = 3

export interface Baseline {
  mean: number
  /** Sample standard deviation; never zero, a flat window yields no baseline. */
  sigma: number
}

/**
 * The shape of a metric's recent history. Kept as two numbers rather than the
 * series itself: it is all the flag needs, it survives being persisted, and it
 * lets a live value be measured against it without refetching anything.
 */
export function baselineOf(values: number[]): Baseline | null {
  const usable = values.filter((value) => Number.isFinite(value))
  if (usable.length < MIN_SAMPLES) return null

  const mean = usable.reduce((sum, value) => sum + value, 0) / usable.length
  const variance =
    usable.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (usable.length - 1)
  const sigma = Math.sqrt(variance)

  // A window that never moved has nothing to be unusual against, and dividing
  // by it would report every reading as infinitely far from normal.
  if (!(sigma > 0)) return null

  return { mean, sigma }
}

/** Signed distance from normal, in standard deviations. */
export function deviationFrom(value: number, baseline?: Baseline | null) {
  if (!baseline || !Number.isFinite(value)) return null
  return (value - baseline.mean) / baseline.sigma
}

/** Far enough from its own normal to be worth looking at, in either direction. */
export function isAnomalous(deviation?: number | null) {
  return (
    deviation !== null &&
    deviation !== undefined &&
    Math.abs(deviation) >= DEVIATION_SIGMAS
  )
}

/**
 * The same bar for a reading that measures a change rather than a level, which
 * additionally has to be a change worth naming.
 *
 * A symbol that has barely moved for hours has a sigma small enough that one
 * tick clears three of them, so sigma alone hands the quiet end of the board
 * every flag on the screen. The floor is in whatever unit the change is quoted
 * in and is the caller's to choose, because a tenth of a percent means one
 * thing on a price and another on an open interest.
 */
export function isAnomalousChange(
  deviation: number | null | undefined,
  change: number,
  floor: number,
) {
  return isAnomalous(deviation) && Math.abs(change) >= floor
}

/**
 * How the chip's tooltip says it, e.g. "2.4σ above its recent range". The sign
 * is the whole point — above means the crowd is longer, or paying more, than it
 * has been, and below means the opposite.
 */
export function formatDeviation(deviation: number) {
  const side = deviation > 0 ? 'above' : 'below'
  return `${Math.abs(deviation).toFixed(1)}σ ${side}`
}

export function describeDeviation(deviation: number) {
  return `${formatDeviation(deviation)} its recent range`
}

/** Magnitude only, for a detail that already carries its own direction. */
export function formatSigmas(deviation: number) {
  return `${Math.abs(deviation).toFixed(1)}σ`
}

/**
 * What a reading is about.
 *
 * The ring rule works in families rather than in individual readings, because
 * two readings inside a family are usually one event described twice: a new 24h
 * high on a bar whose range has just expanded is a single move, and letting
 * that pair claim the ring would ring every trending symbol on the board.
 * Across families they are genuinely separate questions — what the price did,
 * whether anyone was behind it, and what the book was holding beforehand.
 */
export type SignalFamily = 'price' | 'flow' | 'positioning'

export type SignalKind =
  // Price: what just happened to the quote.
  | 'momentum'
  | 'volatility'
  | 'breakout'
  | 'rejection'
  | 'strength'
  // Flow: whether anyone put anything behind it.
  | 'volume'
  | 'open-interest'
  // Positioning: what the book was holding, and paying, going in.
  | 'ratio'
  | 'funding'
  | 'funding-shift'
  | 'basis'

const SIGNAL_FAMILY: Record<SignalKind, SignalFamily> = {
  momentum: 'price',
  volatility: 'price',
  breakout: 'price',
  rejection: 'price',
  strength: 'price',
  volume: 'flow',
  'open-interest': 'flow',
  ratio: 'positioning',
  funding: 'positioning',
  'funding-shift': 'positioning',
  basis: 'positioning',
}

export function signalFamily(kind: SignalKind) {
  return SIGNAL_FAMILY[kind]
}

export interface Signal {
  kind: SignalKind
  /**
   * Distance from this instrument's own normal, in sigmas. Null for the
   * readings that are shapes rather than levels: a new 24h high is not
   * two-point-something of anything.
   */
  deviation: number | null
  /** Chip-sized, for a 236px card: the reading and nothing else. */
  label: string
  /**
   * One line, for a tooltip and for the alert list. Both strings are written by
   * the detector rather than derived by whatever renders them: it is the only
   * thing that knows what unit the number is in, and a stored alert has to still
   * read correctly long after the series behind it has rolled off.
   */
  detail: string
}

export interface FlagState {
  /** Which families are firing. Two is the bar. */
  families: SignalFamily[]
  /** Ordered for reading: family by family, largest reading first inside each. */
  reasons: Signal[]
  /** The combination in words, for a notification title and the alert list. */
  headline: string
}

/** Also the order reasons are listed in, so a headline and its detail agree. */
const FAMILY_ORDER: SignalFamily[] = ['price', 'flow', 'positioning']

const FAMILY_HEADLINES: Record<string, string> = {
  'price+flow': 'Move with flow behind it',
  'price+positioning': 'Move into a crowded book',
  'flow+positioning': 'Flow against a crowded book',
  'price+flow+positioning': 'Move, flow and positioning at once',
  positioning: 'Positioning stretched on two readings',
}

/**
 * Whether the card claims the ring, and what to say if it does.
 *
 * Two families, so that no single metric can ring a card on its own — every one
 * of these readings fires on its own often enough that a board obeying any of
 * them alone would be a board of rings. The exception is positioning, which
 * counts twice within itself: what the crowd holds and what it pays to hold it
 * are separately sourced and disagree often, so their agreeing is an event.
 * That exception is also the original bar this board shipped with, and the ring
 * it draws has not changed meaning.
 */
export function flagStateOf(signals: Signal[]): FlagState | null {
  if (signals.length < 2) return null

  const families = FAMILY_ORDER.filter((family) =>
    signals.some((signal) => SIGNAL_FAMILY[signal.kind] === family),
  )
  const positioningReadings = signals.filter(
    (signal) => SIGNAL_FAMILY[signal.kind] === 'positioning',
  ).length

  if (families.length < 2 && positioningReadings < 2) return null

  const reasons = [...signals].sort((a, b) => {
    const byFamily =
      FAMILY_ORDER.indexOf(SIGNAL_FAMILY[a.kind]) -
      FAMILY_ORDER.indexOf(SIGNAL_FAMILY[b.kind])
    if (byFamily !== 0) return byFamily
    return Math.abs(b.deviation ?? 0) - Math.abs(a.deviation ?? 0)
  })

  return {
    families,
    reasons,
    headline:
      FAMILY_HEADLINES[families.join('+')] ?? 'Several readings out of range',
  }
}
