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
 *
 * The functions that put a reading into words take the dictionary as their last
 * argument. It is passed rather than read from a store because these are also
 * called from the alert pass, which is not a render and has to be able to ask
 * for the language in force at the moment an alert fires.
 */

import type { Messages } from '../i18n/en'

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

/**
 * Symbols needed before the board has a middle worth subtracting.
 *
 * Both readings that net the market out — `strength` over five minutes and
 * `relative-strength` over a month — subtract the median of the board, and
 * below a handful of symbols that median is not a market. A median of three is
 * one of them, and on a watchlist that size it is routinely the symbol being
 * measured: the excess comes out at exactly zero, and on a watchlist of two it
 * comes out as half the gap between the pair, so the same move reads as
 * strength on one card and weakness on the other.
 *
 * Eight, which is where the middle stops swinging on which one card happens to
 * be open. Below it neither reading fires; the raw figures both are derived
 * from are still reported, since only the reading claims a move is unusual.
 */
export const MIN_BOARD_SYMBOLS = 8

/**
 * The middle of a set of readings, or null when there are none. Used where a
 * mean would be dragged around by the one sample that went mad, which is the
 * usual case whenever the thing being summarised is a volume or a spread.
 */
export function medianOf(values: number[]) {
  const sorted = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)
  if (!sorted.length) return null

  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
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
 * How the chip's tooltip says it, e.g. "2.4σ above". The sign is the whole
 * point — above means the crowd is longer, or paying more, than it has been,
 * and below means the opposite.
 */
export function formatDeviation(deviation: number, t: Messages) {
  return t.signal.deviation(Math.abs(deviation).toFixed(1), deviation > 0)
}

export function describeDeviation(deviation: number, t: Messages) {
  return t.signal.describeDeviation(
    Math.abs(deviation).toFixed(1),
    deviation > 0,
  )
}

/** Magnitude only, for a detail that already carries its own direction. */
export function formatSigmas(deviation: number, t: Messages) {
  return t.signal.sigmas(Math.abs(deviation).toFixed(1))
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
  // Price: what just happened to the quote, or what conspicuously has not.
  | 'momentum'
  | 'volatility'
  | 'compression'
  | 'breakout'
  | 'range-break'
  | 'rejection'
  | 'strength'
  // Flow: whether anyone put anything behind it, and which side they were on.
  | 'volume'
  | 'taker'
  | 'open-interest'
  | 'liquidation'
  // Positioning: what the book was holding, paying, and charging going in.
  | 'ratio'
  | 'divergence'
  | 'funding'
  | 'funding-shift'
  | 'basis'
  | 'spread'

const SIGNAL_FAMILY: Record<SignalKind, SignalFamily> = {
  momentum: 'price',
  volatility: 'price',
  compression: 'price',
  breakout: 'price',
  // The one reading here fed by the medium-term layer rather than by a
  // five-minute one. It belongs in this family and not in that layer because it
  // is an event and not a state: the month's high is either being taken out or
  // it is not, and the moment it is, is the moment worth crossing the grid for.
  'range-break': 'price',
  rejection: 'price',
  strength: 'price',
  volume: 'flow',
  taker: 'flow',
  'open-interest': 'flow',
  // Flow, and the only kind of it nobody chose: what the exchange closed out is
  // still volume and still open interest leaving, arriving through a door the
  // holder does not control.
  liquidation: 'flow',
  ratio: 'positioning',
  divergence: 'positioning',
  funding: 'positioning',
  'funding-shift': 'positioning',
  basis: 'positioning',
  // The spread is the state of the book rather than an event in it, which is
  // what this family already collects: what the crowd holds, what it pays to
  // hold it, and what it costs to get out. It is also the only one here that is
  // a condition rather than a consequence, so it is the one whose agreeing with
  // the others says the most.
  spread: 'positioning',
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

/**
 * Readings that describe a state rather than an event, and so never put a card
 * up on their own account.
 *
 * The compression is the whole of the list and the reason it exists. Every other
 * reading here fires because something happened; that one fires because nothing
 * has, for two hours, in less room than usual. It is worth saying — it is the
 * only thing on the board that speaks before the event rather than during it —
 * but a coil is by definition a card with nothing else going on, so letting it
 * count towards the bar would put a ring on the quietest tenth of the board at
 * all times and mean the ring no longer said anything.
 *
 * Excluded from the count, not from the reasons: when the coil does break, the
 * five-minute move rings the card and the two hours of winding up that preceded
 * it are the most useful sentence in the list.
 */
const NEVER_RINGS: SignalKind[] = ['compression']

/** What a positioning reading is taken from, for the exception below. */
type PositioningSource = 'crowd' | 'funding' | 'basis' | 'spread'

/**
 * Which readings are the same source seen twice.
 *
 * The positioning exception counts two readings within one family as a ring, and
 * the reason it is allowed to is that the readings were separately sourced —
 * what the crowd holds and what it pays to hold it are different measurements
 * that disagree often, so their agreeing is an event. That was written when this
 * family had three members. It now has six, and two of the pairs in it are not
 * separate measurements at all: the funding level and its shift since the last
 * settlement are one series asked two questions, and the account ratio and the
 * elite-versus-crowd gap share the crowd for a leg.
 *
 * Measured over 1200 instrument-settlements, the funding pair alone crossed
 * together six times — six cards rung by one series describing itself twice.
 * Grouping by source keeps the exception doing what its rationale says.
 *
 * Exhaustive over every kind rather than a partial map of the positioning ones,
 * so a reading added to that family cannot quietly default to counting as its
 * own source.
 */
const POSITIONING_SOURCE: Record<SignalKind, PositioningSource | null> = {
  momentum: null,
  volatility: null,
  compression: null,
  breakout: null,
  'range-break': null,
  rejection: null,
  strength: null,
  volume: null,
  taker: null,
  'open-interest': null,
  liquidation: null,
  // Both read the crowd's book; the divergence adds the elite side but keeps
  // the same crowd underneath it.
  ratio: 'crowd',
  divergence: 'crowd',
  // One series, two questions.
  funding: 'funding',
  'funding-shift': 'funding',
  basis: 'basis',
  spread: 'spread',
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
 * it draws has not changed meaning — which is why the two readings have to come
 * from two sources and not merely from two detectors.
 */
export function flagStateOf(signals: Signal[], t: Messages): FlagState | null {
  const ringing = signals.filter((signal) => !NEVER_RINGS.includes(signal.kind))
  if (ringing.length < 2) return null

  const families = FAMILY_ORDER.filter((family) =>
    ringing.some((signal) => SIGNAL_FAMILY[signal.kind] === family),
  )
  // Sources rather than readings: two views of one series are one observation,
  // however many detectors report it.
  const positioningSources = new Set(
    ringing
      .map((signal) => POSITIONING_SOURCE[signal.kind])
      .filter((source): source is PositioningSource => source !== null),
  )

  if (families.length < 2 && positioningSources.size < 2) return null

  const reasons = [...signals].sort((a, b) => {
    const byFamily =
      FAMILY_ORDER.indexOf(SIGNAL_FAMILY[a.kind]) -
      FAMILY_ORDER.indexOf(SIGNAL_FAMILY[b.kind])
    if (byFamily !== 0) return byFamily
    return Math.abs(b.deviation ?? 0) - Math.abs(a.deviation ?? 0)
  })

  // Widened to look the combination up by the joined key, which the dictionary
  // spells out one entry at a time so a translation cannot miss one.
  const headlines: Record<string, string> = t.headline

  return {
    families,
    reasons,
    headline: headlines[families.join('+')] ?? t.headline.other,
  }
}
