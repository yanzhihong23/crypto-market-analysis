import { useCallback, useEffect } from 'react'

import { fetchBinanceRatio } from '../apis'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'

export default function useBinanceRatioUpdater() {
  const setRatio = useBinanceTickerStore((state) => state.setRatio)
  const symbols = useBinanceTickerStore((state) => state.symbols)

  const updateRatioBySymbol = useCallback(
    async (symbol: string) => {
      const res = await fetchBinanceRatio({
        symbol,
        period: '5m',
        limit: 1,
      })
      setRatio(symbol, res?.[0]?.longShortRatio ?? null)
    },
    [setRatio],
  )

  const updateAllRatio = useCallback(async () => {
    try {
      for (const symbol of symbols) {
        await updateRatioBySymbol(symbol)
      }
    } catch (error) {
      console.error('Failed to fetch ratio:', error)
    }

    setTimeout(updateAllRatio, 1000 * 60 * 5) // 5 minutes
  }, [symbols, updateRatioBySymbol])

  useEffect(() => {
    updateAllRatio()
  }, [symbols, updateAllRatio])

  return { updateRatioBySymbol }
}
