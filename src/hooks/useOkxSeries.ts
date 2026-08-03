import { useCallback, useSyncExternalStore } from 'react'

import {
  getOkxIndexPrice,
  getOkxSeriesChange,
  indexInstIdOf,
  subscribeOkxIndexPrice,
  subscribeOkxSeries,
} from '../store/okxRealtimeSeries'

/**
 * The five-minute price and open interest moves, republished when a sample
 * lands rather than when one arrives — roughly once every ten seconds per
 * instrument, which is as often as a five-minute window can meaningfully differ.
 */
export function useOkxSeriesChange(instId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeOkxSeries(instId, listener),
    [instId],
  )
  const getSnapshot = useCallback(() => getOkxSeriesChange(instId), [instId])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Takes the contract, subscribes to the index it settles against. */
export function useOkxIndexPrice(instId: string) {
  const indexInstId = indexInstIdOf(instId)
  const subscribe = useCallback(
    (listener: () => void) => subscribeOkxIndexPrice(indexInstId, listener),
    [indexInstId],
  )
  const getSnapshot = useCallback(
    () => getOkxIndexPrice(indexInstId),
    [indexInstId],
  )
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
