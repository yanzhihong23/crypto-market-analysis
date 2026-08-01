import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxFundingRateHistory } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { baselineOf } from '../utils/signals'

/**
 * Funding settles every eight hours, so its history is worth refetching on the
 * hour at most. The live rate it gets compared against arrives on the ticker
 * websocket and moves continuously; only the yardstick is polled here.
 */
const STALE_AFTER_MS = 1000 * 60 * 60 * 6
const POLL_INTERVAL_MS = 1000 * 60 * 30

export default function useOkxFundingBaselineUpdater() {
  const setFundingBaseline = useTickerStore((state) => state.setFundingBaseline)
  const instIds = useTickerStore((state) => state.instIds)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})

  const updateByInstId = useCallback(
    async (instId: string) => {
      const fetchedAt = useTickerStore.getState().fundingBaselineAt[instId]
      if (fetchedAt && fetchedAt > Date.now() - STALE_AFTER_MS) {
        return
      }

      const res = await fetchOkxFundingRateHistory({ instId })
      if (!res?.length) return

      // Stored in the same unit the card shows, so the deviation is taken on
      // the number the user is looking at rather than the raw fraction.
      setFundingBaseline(
        instId,
        baselineOf(res.map((row) => Number(row.fundingRate) * 10000)),
      )
    },
    [setFundingBaseline],
  )

  const updateAll = useCallback(async () => {
    try {
      for (const instId of instIds) {
        await updateByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch funding rate history:', error)
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      void updateAllRef.current()
    }, POLL_INTERVAL_MS)
  }, [instIds, updateByInstId])

  updateAllRef.current = updateAll

  useEffect(() => {
    void updateAllRef.current()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { updateFundingBaselineByInstId: updateByInstId }
}
