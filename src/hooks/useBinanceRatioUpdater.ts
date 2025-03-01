import { useCallback, useEffect, useRef } from 'react'

import { fetchBinanceRatio } from '../apis'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'

export default function useBinanceRatioUpdater() {
  const ratio = useBinanceTickerStore((state) => state.ratio)
  const setRatio = useBinanceTickerStore((state) => state.setRatio)
  const symbols = useBinanceTickerStore((state) => state.symbols)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const updateRatioBySymbol = useCallback(
    async (symbol: string) => {
      if (
        ratio[symbol]?.updatedAt &&
        ratio[symbol]?.updatedAt > Date.now() - 1000 * 60 * 5 // 5 minutes
      ) {
        return
      }

      const res = await fetchBinanceRatio({
        symbol,
        period: '5m',
        limit: 1,
      })
      setRatio(symbol, res?.[0]?.longShortRatio ?? null)
    },
    [setRatio, ratio],
  )

  const batchProcess = useCallback(
    async (items: string[], batchSize: number) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        await Promise.all(batch.map(updateRatioBySymbol))
      }
    },
    [updateRatioBySymbol],
  )

  const updateAllRatio = useCallback(async () => {
    try {
      await batchProcess(symbols, 5)
    } catch (error) {
      console.error('Failed to fetch ratio:', error)
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(updateAllRatio, 1000 * 60 * 5) // 5 minutes
  }, [batchProcess, symbols])

  useEffect(() => {
    updateAllRatio()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { updateRatioBySymbol }
}
