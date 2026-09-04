/**
 * Candle series read as statistics rather than as a chart.
 *
 * `klineStatsOf` costs nothing: every watched symbol keeps a day of candles for
 * its sparkline, and a day of them is a large enough sample for "is this bar's
 * volume unusual for this instrument" to have an answer. The work is cached
 * against the array it was derived from, which is exactly the right lifetime —
 * the poll replaces the array wholesale once a minute, so a stale entry becomes
 * unreachable at the moment it stops being true.
 *
 * The other two take candles somebody had to fetch — `coilOf` the uncut
 * five-minute series behind the momentum baseline, `dailyStatsOf` a series of
 * daily bars — and are pure all the same. What they cost is decided by whoever
 * calls them; what they mean is decided here.
 */

import { OkxKline } from '../types/okx'

import { Baseline, baselineOf, medianOf } from './signals'

/** What a series with no bar spacing to measure is assumed to be. */
const FALLBACK_BAR_MS = 1000 * 60 * 15

/**
 * How many bars make up a stretch, when the caller does not say. Twenty-four of
 * the five-minute bars the momentum baseline is taken over is two hours — long
 * enough that a couple of quiet bars inside a busy afternoon do not make one,
 * short enough to still be the stretch the price is in rather than the one it
 * was in this morning.
 *
 * A parameter rather than a constant because the same measurement is worth
 * taking at more than one horizon: three of the daily bars below is the same
 * question asked of a fortnight instead of an afternoon.
 */
const COIL_BARS = 24

/**
 * Stretches needed before one of them can be called the quiet end of anything.
 * The hundred-bar series this is taken over yields seventy-seven, so this is a
 * guard against a short or gappy reply rather than a bar that is ever near.
 */
const MIN_COIL_WINDOWS = 40

export interface Coil {
  /** Mean bar range across the newest stretch, in percent. */
  recent: number
  /** The middle stretch of the series, which is what "usual" means here. */
  typical: number
  /**
   * Share of the series' stretches this one is quieter than, 0 to 1.
   *
   * A percentile rather than a distance in sigmas, and deliberately: a bar range
   * is bounded below by zero and has its whole tail on the upside, so the mean
   * minus three sigmas is routinely a negative number and nothing could ever be
   * three sigma *quiet*. Stretches overlap by all but one bar, so this is "how
   * does the last two hours compare with every two hours in the series" and not
   * a draw from anything independent — which is the question anyway.
   */
  quieterThan: number
}

export interface KlineStats {
  /** Bar length, taken off the series rather than assumed. */
  barMs: number
  /** Quote volume per closed bar. */
  volume: Baseline | null
  /** Range as a share of close, per closed bar, in percent. */
  range: Baseline | null
  /** Newest bar that has finished. Everything measured against a full bar. */
  closed: OkxKline | null
  /** The bar still forming, when the feed sent one. */
  forming: OkxKline | null
}

/**
 * How quiet the newest stretch of a series is against every other stretch in it.
 *
 * Takes its own candles rather than reading the sparkline's, and it has to: the
 * board's candles are cut to the session open, so for the first half of every
 * day there are not enough of them to have a quiet end — the reading would be
 * missing exactly when the overnight range it describes is most worth knowing.
 * The uncut hundred bars the momentum baseline already fetches have no such
 * hole, and cost nothing extra, which is why this is called from there.
 *
 * Bars arrive newest first, so the newest stretch is the first window.
 */
export function coilOf(klines?: OkxKline[], bars = COIL_BARS): Coil | null {
  const ranges = (klines ?? [])
    .map((kline) => barRangePercent(kline))
    .filter((value): value is number => value !== null)

  const windows: number[] = []
  for (let start = 0; start + bars <= ranges.length; start++) {
    let sum = 0
    for (let i = start; i < start + bars; i++) sum += ranges[i]
    windows.push(sum / bars)
  }
  if (windows.length < MIN_COIL_WINDOWS) return null

  const recent = windows[0]
  const typical = medianOf(windows)
  if (typical === null || !(typical > 0)) return null

  return {
    recent,
    typical,
    quieterThan:
      windows.filter((window) => window > recent).length / windows.length,
  }
}

/**
 * Percent moves bar to bar, off a series that arrives newest first.
 *
 * The spread of these is what makes a return at one period comparable with a
 * return at another: a fifth of a percent is a violent fifteen minutes and a
 * quiet day, and only its own distribution says which this one is.
 */
export function barReturnsOf(klines?: OkxKline[]) {
  const closes = (klines ?? []).map((kline) => Number(kline[4]))
  return closes
    .slice(0, -1)
    .map((close, index) => {
      const previous = closes[index + 1]
      return previous > 0 ? ((close - previous) / previous) * 100 : NaN
    })
    .filter((value) => Number.isFinite(value))
}

