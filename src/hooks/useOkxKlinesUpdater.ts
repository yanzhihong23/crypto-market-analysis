import { useEffect, useRef } from 'react'
import { useCallback } from 'react'

import { fetchOkxKlines } from '../apis'
import { useTickerStore } from '../store/useTickerStore'

const POLL_INTERVAL_MS = 1000 * 60

export default function useOkxKlinesUpdater() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const instIds = useTickerStore((state) => state.instIds)
  const openTime = useTickerStore((state) => state.openTime)
  const setKlines = useTickerStore((state) => state.setKlines)

  const updateKlinesByInstId = useCallback(
    async (instId: string) => {
      const kline = await fetchOkxKlines({ instId, openTime })
      setKlines(instId, kline, kline.reduce((a, b) => +a + +b[7], 0).toString())
    },
    [setKlines, openTime],
  )

  const updateAllRef = useRef<() => Promise<void>>(async () => {})

  const updateAllKlines = useCallback(async () => {
    // There is one chain and the ref holds its only timer. This used to be
    // started from two effects at once, which left a second chain running that
    // nothing held a handle to: every symbol was fetched twice a minute and
    // written to the persisted store twice as often, forever.
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void updateAllRef.current()
    }, POLL_INTERVAL_MS)

    try {
      // Read off the store rather than closed over, so the loop follows the
      // watchlist without having to be restarted when it changes.
      for (const instId of useTickerStore.getState().instIds) {
        await updateKlinesByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch klines:', error)
    }
  }, [updateKlinesByInstId])

  updateAllRef.current = updateAllKlines

  const prevInstIdsRef = useRef<string[]>([])
  const firstPassRef = useRef(true)

  // Newly added symbols only, so they draw a chart without waiting out the
  // poll. The first run is the mount, where the loop's own opening pass covers
  // the whole watchlist.
  useEffect(() => {
    const prevInstIds = prevInstIdsRef.current
    const addedInstIds = instIds.filter((id) => !prevInstIds.includes(id))
    prevInstIdsRef.current = instIds

    if (firstPassRef.current) {
      firstPassRef.current = false
      return
    }
    if (!addedInstIds.length) return

    void Promise.all(addedInstIds.map((id) => updateKlinesByInstId(id)))
  }, [instIds, updateKlinesByInstId])

  // Refetches on an open change as well as on mount: the candles are cut to the
  // session, so every one of them is for the wrong window once it moves.
  useEffect(() => {
    void updateAllRef.current()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [openTime])

  return { updateKlinesByInstId }
}
