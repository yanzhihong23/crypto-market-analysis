import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxRatio } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { baselineOf, deviationFrom } from '../utils/signals'

export default function useOkxRatioUpdater() {
  const setRatio = useTickerStore((state) => state.setRatio)
  const instIds = useTickerStore((state) => state.instIds)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRatioRef = useRef<() => Promise<void>>(async () => {})

  const updateRatioByInstId = useCallback(
    async (instId: string) => {
      const ratio = useTickerStore.getState().ratio
      if (
        ratio[instId]?.updatedAt &&
        ratio[instId]?.updatedAt > Date.now() - 1000 * 60 * 5 // 5 minutes
      ) {
        return
      }
      const res = await fetchOkxRatio({
        coin: instId.split('-')[0],
        period: '5m',
      })
      if (!res?.length) return

      // Newest first, so the head is the current reading and the tail is what
      // counts as normal for this coin. The window is whatever the endpoint
      // hands back, currently two days of five-minute samples.
      const [, latest] = res[0]
      const history = res.slice(1).map(([, value]) => Number(value))
      setRatio(
        instId,
        latest,
        deviationFrom(Number(latest), baselineOf(history)),
      )
    },
    [setRatio],
  )

  const updateAllRatio = useCallback(async () => {
    try {
      for (const instId of instIds) {
        await updateRatioByInstId(instId)
      }
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
  }, [instIds, updateRatioByInstId])

  updateAllRatioRef.current = updateAllRatio

  useEffect(() => {
    void updateAllRatioRef.current()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { updateRatioByInstId }
}