/** Range as a share of the close, which is what makes bars comparable at all. */
export function barRangePercent(kline: OkxKline) {
  const high = Number(kline[2])
  const low = Number(kline[3])
  const close = Number(kline[4])
  if (!(close > 0) || !Number.isFinite(high) || !Number.isFinite(low)) {
    return null
  }
  return ((high - low) / close) * 100
}

/**
 * Daily bars behind the two windows below. A month is the reference the whole
 * backdrop layer is stated against, and a week is the recent half of it.
 */
const DAILY_BARS_MONTH = 30
const DAILY_BARS_WEEK = 7

/**
 * Stretch length for the daily coil. Three days against every three days in the
 * series, which is the same question the two-hour one asks of an afternoon: long
 * enough that one quiet day inside a busy fortnight does not make one, short
 * enough to still be the stretch the price is in.
 */
const DAILY_COIL_BARS = 3

/**
 * The yardstick a symbol's medium-term position is read against.
 *
 * Every field here is slow — the shortest of them is a week — which is what
 * makes it worth fetching, deriving once and persisting. What it deliberately
 * does not hold is any reading: where the price sits inside `high30d`/`low30d`
 * is current to the second and belongs to whoever asks, the same way the
 * momentum baseline is stored and the move it measures is not.
 */
export interface DailyStats {
  high30d: number
  low30d: number
  /** The same over a week, for the shorter of the two breakout tests. */
  high7d: number
  low7d: number
  /** Mean daily range, in percent, over the last week and the last month. */
  range7d: number
  range30d: number
  /**
   * What the price has actually done over each window, in percent.
   *
   * The only field here that is worth nothing on its own. Everything else
   * describes this instrument against its own history; a return only becomes a
   * reading once something else has been subtracted from it — which is why it
   * is carried rather than read, and why what subtracts from it lives elsewhere.
   */
  return7d: number
  return30d: number
  /** Where the last three days sit among every three days in the series. */
  coil: Coil | null
}

/**
 * Whether a value off the persisted store is a `DailyStats` this build can read.
 *
 * Every field is checked rather than the object's presence, because the failure
 * this exists for is a record that looks complete and is not: one written before
 * this shape grew a field arrives with that field absent, passes any null check
 * guarding it, and yields undefined only where something reaches through it. A
 * subtraction downstream then produces NaN, which is a number, and every test
 * after that asks whether there is one.
 */
/** The fields of `DailyStats` that are plain numbers, which is all but the coil. */
type NumericField = {
  [K in keyof DailyStats]: DailyStats[K] extends number ? K : never
}[keyof DailyStats]

/**
 * A record rather than a list, so the compiler holds it exhaustive: a numeric
 * field added to `DailyStats` will not build until it is named here. That is
 * the actual protection — the check below is easy to write and easy to forget
 * to extend, and forgetting to extend it is the whole bug it exists for.
 */
const NUMERIC_FIELDS: Record<NumericField, true> = {
  high30d: true,
  low30d: true,
  high7d: true,
  low7d: true,
  range7d: true,
  range30d: true,
  return7d: true,
  return30d: true,
}

export function isDailyStats(value: unknown): value is DailyStats {
  if (!value || typeof value !== 'object') return false
  const stats = value as Record<string, unknown>
  return Object.keys(NUMERIC_FIELDS).every((key) => Number.isFinite(stats[key]))
}

/** Highest high and lowest low across a stretch of bars. */
const extremesOf = (bars: OkxKline[]) => {
  let high = -Infinity
  let low = Infinity
  for (const bar of bars) {
    const barHigh = Number(bar[2])
    const barLow = Number(bar[3])
    if (Number.isFinite(barHigh)) high = Math.max(high, barHigh)
    if (Number.isFinite(barLow)) low = Math.min(low, barLow)
  }
  return high > 0 && low > 0 && high > low ? { high, low } : null
}

/** Close against the close `bars` ago, in percent. Newest first, so index up. */
const returnOver = (closed: OkxKline[], bars: number) => {
  const now = Number(closed[0]?.[4])
  const then = Number(closed[bars]?.[4])
  if (!(then > 0) || !Number.isFinite(now)) return null
  return ((now - then) / then) * 100
}

/** Mean bar range as a share of close, in percent, or null with nothing to mean. */
const meanRangeOf = (bars: OkxKline[]) => {
  const ranges = bars
    .map((bar) => barRangePercent(bar))
    .filter((value): value is number => value !== null)
  if (!ranges.length) return null
  return ranges.reduce((sum, range) => sum + range, 0) / ranges.length
}

