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
    if (!instIds.length) return
    timerRef.current = setTimeout(updateAllKlines, 1000 * 60) // 1 minute

    try {
      for (const instId of instIds) {
        await updateKlinesByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch klines:', error)
    }
  }, [instIds, updateKlinesByInstId])

  useEffect(() => {
    updateAllKlines()
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [instIds, openTime, updateAllKlines])

  return { updateKlinesByInstId }
}
