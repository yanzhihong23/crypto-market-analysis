import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxFundingRateHistory } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { baselineOf } from '../utils/signals'
import { fundingCarryOf } from '../utils/funding'

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

      // Stored in the same unit the card shows, so every deviation is taken on
      // the number the user is looking at rather than the raw fraction. The
      // realised rate is what was actually charged; the quoted one is what it
      // was heading for when the row was written.
      const rates = res.map(
        (row) => Number(row.realizedRate || row.fundingRate) * 10000,
      )

      // Newest first, so a step is a row minus the one that settled before it.
      const steps = rates
        .slice(0, -1)
        .map((rate, index) => rate - rates[index + 1])

      // The week's carry rides along on the same rows. It belongs to the
      // medium-term layer rather than to the two baselines above, but the fetch
      // that answers it has already happened here.
      setFundingBaseline(
        instId,
        baselineOf(rates),
        baselineOf(steps),
        rates[0].toFixed(1),
        fundingCarryOf(res),
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
