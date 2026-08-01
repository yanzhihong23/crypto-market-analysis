import { useCallback, useEffect, useRef } from 'react'

import { fetchBinanceRatio } from '../apis'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'
import { baselineOf, deviationFrom } from '../utils/signals'

/**
 * Two days of hourly samples, the same window the OKX cards get from their own
 * feed. Five-minute samples were the obvious choice and the wrong one: over two
 * hours this series barely moves, so its spread is tiny and a sixth of the grid
 * sat outside two sigma. The hourly series is both longer and smoother, and it
 * costs 48 rows on a request that was being made per symbol anyway.
 */
const RATIO_PERIOD = '1h'
const RATIO_WINDOW = 48

export default function useBinanceRatioUpdater() {
  const ratio = useBinanceTickerStore((state) => state.ratio)
  const setRatio = useBinanceTickerStore((state) => state.setRatio)
  const symbols = useBinanceTickerStore((state) => state.symbols)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRatioRef = useRef<() => Promise<void>>(async () => {})

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
        period: RATIO_PERIOD,
        limit: RATIO_WINDOW,
      })
      if (!res?.length) return

      // Binance returns these oldest first, the opposite of OKX, so the current
      // reading is the tail and everything before it is the baseline.
      const latest = res[res.length - 1]?.longShortRatio ?? null
      const history = res.slice(0, -1).map((row) => Number(row.longShortRatio))
      setRatio(
        symbol,
        latest,
        deviationFrom(Number(latest), baselineOf(history)),
      )
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

    timerRef.current = setTimeout(
      () => {
        void updateAllRatioRef.current()
      },
      1000 * 60 * 5,
    ) // 5 minutes
  }, [batchProcess, symbols])

  updateAllRatioRef.current = updateAllRatio

  useEffect(() => {
    void updateAllRatioRef.current()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { updateRatioBySymbol }
}
