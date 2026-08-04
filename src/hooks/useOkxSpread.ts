import { useCallback, useSyncExternalStore } from 'react'

import { getOkxSpread, subscribeOkxSpread } from '../store/okxRealtimeSpread'

/**
 * The book's current spread and what it has been charging, republished when a
 * sample lands — every five seconds per instrument, which is as often as the
 * middle of the last half minute can differ.
 */
export function useOkxSpreadRead(instId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeOkxSpread(instId, listener),
    [instId],
  )
  const getSnapshot = useCallback(() => getOkxSpread(instId), [instId])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
