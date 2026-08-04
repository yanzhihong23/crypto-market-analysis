import { useCallback, useSyncExternalStore } from 'react'

import {
  getOkxLiquidation,
  subscribeOkxLiquidation,
} from '../store/okxRealtimeLiquidation'

/**
 * What has been closed out on this instrument in the last five minutes,
 * republished when one lands and again when the oldest falls out of the window.
 */
export function useOkxLiquidationRead(instId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeOkxLiquidation(instId, listener),
    [instId],
  )
  const getSnapshot = useCallback(() => getOkxLiquidation(instId), [instId])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
