import { useEffect } from 'react'
import { useCallback } from 'react'

import { fetchOkxKlines } from '../apis'
import { useTickerStore } from '../store/useTickerStore'

export default function useOkxKlineUpdater() {
  const instIds = useTickerStore((state) => state.instIds)
  const setKlineData = useTickerStore((state) => state.setKlineData)
  const setVolCcyQuote = useTickerStore((state) => state.setVolCcyQuote)

  const updater = useCallback(async () => {
    if (!instIds.length) return

    try {
      for (const instId of instIds) {
        const kline = await fetchOkxKlines({ instId })
        setKlineData(instId, kline)
        setVolCcyQuote(instId, kline.reduce((a, b) => +a + +b[7], 0).toString())
      }
    } catch (error) {
      console.error('Failed to fetch klines:', error)
    }

    setTimeout(updater, 1000 * 30) // 30 seconds
  }, [instIds, setKlineData, setVolCcyQuote])

  useEffect(() => {
    updater()
  }, [instIds, updater])

  return { updater }
}
