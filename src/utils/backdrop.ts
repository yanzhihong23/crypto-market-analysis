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

export type BackdropKind =
  | 'daily-coil'
  | 'range-position'
  | 'vol-regime'
  | 'oi-percentile'
  | 'funding-carry'
  | 'relative-strength'

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
  /**
   * The month's extremes the position above is a share of.
   *
   * Carried alongside rather than left implied: half of a range means nothing
   * without the range, and a surface with room to print both should. The card
   * has room for neither and shows the marker instead, which says the same
   * thing in the space it has.
   */
  range: { low: number; high: number } | null
  /**
   * What this has done against BTC over each window, in percentage points.
   *
   * A field rather than a reading, and for the reason `rangePosition` is one:
   * it is always defined, always worth knowing, and has no honest threshold of
   * its own. Ten points behind BTC over a month is a fact about the symbol; it
   * is only news once the rest of the market has been taken out of it, which is
   * what the reading below does and what this deliberately does not.
   */
  relative: { excess7d: number; excess30d: number } | null
  /** The ones with something to say right now. */
  readings: BackdropReading[]
}

export interface BackdropInput {
  /** Live, off the ticker feed: the yardstick is slow but the price is not. */
  last: number
  daily?: DailyStats | null
  /** Where open interest sits in its own hundred days, 0 to 1. */
  oiPercentile?: number | null
  /** What a long has paid to hold this for a week, in the card's unit. */
  fundingCarry?: number | null
  /**
   * The benchmark's own daily stats. BTC, and fetched whether or not anybody is
   * watching it: the point of a benchmark is that it does not depend on what is
   * on the board.
   */
  benchmark?: DailyStats | null
  /**
   * The middle of the board's excess returns over BTC, in points, or null when
   * too few symbols are being watched for a middle to mean anything.
   */
  boardExcess30d?: number | null
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
 * How far into its own hundred days open interest has to sit before the level is
 * worth naming. A decile at each end, the bar the coil is held to and for the
 * same reason: this is a percentile of a series that always has a top and a
 * bottom, so unlike a sigma test it is meant to describe roughly a tenth of the
 * board at all times rather than nothing on a calm afternoon.
 *
 * Measured across 29 instruments it put three in the top decile and three in the
 * bottom, with the middle of the board at the 46th percentile — centred, and
 * flagging a fifth of it in total. That is a great deal to say out loud for a
 * reading that rang a card, and nothing at all for one that only ever adds a
 * sentence to a card something else has already put up.
 */
const OI_EDGE_SHARE = 0.1

/**
 * A week's carry, in tenths of a basis point, past which holding this has cost
 * real money rather than the usual toll.
 *
 * A fixed band, and it earns one the way the basis does: a cost of carry as a
 * share of notional is already per instrument, has a real zero, and means the
 * same thing on BTC as on a small cap. There is also no baseline to be had —
 * a hundred settlements is thirty-three days, so a series of weekly sums drawn
 * from it is five independent numbers, and the overlapping windows that would
 * pad it out to twenty are still five weeks of information wearing a disguise.
 *
 * Forty is about twenty-one percent a year. Measured across 29 instruments in a
 * quiet week the whole board sat between -15.6 and +19.2, median 9.1 in
 * absolute terms, so this fires on none of them today — which is the intent
 * rather than a miscalibration. What it is for is the market where the majors
 * run at three figures annualised, and a band set at this week's ninetieth
 * percentile would report the top of a calm distribution as a crowded trade.
 */
const MAX_WEEKLY_CARRY = 40

/**
 * How far a month's return has to sit from the board's before the symbol is
 * doing something the market is not.
 *
 * Netted against the board and not against zero, and the measurement is the
 * whole argument for it. Across 39 instruments the median excess over BTC was
 * **−10.1 points** — the alt market as a whole was a tenth behind BTC on the
 * month, so a symmetric band around zero would have flagged fourteen of them,
 * almost all underperformers, and reported that fact about the market as if it
 * were a fact about each symbol. Netting the middle out re-centres the spread
 * on zero by construction and leaves what is actually per-symbol.
 *
 * Twenty points on the netted figure flags 4 of the 39, which is the shape the
 * rest of this layer has: a tenth of the board at the extremes rather than
 * nothing on a quiet month. Fifteen would flag 18% and twenty-five 5%.
 */
const MIN_RELATIVE_EXCESS = 20

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

/**
 * How much leverage is standing on this contract, against how much usually is.
 *
 * The five-minute open interest reading says what just arrived or left. This says
 * what has accumulated: a contract carrying more open positions than on ninety of
 * the last hundred days has a crowd on it whether or not anything happened in the
 * last five minutes, and that crowd is what a move has to move through.
 *
 * The other end is worth saying too, and is not merely the absence of the first.
 * Open interest at its own hundred-day low is a contract nobody is positioned in,
 * which alongside a coil is the same picture twice — no leverage, no range, and
 * nothing yet to unwind.
 */
function oiPercentileReading(
  percentile: number | null | undefined,
  t: Messages,
): BackdropReading | null {
  if (percentile == null || !Number.isFinite(percentile)) return null
  if (percentile > OI_EDGE_SHARE && percentile < 1 - OI_EDGE_SHARE) return null

  const percent = Math.round(percentile * 100)
  const crowded = percentile >= 0.5
  return {
    kind: 'oi-percentile',
    label: crowded ? t.backdrop.oiCrowded : t.backdrop.oiEmpty,
    detail: t.backdrop.oiPercentileDetail(percent, crowded),
  }
}

/**
 * What the week actually cost the side that is long.
 *
 * `funding` says the rate is unusual for this instrument and `funding-shift`
 * says it has just moved; both are about one settlement. This is about
 * twenty-one of them, and it is the only one of the three that answers what
 * holding the position has been worth — a rate too ordinary to flag, charged
 * every eight hours for a week, is how a crowded trade is actually paid for.
 */
function fundingCarryReading(
  carry: number | null | undefined,
  t: Messages,
): BackdropReading | null {
  if (carry == null || !Number.isFinite(carry)) return null
  if (Math.abs(carry) < MAX_WEEKLY_CARRY) return null

  // Signed on the chip, where it follows the funding rate's own convention and
  // the sign is all there is room for. Unsigned in the sentence, which names the
  // side that paid — "shorts paid -59" says the opposite of what it means.
  const signed = `${carry > 0 ? '+' : ''}${carry.toFixed(0)}‱`
  const paid = `${Math.abs(carry).toFixed(0)}‱`
  // Annualised as well, because a week of tenths of a basis point is not a
  // number anyone holds an opinion about until it is a rate per year.
  const annual = `${Math.abs((carry / 100) * 52).toFixed(0)}%`
  return {
    kind: 'funding-carry',
    label: t.backdrop.fundingCarry(signed),
    detail: t.backdrop.fundingCarryDetail(paid, annual, carry > 0),
  }
}

/**
 * What this has done against BTC, over each window. Null without both series,
 * and zero on BTC itself, which is correct rather than a special case.
 */
export function relativeOf({ daily, benchmark }: BackdropInput) {
  if (!daily || !benchmark) return null

  const excess7d = daily.return7d - benchmark.return7d
  const excess30d = daily.return30d - benchmark.return30d
  // Both ends checked rather than trusted. These are derived figures out of a
  // persisted store, and a record written by a build that computed fewer of
  // them arrives here with the field simply absent — which subtracts to NaN and
  // reaches the screen as one, because NaN is a number and every guard above
  // asks whether there is one. The store is versioned so that does not happen;
  // this is what makes it not matter if it does.
  if (!Number.isFinite(excess7d) || !Number.isFinite(excess30d)) return null

  return { excess7d, excess30d }
}

/**
 * A month spent going somewhere the rest of the board did not.
 *
 * Two subtractions, and both are load-bearing. Taking BTC out removes the one
 * factor every one of these instruments moves on; taking the board's middle out
 * removes the second — that alts as a class run ahead of or behind BTC for
 * weeks at a time, which is a fact about the market and not about any symbol in
 * it. What is left is the part that belongs to this contract.
 *
 * This is the intraday `strength` reading at a horizon of a month, and it is
 * netted the same way and for the same reason: subtracting the middle is the
 * difference between "everything is down against BTC" and "this one is".
 */
function relativeStrengthReading(
  input: BackdropInput,
  relative: { excess30d: number } | null,
  t: Messages,
): BackdropReading | null {
  if (!relative || input.boardExcess30d == null) return null

  const netted = relative.excess30d - input.boardExcess30d
  if (Math.abs(netted) < MIN_RELATIVE_EXCESS) return null

  // Signed on the chip, where the sign is the reading; unsigned in the
  // sentence, which says "leading" or "lagging" and would otherwise say it
  // twice — once in a word and once in a minus.
  const signed = `${netted > 0 ? '+' : ''}${netted.toFixed(0)}%`
  const size = `${Math.abs(netted).toFixed(0)}%`
  return {
    kind: 'relative-strength',
    label: t.backdrop.relativeStrength(signed),
    detail: t.backdrop.relativeStrengthDetail(size, netted > 0),
  }
}

export function collectBackdrop(input: BackdropInput, t: Messages): Backdrop {
  const rangePosition = rangePositionOf(input)
  const relative = relativeOf(input)

  return {
    rangePosition,
    relative,
    range: input.daily
      ? { low: input.daily.low30d, high: input.daily.high30d }
      : null,
    readings: [
      rangePositionReading(rangePosition, t),
      dailyCoilReading(input.daily?.coil, t),
      volRegimeReading(input.daily, t),
      oiPercentileReading(input.oiPercentile, t),
      fundingCarryReading(input.fundingCarry, t),
      relativeStrengthReading(input, relative, t),
    ].filter((reading): reading is BackdropReading => reading !== null),
  }
}
