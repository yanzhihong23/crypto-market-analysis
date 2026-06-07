import { useCallback, useRef, useSyncExternalStore } from 'react'

import {
  getEmptyTicker,
  getOkxTickerSnapshot,
  subscribeOkxTicker,
} from '../store/okxRealtimeTicker'
import { OkxTickerFormatted } from '../types/okx'

export default function useOkxTicker(instId: string): OkxTickerFormatted {
  const emptyTickerRef = useRef<OkxTickerFormatted | null>(null)
  if (!emptyTickerRef.current) {
    emptyTickerRef.current = getEmptyTicker(instId)
  }

  const subscribe = useCallback(
    (listener: () => void) => subscribeOkxTicker(instId, listener),
    [instId],
  )

  const getSnapshot = useCallback(
    () => getOkxTickerSnapshot(instId) ?? emptyTickerRef.current!,
    [instId],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
