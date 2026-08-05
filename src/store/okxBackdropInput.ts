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
import type { Messages } from '../i18n/en'

import { getOkxTickerSnapshot } from './okxRealtimeTicker'
import { useTickerStore } from './useTickerStore'

export function readBackdrop(instId: string, t: Messages): Backdrop {
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
    },
    t,
  )
}
