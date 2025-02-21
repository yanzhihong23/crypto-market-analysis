import { useEffect } from 'react'
import { useCallback } from 'react'

import { fetchOkxKlines } from '../apis'
import { useTickerStore } from '../store/useTickerStore'

export default function useOkxKlinesUpdater() {
  const instIds = useTickerStore((state) => state.instIds)
  const setKlineData = useTickerStore((state) => state.setKlineData)
  const setVolCcyQuote = useTickerStore((state) => state.setVolCcyQuote)

  const updateKlinesByInstId = useCallback(
    async (instId: string) => {
      const kline = await fetchOkxKlines({ instId })
      setKlineData(instId, kline)
      setVolCcyQuote(instId, kline.reduce((a, b) => +a + +b[7], 0).toString())
    },
    [setKlineData, setVolCcyQuote],
  )

  const updateAllKlines = useCallback(async () => {
    if (!instIds.length) return

    try {
      for (const instId of instIds) {
        await updateKlinesByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch klines:', error)
    }

    setTimeout(updateAllKlines, 1000 * 30) // 30 seconds
  }, [instIds, updateKlinesByInstId])

  useEffect(() => {
    updateAllKlines()
  }, [instIds, updateAllKlines])

  return { updateKlinesByInstId }
}
