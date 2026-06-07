import { useEffect, useRef } from 'react'
import { useCallback } from 'react'

import { fetchOkxKlines } from '../apis'
import { useTickerStore } from '../store/useTickerStore'

export default function useOkxKlinesUpdater() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const instIds = useTickerStore((state) => state.instIds)
  const openTime = useTickerStore((state) => state.openTime)
  const setKlineData = useTickerStore((state) => state.setKlineData)
  const setVolCcyQuote = useTickerStore((state) => state.setVolCcyQuote)

  const updateKlinesByInstId = useCallback(
    async (instId: string) => {
      const kline = await fetchOkxKlines({ instId, openTime })
      setKlineData(instId, kline)
      setVolCcyQuote(instId, kline.reduce((a, b) => +a + +b[7], 0).toString())
    },
    [setKlineData, setVolCcyQuote, openTime],
  )

  const updateAllKlines = useCallback(async () => {
    const currentInstIds = useTickerStore.getState().instIds
    if (!currentInstIds.length) return
    timerRef.current = setTimeout(updateAllKlines, 1000 * 60) // 1 minute

    try {
      for (const instId of currentInstIds) {
        await updateKlinesByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch klines:', error)
    }
  }, [updateKlinesByInstId])

  const prevInstIdsRef = useRef<string[]>([])

  useEffect(() => {
    const prevInstIds = prevInstIdsRef.current
    const addedInstIds = instIds.filter((id) => !prevInstIds.includes(id))
    prevInstIdsRef.current = instIds

    if (!instIds.length) return

    if (prevInstIds.length === 0) {
      updateAllKlines()
      return
    }

    if (addedInstIds.length > 0) {
      void Promise.all(addedInstIds.map((id) => updateKlinesByInstId(id)))
    }
  }, [instIds, updateAllKlines, updateKlinesByInstId])

  useEffect(() => {
    if (!useTickerStore.getState().instIds.length) return
    updateAllKlines()
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [openTime, updateAllKlines])

  return { updateKlinesByInstId }
}
