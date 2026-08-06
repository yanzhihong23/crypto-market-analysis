/**
 * One instrument's medium-term state, gathered the way `okxSignalInput` gathers
 * its short-term one, and for the same reason: a caller that had to know which
 * half was polled and which is live is a caller that could get it wrong.
 *
 * The halves here are further apart than they are over there. The yardstick is
 * an hour old at worst and describes a month, so it comes out of the persisted
 * store; the price it is read against is off the ticker feed and current to the
 * second. Putting them together is the whole of this file.
 */

import { Backdrop, collectBackdrop } from '../utils/backdrop'
import { MIN_BOARD_SYMBOLS, medianOf } from '../utils/signals'
import type { Messages } from '../i18n/en'

import { getOkxTickerSnapshot } from './okxRealtimeTicker'
import { useTickerStore } from './useTickerStore'

/**
 * The middle of the board's excess returns over the benchmark, in points.
 *
 * The daily counterpart of `boardMedianPricePercent`, and it does the same job
 * one horizon up: subtracting it is what separates "everything is behind BTC
 * this month" from "this one is". A median rather than a mean, because the one
 * symbol that halved would otherwise drag the middle down with it.
 *
 * Exported so a caller walking the whole board can take it once rather than
 * once per symbol, which is the same bargain the signal input offers.
 */
export function boardExcess30d(instIds: string[]) {
  const state = useTickerStore.getState()
  const benchmark = state.benchmarkDaily
  if (!benchmark) return null

  const excesses = instIds
    .map((instId) => state.dailyStats[instId])
    .filter((daily): daily is NonNullable<typeof daily> => !!daily)
    .map((daily) => daily.return30d - benchmark.return30d)

  return excesses.length >= MIN_BOARD_SYMBOLS ? medianOf(excesses) : null
}

export function readBackdrop(
  instId: string,
  t: Messages,
  { boardExcess }: { boardExcess?: number | null } = {},
): Backdrop {
  const state = useTickerStore.getState()
  const ticker = getOkxTickerSnapshot(instId)

  return collectBackdrop(
    {
      last: Number(ticker?.last),
      daily: state.dailyStats[instId],
      oiPercentile: state.dailyOiPercentile[instId],
      // Off the funding poller rather than the daily one, which is where the
      // history it is summed from was already being fetched.
      fundingCarry: state.fundingCarry[instId],
      benchmark: state.benchmarkDaily,
      boardExcess30d: boardExcess ?? boardExcess30d(state.instIds),
    },
    t,
  )
}
