/**
 * The candle series the board already holds, read as statistics rather than as
 * a chart.
 *
 * Nothing here costs a request: every watched symbol keeps a day of candles for
 * its sparkline, and a day of them is a large enough sample for "is this bar's
 * volume unusual for this instrument" to have an answer. The work is cached
 * against the array it was derived from, which is exactly the right lifetime —
 * the poll replaces the array wholesale once a minute, so a stale entry becomes
 * unreachable at the moment it stops being true.
 */

import { OkxKline } from '../types/okx'

import { Baseline, baselineOf } from './signals'

/** What a series with no bar spacing to measure is assumed to be. */
const FALLBACK_BAR_MS = 1000 * 60 * 15

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
