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

import type { BackdropKind, BackdropReading } from './backdrop'

/** Samples of history needed before a mean and a spread mean anything. */
const MIN_SAMPLES = 20

/**
 * Tail share clamped at each end when building a baseline. Crypto series are
 * heavy-tailed: one violent wick inside an eight-hour window can triple the
 * sample standard deviation and silence every genuine move behind it for the
 * rest of the session (statistical masking). Winsorising 5% on each tail
 * preserves the full sample size while stopping one outlier from owning the
 * yardstick; if clamping flattens a tick-quantised series to zero spread, we
 * fall back to the raw sample statistics so nothing goes silently blind.
 */
const WINSOR_TAIL = 0.05

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

function sampleStats(values: number[]): Baseline | null {
  if (values.length < MIN_SAMPLES) return null
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1)
  const sigma = Math.sqrt(variance)
  if (!(sigma > 0)) return null
  return { mean, sigma }
}

function quantile(sorted: number[], p: number) {
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

/**
 * The shape of a metric's recent history, Winsorised against single-bar spikes.
 * Kept as two numbers rather than the series itself: it is all the flag needs,
 * it survives being persisted, and it lets a live value be measured against it
 * without refetching anything.
 */
export function baselineOf(values: number[]): Baseline | null {
  const usable = values.filter((value) => Number.isFinite(value))
  if (usable.length < MIN_SAMPLES) return null

  const sorted = [...usable].sort((a, b) => a - b)
  const low = quantile(sorted, WINSOR_TAIL)
  const high = quantile(sorted, 1 - WINSOR_TAIL)
  const clamped = usable.map((value) => Math.min(Math.max(value, low), high))

  // Fall back to raw statistics if clamping collapsed a tick-quantised series
  // (e.g. a spread or funding rate stuck on one level for >90% of the window).
  return sampleStats(clamped) ?? sampleStats(usable)
}

/**
 * Baseline in log1p space for strictly non-negative, right-skewed series such
 * as bar quote volume and bar percentage range. A linear standard deviation on
 * a log-normal distribution inflates asymmetrically on surges; measuring
 * distance in log space makes 3σ correspond cleanly to a rare upper-tail event.
 */
export function logBaselineOf(values: number[]): Baseline | null {
  const transformed = values
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((value) => Math.log1p(value))
  return baselineOf(transformed)
}

/** Signed distance in log1p space against a baseline built with `logBaselineOf`. */
export function logDeviationFrom(value: number, baseline?: Baseline | null) {
  if (!baseline || !Number.isFinite(value) || value < 0) return null
  return deviationFrom(Math.log1p(value), baseline)
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

export type SignalDirection = 'up' | 'down' | 'neutral'

export type FlagTier = 'standard' | 'high'

export type SignalRegime =
  | 'squeeze-cascade'
  | 'confirmed-breakout'
  | 'absorption-reversal'
  | 'trend-thrust'
  | 'crowded-squeeze'

export interface Signal {
  kind: SignalKind
  /**
   * Distance from this instrument's own normal, in sigmas. Null for the
   * readings that are shapes rather than levels: a new 24h high is not
   * two-point-something of anything.
   */
  deviation: number | null
  /** Implied directional lean of the reading, when it carries one. */
  direction?: SignalDirection
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
  /** Ordered for reading: family by family, highest priority & largest reading first. */
  reasons: Signal[]
  /** The combination in words, for a notification title and the alert list. */
  headline: string
  /** High when multiple families align, forced exits/major breakouts occur, or backdrop amplifies it. */
  tier: FlagTier
  /** Interpreted trading regime when signals form a clear structural pattern. */
  regime: SignalRegime | null
  /** Dominant directional lean across the firing signals. */
  direction: SignalDirection
}

/** Also the order reasons are listed in, so a headline and its detail agree. */
const FAMILY_ORDER: SignalFamily[] = ['price', 'flow', 'positioning']

/**
 * Relative importance inside a family. Structural events without a sigma
 * (`liquidation`, `range-break`, `breakout`) used to tie at 0 and sink behind
 * routine 3.1σ deviations, even getting truncated off notifications.
 */
const SIGNAL_PRIORITY: Record<SignalKind, number> = {
  'range-break': 4,
  momentum: 3,
  breakout: 3,
  rejection: 2,
  strength: 2,
  volatility: 1,
  compression: 0,
  liquidation: 4,
  'open-interest': 3,
  taker: 2,
  volume: 1,
  basis: 3,
  'funding-shift': 3,
  divergence: 2,
  funding: 2,
  ratio: 1,
  spread: 0,
}

/**
 * Slow backdrop states that never ring on their own, but elevate an active
 * intraday ring to `high` tier because the event is landing on a stretched or
 * wound-up structure.
 */
const HIGH_CONVICTION_BACKDROP = new Set<BackdropKind>([
  'daily-coil',
  'oi-percentile',
  'funding-carry',
  'range-position',
])

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

function dominantDirectionOf(reasons: Signal[]): SignalDirection {
  const directional = reasons.filter(
    (signal) => signal.direction && signal.direction !== 'neutral',
  )
  if (!directional.length) return 'neutral'

  // Price & forced-exit direction leads; fall back to net vote across all reasons.
  const lead = directional.find(
    (signal) =>
      SIGNAL_FAMILY[signal.kind] === 'price' || signal.kind === 'liquidation',
  )
  if (lead?.direction) return lead.direction

  let score = 0
  for (const signal of directional) {
    score += signal.direction === 'up' ? 1 : -1
  }
  if (score > 0) return 'up'
  if (score < 0) return 'down'
  return directional[0].direction ?? 'neutral'
}

function classifyRegime(
  signals: Signal[],
  families: SignalFamily[],
  direction: SignalDirection,
): SignalRegime | null {
  const byKind = new Map(signals.map((signal) => [signal.kind, signal]))
  const hasPrice = families.includes('price')
  const hasFlow = families.includes('flow')
  const hasPositioning = families.includes('positioning')

  if (byKind.has('liquidation')) return 'squeeze-cascade'

  const rejection = byKind.get('rejection')
  const taker = byKind.get('taker')
  if (
    rejection &&
    ((taker?.direction &&
      rejection.direction &&
      taker.direction !== rejection.direction) ||
      hasPositioning ||
      byKind.has('open-interest'))
  ) {
    return 'absorption-reversal'
  }

  const hasBreak =
    byKind.has('range-break') ||
    byKind.has('breakout') ||
    (byKind.has('compression') && byKind.has('momentum'))
  if (hasBreak && hasFlow) return 'confirmed-breakout'

  if (hasPrice && hasFlow) {
    const flowAligned =
      byKind.has('volume') ||
      (direction !== 'neutral' &&
        (taker?.direction === direction ||
          byKind.get('open-interest')?.direction === direction))
    if (flowAligned) return 'trend-thrust'
  }

  if (hasPrice && hasPositioning) return 'crowded-squeeze'

  return null
}

function headlineOf(
  families: SignalFamily[],
  regime: SignalRegime | null,
  direction: SignalDirection,
  t: Messages,
) {
  if (regime === 'squeeze-cascade') {
    if (direction === 'up') return t.headline.shortSqueeze
    if (direction === 'down') return t.headline.longLiquidation
    return t.headline.squeezeCascade
  }
  if (regime === 'confirmed-breakout') {
    return t.headline.confirmedBreakout
  }
  if (regime === 'absorption-reversal') {
    return t.headline.absorptionReversal
  }
  if (regime === 'trend-thrust' && families.length === 2) {
    return t.headline.trendThrust
  }
  if (regime === 'crowded-squeeze' && families.length === 2) {
    return t.headline.crowdedSqueeze
  }

  const headlines: Record<string, string> = t.headline
  return headlines[families.join('+')] ?? t.headline.other
}

/**
 * Whether the card claims the ring, and what to say if it does.
 *
 * Two families, so that no single metric can ring a card on its own — every one
 * of these readings fires on its own often enough that a board obeying any of
 * them alone would be a board of rings. The exception is positioning, which
 * counts twice within itself: what the crowd holds and what it pays to hold it
 * are separately sourced and disagree often, so their agreeing is an event.
 *
 * One deliberate suppression: `volatility` and `spread` alone are mechanically
 * coupled (market makers widen quotes whenever candle range jumps), so that
 * pair requires a third confirming signal before claiming a ring.
 */
export function flagStateOf(
  signals: Signal[],
  t: Messages,
  backdropReadings?: BackdropReading[],
): FlagState | null {
  const ringing = signals.filter((signal) => !NEVER_RINGS.includes(signal.kind))
  if (ringing.length < 2) return null

  // Mechanical coupling guard: wide candle + wide spread alone is market-maker
  // reflex rather than independent cross-family confirmation.
  if (
    ringing.length === 2 &&
    ringing.every(
      (signal) => signal.kind === 'volatility' || signal.kind === 'spread',
    )
  ) {
    return null
  }

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
    const byPriority = SIGNAL_PRIORITY[b.kind] - SIGNAL_PRIORITY[a.kind]
    if (byPriority !== 0) return byPriority
    return Math.abs(b.deviation ?? 0) - Math.abs(a.deviation ?? 0)
  })

  const direction = dominantDirectionOf(reasons)
  const regime = classifyRegime(reasons, families, direction)
  const headline = headlineOf(families, regime, direction, t)

  const kinds = new Set(reasons.map((signal) => signal.kind))
  const hasHighBackdrop = Boolean(
    backdropReadings?.some((reading) =>
      HIGH_CONVICTION_BACKDROP.has(reading.kind),
    ),
  )
  const tier: FlagTier =
    families.length >= 3 ||
    kinds.has('liquidation') ||
    (kinds.has('range-break') && families.includes('flow')) ||
    (kinds.has('compression') &&
      kinds.has('momentum') &&
      families.includes('flow')) ||
    hasHighBackdrop
      ? 'high'
      : 'standard'

  return {
    families,
    reasons,
    headline,
    tier,
    regime,
    direction,
  }
}
