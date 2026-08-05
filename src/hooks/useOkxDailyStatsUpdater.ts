import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxKlines } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { Period } from '../types/okx'
import { dailyStatsOf } from '../utils/klineStats'

/**
 * Ten months of daily bars, which is the endpoint's ceiling and costs the same
 * as asking for less. The windows read off it are a month and a week; the rest
 * is there so the coil's percentile has a history worth ranking within.
 */
const BARS = 300

/**
 * A daily bar closes once a day, so an hour-old copy of a month is a month. The
 * part of a medium-term reading that does move — where the price sits between
 * the extremes this fetch found — is taken from the live ticker at the moment
 * somebody asks, the same split the momentum baseline and its five-minute move
 * already run on.
 */
const STALE_AFTER_MS = 1000 * 60 * 60
const POLL_INTERVAL_MS = 1000 * 60 * 60

/**
 * How long the first pass waits.
 *
 * This is the second poller to walk the watchlist against `/market/candles` —
 * the momentum baseline is the other — and neither goes through the statistics
 * limiter, because that one is keyed per rubik path and this endpoint is not one
 * of them. Each walks its own list one symbol at a time, so they are each
 * paced and not paced against each other, and starting together doubles the
 * request rate on the one path at the worst moment for it, a cold start.
 *
 * Nothing here is wanted urgently: it describes a month, and it is the only
 * reading on the board that is still true tomorrow. Standing out of the way for
 * half a minute costs it nothing.
 */
const FIRST_PASS_DELAY_MS = 1000 * 30

/**
 * The yardstick everything medium term is measured against, refreshed hourly.
 *
 * The candles themselves are dropped once the statistics are out of them. Three
 * hundred bars a symbol is far more than anything reads twice, and the store
 * they would land in is serialised to localStorage on every write.
 */
export default function useOkxDailyStatsUpdater() {
  const setDailyStats = useTickerStore((state) => state.setDailyStats)
  const instIds = useTickerStore((state) => state.instIds)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})

  const updateByInstId = useCallback(
    async (instId: string) => {
      const fetchedAt = useTickerStore.getState().dailyStatsAt[instId]
      if (fetchedAt && fetchedAt > Date.now() - STALE_AFTER_MS) return

      const res = await fetchOkxKlines({
        instId,
        period: Period.DAY_1,
        limit: BARS,
      })
      if (!res?.length) return

      setDailyStats(instId, dailyStatsOf(res))
    },
    [setDailyStats],
  )

  const updateAll = useCallback(async () => {
    try {
      for (const instId of instIds) {
        await updateByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch daily candles:', error)
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
    timerRef.current = setTimeout(() => {
      void updateAllRef.current()
    }, FIRST_PASS_DELAY_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { updateDailyStatsByInstId: updateByInstId }
}
