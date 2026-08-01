import { useCallback, useSyncExternalStore } from 'react'

import {
  getOkxOpenInterestSnapshot,
  getOkxPercentSnapshot,
  subscribeOkxOpenInterest,
  subscribeOkxPercent,
} from '../store/okxRealtimeTicker'

/** Live open interest in contracts, or undefined before the first message. */
export function useOkxOpenInterest(instId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeOkxOpenInterest(instId, listener),
    [instId],
  )
  const getSnapshot = useCallback(
    () => getOkxOpenInterestSnapshot(instId),
    [instId],
  )
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * The card's 24h percent, off the throttled feed rather than the ticker itself.
 * The chips only need it to place the open interest move in a quadrant, and
 * subscribing to the ticker would re-render them on every tick to do it.
 */
export function useOkxPercent(instId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeOkxPercent(instId, listener),
    [instId],
  )
  const getSnapshot = useCallback(() => getOkxPercentSnapshot(instId), [instId])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
