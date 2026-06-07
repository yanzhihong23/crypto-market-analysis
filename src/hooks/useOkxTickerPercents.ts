import { useCallback, useRef, useSyncExternalStore } from 'react'

import {
  getOkxPercentSnapshot,
  subscribeOkxPercent,
} from '../store/okxRealtimeTicker'

export default function useOkxTickerPercents(instIds: string[]) {
  const snapshotRef = useRef<number[]>([])

  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubs = instIds.map((instId) =>
        subscribeOkxPercent(instId, listener),
      )
      return () => {
        unsubs.forEach((unsub) => unsub())
      }
    },
    [instIds],
  )

  const getSnapshot = useCallback(() => {
    const next = instIds.map((instId) => getOkxPercentSnapshot(instId))
    const prev = snapshotRef.current
    if (
      prev.length === next.length &&
      prev.every((value, index) => value === next[index])
    ) {
      return prev
    }
    snapshotRef.current = next
    return next
  }, [instIds])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
