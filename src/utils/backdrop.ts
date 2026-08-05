/**
 * What has been true of an instrument for weeks, as opposed to what has just
 * happened to it.
 *
 * Everything in `detectors.ts` reports an event: something moved, somebody
 * traded, the book widened. Everything here reports a state — where the price
 * sits in its month, how tightly it has been trading, which way its volatility
 * is heading — and a state is true continuously for days at a time.
 *
 * That difference is why these are not `Signal`s. The ring rule counts readings
 * that are firing, and a reading which is simply *true* for a fortnight would
 * hand every five-minute twitch a second family for free, so the ring would
 * light on the whole board and stop meaning anything. `compression` already ran
 * into this on the intraday side and is kept out of the count by a list in
 * `signals.ts` that somebody has to remember to maintain; here the layers have
 * no type in common, so nothing to remember.
 *
 * These readings are not weighed against each other and there is no score. The
 * daily coil and a contracting volatility regime describe overlapping facts and
 * will often speak together, which would be a problem if they were votes; they
 * are sentences, so it is not one.
 *
 * As in `detectors.ts`, each reading writes its own sentence and hands the
 * dictionary its finished numbers.
 */

import type { Messages } from '../i18n/en'

import { Coil, DailyStats } from './klineStats'

export type BackdropKind = 'daily-coil' | 'range-position' | 'vol-regime'

export interface BackdropReading {
  kind: BackdropKind
  /** Chip-sized: the reading and nothing else. */
  label: string
  /** One line, for a tooltip and for the context a fired alert carries. */
  detail: string
}

export interface Backdrop {
  /**
   * Where the price sits between the month's low and its high, 0 to 1. Outside
   * that when it has left the range altogether, which is the state the 7 and 30
   * day breakout will read; nothing here clamps it away.
   *
   * The one figure that is always available and always has a direction, which is
   * why it is a field rather than a reading: the card's edge is drawn from it
   * whether or not anything is worth saying out loud.
   */
  rangePosition: number | null
  /** The ones with something to say right now. */
  readings: BackdropReading[]
}

export interface BackdropInput {
  /** Live, off the ticker feed: the yardstick is slow but the price is not. */
  last: number
  daily?: DailyStats | null
}

/**
 * How near an end of the month's range counts as being at that end. A tenth
 * either way, which on a range that spans a real month is a week's worth of
 * price — near enough that the next move decides whether it breaks or turns.
 */
const EDGE_SHARE = 0.1

/**
 * The bar the intraday coil is held to, for the same reasons it is held to it:
 * the bottom tenth of its own history, and a fifth tighter than the middle
 * stretch so a fortnight with no range to speak of does not report its quietest
 * three days as news. Restated here rather than shared, so the two horizons can
 * be tuned apart without one silently moving the other.
 */
const COIL_PERCENTILE = 0.9
const MAX_COIL_SHARE = 0.8

/**
 * How far the week has to be from the month before the volatility has changed
 * regime rather than wandered. Half again as wide, or the reciprocal of that —
 * symmetric in ratio, since this is a quotient and not a difference.
 *
 * Both directions, unlike the intraday range which only ever reports an
 * expansion. Over a month a contraction is the more useful half: a week trading
 * at two thirds of its month is the setup, and the expansion that ends it is
 * what the five-minute readings are already watching for.
 */
const REGIME_EXPANSION = 1.5
const REGIME_CONTRACTION = 1 / REGIME_EXPANSION

/**
 * Where the price sits in the month, as a share of the month's range.
 *
 * Exported on its own because it is the field rather than a reading: the caller
 * wants the number whether or not it is near enough an end to be worth a
 * sentence.
 */
export function rangePositionOf({ last, daily }: BackdropInput): number | null {
  if (!daily || !(last > 0)) return null

  const span = daily.high30d - daily.low30d
  if (!(span > 0)) return null

  return (last - daily.low30d) / span
}

/**
 * At one end of the month. The intraday `breakout` says the same thing about a
 * day, and the two are worth having together rather than instead of each other:
 * a new 24h high a tenth of the way up the month is a bounce, and the same high
 * at the top of the month is the month's high about to go.
 */
function rangePositionReading(
  position: number | null,
  t: Messages,
): BackdropReading | null {
  if (position === null) return null
  if (position > EDGE_SHARE && position < 1 - EDGE_SHARE) return null

  // Clamped for the sentence only. A price through the month's high reads as
  // 100%, and that it went further is the breakout's line to say, not this one's.
  const percent = Math.round(Math.min(Math.max(position, 0), 1) * 100)
  const high = position >= 0.5
  return {
    kind: 'range-position',
    label: high ? t.backdrop.rangePositionHigh : t.backdrop.rangePositionLow,
    detail: t.backdrop.rangePositionDetail(percent, high),
  }
}

/**
 * The last three days trading in less room than this instrument has taken all
 * year. The intraday coil with a fortnight's patience: what that one finds is
 * often lunchtime, and what this one finds is a range that has been winding in
 * since before the week started.
 */
function dailyCoilReading(
  coil: Coil | null | undefined,
  t: Messages,
): BackdropReading | null {
  if (!coil) return null
  if (coil.quieterThan < COIL_PERCENTILE) return null

  const share = coil.recent / coil.typical
  if (share > MAX_COIL_SHARE) return null

  const shareLabel = share.toFixed(1)
  return {
    kind: 'daily-coil',
    label: t.backdrop.dailyCoil(shareLabel),
    detail: t.backdrop.dailyCoilDetail(
      shareLabel,
      Math.round(coil.quieterThan * 100),
    ),
  }
}

/**
 * The week against the month. Not a bar against the spread of bars, which is
 * what the intraday volatility reading is — that says today was big, and this
 * says the market this instrument trades in has changed gear.
 */
function volRegimeReading(
  daily: DailyStats | null | undefined,
  t: Messages,
): BackdropReading | null {
  if (!daily || !(daily.range30d > 0)) return null

  const ratio = daily.range7d / daily.range30d
  if (ratio < REGIME_EXPANSION && ratio > REGIME_CONTRACTION) return null

  const ratioLabel = ratio.toFixed(1)
  return {
    kind: 'vol-regime',
    label: t.backdrop.volRegime(ratioLabel),
    detail: t.backdrop.volRegimeDetail(ratioLabel, ratio >= 1),
  }
}

export function collectBackdrop(input: BackdropInput, t: Messages): Backdrop {
  const rangePosition = rangePositionOf(input)

  return {
    rangePosition,
    readings: [
      rangePositionReading(rangePosition, t),
      dailyCoilReading(input.daily?.coil, t),
      volRegimeReading(input.daily, t),
    ].filter((reading): reading is BackdropReading => reading !== null),
  }
}
