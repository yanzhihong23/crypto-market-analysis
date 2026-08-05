import { useTickerStore } from '../store/useTickerStore'
import { readBackdrop } from '../store/okxBackdropInput'
import { useMessages } from '../i18n'
import type { Backdrop } from '../utils/backdrop'

import useOkxTicker from './useOkxTicker'

/**
 * The medium-term state of one instrument, kept current.
 *
 * The two hooks below are subscriptions rather than inputs — `readBackdrop`
 * reaches both sources itself — and they are what tell React that a price tick
 * or the hourly yardstick landing is a reason to ask again. Going through
 * `readBackdrop` rather than assembling the input here is the same arrangement
 * the signals are on: the alert pass is not a render and cannot use a hook, so
 * what it reads and what the screen shows have to be one function.
 *
 * Not memoised, because there is nothing to memoise: three comparisons and a
 * sentence, against a price that has usually changed anyway.
 */
export default function useOkxBackdrop(instId: string): Backdrop {
  const t = useMessages()

  useOkxTicker(instId)
  useTickerStore((state) => state.dailyStats[instId])
  // Written on the same pass as the stats above, so it needs no subscription of
  // its own — it has one anyway, because sharing a write is the updater's
  // arrangement rather than this file's, and a later split should not silently
  // stop the screen updating.
  useTickerStore((state) => state.dailyOiPercentile[instId])
  // This one genuinely arrives on a different poller.
  useTickerStore((state) => state.fundingCarry[instId])
  // And this one is not keyed by instrument at all: it is the market the
  // symbol is being measured against, so every card watches the same value.
  useTickerStore((state) => state.benchmarkDaily)

  return readBackdrop(instId, t)
}