/**
 * A month and a week of daily bars, read off a series of them.
 *
 * Closed bars only, and the forming one dropped rather than clipped: today's
 * high is a partial of what it will be, and letting it into the month's extremes
 * would mean a price that has just made a new high sits at exactly the top of
 * its own range by construction — which is the one state worth being able to
 * tell apart from being near it.
 *
 * Which makes where the day starts part of this function's contract, so the
 * caller fetches `1Dutc` rather than the exchange's default. Those bars are cut
 * at midnight Hong Kong, so a high made at breakfast there stays outside the
 * month for the rest of the day — while the ticker's rolling `high24h`, which
 * the card draws its range from, has had it since it printed. Two windows on
 * one screen disagreeing about the high of the same morning reads as a bug
 * whatever the reason for it. UTC does not remove the gap, it moves it to the
 * quieter side of the exchange's day.
 *
 * Bars arrive newest first, so the recent windows are the front of the series.
 */
export function dailyStatsOf(klines?: OkxKline[]): DailyStats | null {
  // One more bar than the windows need: a month's return is measured from the
  // close a month ago, so thirty bars describe the stretch and thirty-one are
  // needed to have both ends of it.
  const closed = (klines ?? []).filter((kline) => kline[8] === '1')
  if (closed.length < DAILY_BARS_MONTH + 1) return null

  const month = closed.slice(0, DAILY_BARS_MONTH)
  const week = closed.slice(0, DAILY_BARS_WEEK)

  const monthly = extremesOf(month)
  const weekly = extremesOf(week)
  const range30d = meanRangeOf(month)
  const range7d = meanRangeOf(week)
  const return30d = returnOver(closed, DAILY_BARS_MONTH)
  const return7d = returnOver(closed, DAILY_BARS_WEEK)
  if (!monthly || !weekly || !range30d || !range7d) return null
  if (return30d === null || return7d === null) return null

  return {
    high30d: monthly.high,
    low30d: monthly.low,
    high7d: weekly.high,
    low7d: weekly.low,
    range7d,
    range30d,
    return7d,
    return30d,
    // Over the whole series rather than the month: the percentile is only worth
    // as much as the history it ranks within, and the fetch already paid for it.
    coil: coilOf(closed, DAILY_COIL_BARS),
  }
}

const cache = new WeakMap<OkxKline[], KlineStats>()

/**
 * Candles arrive newest first, and the newest is usually still open. A partial
 * bar is a partial of everything on it — its volume and its range are both
 * short of what they will be — so it is kept apart rather than averaged in with
 * bars that finished.
 */
export function klineStatsOf(klines?: OkxKline[]): KlineStats | null {
  if (!klines?.length) return null

  const cached = cache.get(klines)
  if (cached) return cached

  const forming = klines[0]?.[8] === '0' ? klines[0] : null
  const closed = klines.find((kline) => kline[8] === '1') ?? null
  const closedBars = klines.filter((kline) => kline[8] === '1')

  const spacing =
    klines.length > 1
      ? Math.abs(Number(klines[0][0]) - Number(klines[1][0]))
      : 0

  const stats: KlineStats = {
    barMs: spacing > 0 ? spacing : FALLBACK_BAR_MS,
    volume: baselineOf(closedBars.map((kline) => Number(kline[7]))),
    range: baselineOf(
      closedBars
        .map((kline) => barRangePercent(kline))
        .filter((value): value is number => value !== null),
    ),
    closed,
    forming,
  }

  cache.set(klines, stats)
  return stats
}

/**
 * How far into the forming bar we are, 0 to 1, or null when there is no bar
 * forming or its stamp makes no sense against the clock.
 */
export function barElapsed(stats: KlineStats, now = Date.now()) {
  if (!stats.forming) return null
  const opened = Number(stats.forming[0])
  if (!Number.isFinite(opened)) return null
  const elapsed = (now - opened) / stats.barMs
  if (!(elapsed > 0)) return null
  return Math.min(elapsed, 1)
}

/**
 * Below this the forming bar is too short to extrapolate from: three minutes of
 * a fifteen-minute bar is the point where dividing by the elapsed share stops
 * turning one early trade into a tenfold surge.
 */
const MIN_ELAPSED_TO_PROJECT = 0.2

/**
 * The quote volume the forming bar is on course for, so a surge is visible
 * inside the bar it happens in rather than after it closes.
 *
 * Waiting for the close is the honest alternative and it costs a quarter of an
 * hour, which is most of the life of the move this is meant to catch. Scaling
 * by the elapsed share is the standard trade: it is noisy early, which is what
 * the floor above is for, and it converges on the real figure as the bar fills.
 */
export function projectedVolume(stats: KlineStats, now = Date.now()) {
  const elapsed = barElapsed(stats, now)
  if (elapsed === null || elapsed < MIN_ELAPSED_TO_PROJECT) return null
  const volume = Number(stats.forming?.[7])
  if (!Number.isFinite(volume)) return null
  return volume / elapsed
}
