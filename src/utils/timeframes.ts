/**
 * One instrument read at four bar sizes at once.
 *
 * The board asks what is happening now. This asks whether the quarter hour, the
 * hour, the four hours and the day agree about it — which is a different
 * question, and the one a chart gets opened to answer. A fifteen-minute burst
 * against a day that has been falling all week is not the same event as the same
 * burst with all four pointing one way, and nothing on the board can tell those
 * apart.
 *
 * The rule this file is built on is the board's own, one level up: the ring
 * fires when two families agree, and this fires nothing at all — it lays the
 * periods side by side and lets a reader see how many of them agree. What it is
 * deliberately not is a rating. Aggregating a dozen indicators into a score is
 * the thing every other terminal does here, and most of what it aggregates is
 * one measurement in three costumes; the honest version is a handful of readings
 * per period, each measured against that period's own history.
 *
 * Only candle-derived readings, and that is a hard limit rather than a choice:
 * the exchange's statistics endpoints are cut to 5m, 1H and 1D, so there is no
 * taker split or account ratio to be had at four hours. Rather than show a
 * column with a hole in it, the positioning readings stay out entirely and keep
 * their own place on the dialog.
 */

import { OkxKline, Period } from '../types/okx'
import type { Messages } from '../i18n/en'

import { rejectionSignal, volatilitySignal, volumeSignal } from './detectors'
import { Signal, baselineOf, deviationFrom } from './signals'
import { barReturnsOf, coilOf, klineStatsOf } from './klineStats'

/** The four the chart gets read at. Shortest first, the way a chart is scanned. */
export const TIMEFRAMES: Period[] = [
  Period.MINUTE_15,
  Period.HOUR_1,
  Period.HOUR_4,
  Period.DAY_1,
]

/**
 * Bars per period. Two hundred is enough for a spread to mean something at every
 * one of them and covers a useful stretch at each: two days of quarter hours,
 * eight days of hours, a month of four-hours, most of a year of days.
 */
export const TIMEFRAME_BARS = 200

/**
 * How many bars make a stretch when looking for a coil, at every period rather
 * than per period. The same measurement scaled: twenty-four quarter hours is six
 * hours, twenty-four days is most of a month, and in both cases it is "the
 * recent stretch" against every other stretch in the series.
 */
const COIL_BARS = 24

/**
 * The bar the board's own coil is held to, restated because the sentence is not.
 * The intraday one names its windows out loud — "the last 2h", "the last 8h" —
 * which is right on a card that only ever has one, and wrong here where the row
 * is already labelled with the period it belongs to.
 */
const COIL_PERCENTILE = 0.9
const MAX_COIL_SHARE = 0.8

export interface TimeframeRead {
  period: Period
  /**
   * The last closed bar's return, in percent. The column that makes the panel
   * worth having: four of these pointing the same way is the agreement, and one
   * of them alone is the thing a five-minute board would have shown you anyway.
   */
  returnPercent: number | null
  /**
   * How unusual that return is for this period. A day and a quarter hour cannot
   * be compared in percent — a fifth of a percent is a violent quarter hour and
   * a dead day — so the sigma is what makes the four columns one scale.
   */
  deviation: number | null
  /** Whatever else this period has to say, in the board's own words. */
  signals: Signal[]
  /** Where the last close sits between the series' extremes, 0 to 1. */
  position: number | null
}

/**
 * The coil at this period, worded without naming a window.
 *
 * Not `compressionSignal`, only because that one's sentence hard-codes the two
 * hours and eight hours it was written for. The test is the same test.
 */
function coilReading(klines: OkxKline[], t: Messages): Signal | null {
  const coil = coilOf(klines, COIL_BARS)
  if (!coil || coil.quieterThan < COIL_PERCENTILE) return null

  const share = coil.recent / coil.typical
  if (share > MAX_COIL_SHARE) return null

  const shareLabel = share.toFixed(1)
  return {
    kind: 'compression',
    deviation: null,
    label: t.timeframe.coil(shareLabel),
    detail: t.timeframe.coilDetail(
      shareLabel,
      Math.round(coil.quieterThan * 100),
    ),
  }
}

/**
 * What one period has to say, off its own candles.
 *
 * Closed bars only. Everything here is a bar against the spread of bars, and a
 * bar still being written is short of what it will be on every count — which is
 * a fair trade on a card reading five minutes and a poor one on a row labelled
 * `1d`, where extrapolating a day's volume from four hours of it would be the
 * loudest number in the panel and the least true.
 */
export function timeframeReadOf(
  period: Period,
  klines: OkxKline[] | undefined,
  t: Messages,
): TimeframeRead {
  const empty: TimeframeRead = {
    period,
    returnPercent: null,
    deviation: null,
    signals: [],
    position: null,
  }

  const closed = (klines ?? []).filter((kline) => kline[8] === '1')
  if (closed.length < 2) return empty

  const stats = klineStatsOf(closed)
  const returns = barReturnsOf(closed)
  const returnPercent = returns.length ? returns[0] : null
  const deviation =
    returnPercent === null
      ? null
      : deviationFrom(returnPercent, baselineOf(returns))

  const high = Math.max(...closed.map((kline) => Number(kline[2])))
  const low = Math.min(...closed.map((kline) => Number(kline[3])))
  const last = Number(closed[0]?.[4])
  const position =
    high > low && Number.isFinite(last)
      ? Math.min(Math.max((last - low) / (high - low), 0), 1)
      : null

  return {
    period,
    returnPercent,
    deviation,
    // The board's own detectors, unchanged: what makes a bar's range or its
    // volume unusual does not depend on how long the bar is, and a reading that
    // said it differently here would be a second opinion nobody asked for.
    signals: [
      volatilitySignal({ stats }, t),
      volumeSignal({ stats }, t),
      rejectionSignal({ stats }, t),
      coilReading(closed, t),
    ].filter((signal): signal is Signal => signal !== null),
    position,
  }
}

/**
 * How many of the periods are pointing the same way, and which way.
 *
 * The one number this panel does compute across periods, and it is a count
 * rather than a score: no reading is weighted against another, nothing is
 * aggregated, and a reader who disagrees with it can see every row it counted.
 */
export function timeframeAgreement(reads: TimeframeRead[]) {
  const moves = reads
    .map((read) => read.returnPercent)
    .filter((value): value is number => value !== null && value !== 0)
  if (moves.length < 2) return null

  const up = moves.filter((move) => move > 0).length
  const agreed = Math.max(up, moves.length - up)
  return { agreed, of: moves.length, up: up >= moves.length - up }
}
