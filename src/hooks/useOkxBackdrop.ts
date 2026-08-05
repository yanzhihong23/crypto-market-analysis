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

  return readBackdrop(instId, t)
}
