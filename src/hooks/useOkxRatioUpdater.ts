import { useCallback, useEffect } from 'react'

import { fetchOkxRatio } from '../apis'
import { useTickerStore } from '../store/useTickerStore'

export default function useOkxRatioUpdater() {
  const setRatio = useTickerStore((state) => state.setRatio)
  const instIds = useTickerStore((state) => state.instIds)

  const updater = useCallback(async () => {
    try {
      for (const instId of instIds) {
        const res = await fetchOkxRatio({
          coin: instId.split('-')[0],
          period: '5m',
        })

        setRatio(instId, res[0][1])
      }
    } catch (error) {
      console.error('Failed to fetch ratio:', error)
    }

    setTimeout(updater, 1000 * 60 * 5) // 5 minutes
  }, [instIds, setRatio])

  useEffect(() => {
    updater()
  }, [instIds, updater])

  return { updater }
}
