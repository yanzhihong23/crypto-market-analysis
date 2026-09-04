import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxKlines, fetchOkxOpenInterestHistory } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { OpenTime } from '../types/okx'
import { dailyStatsOf } from '../utils/klineStats'
import { dailyBarOf } from '../utils/session'
import { oiPercentileOf } from '../utils/openInterest'

/**
 * Ten months of daily bars, which is the endpoint's ceiling and costs the same
 * as asking for less. The windows read off it are a month and a week; the rest
 * is there so the coil's percentile has a history worth ranking within.
 */
const BARS = 300

/**
 * Days of open interest, which is the statistics endpoints' hard ceiling — they
 * cap at a hundred rows whatever is asked for. Long enough that a level sitting
 * at the top of it has a build-up behind it rather than a busy fortnight.
 */
const OI_DAYS = 100

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
 * What relative strength is measured against. Fetched on the same walk and on
 * the same hour, whether or not it is on the board — a benchmark that came and
 * went with the watchlist would make the same symbol's excess return mean
 * different things on different boards.
 */
const BENCHMARK_INST_ID = 'BTC-USDT-SWAP'

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
  const openTime = useTickerStore((state) => state.openTime)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})
  // Read through a ref for the same reason the open interest walk does: the
  // walk is a loop of awaits, and a setting changed halfway through it should
  // not have half the board measured against one open and half against another.
  const openTimeRef = useRef(openTime)
  openTimeRef.current = openTime

  const updateByInstId = useCallback(
    async (instId: string) => {
      const session = openTimeRef.current
      const { dailyStatsAt, dailyStatsOpenTime } = useTickerStore.getState()
      const fetchedAt = dailyStatsAt[instId]
      if (
        dailyStatsOpenTime[instId] === session &&
        fetchedAt &&
        fetchedAt > Date.now() - STALE_AFTER_MS
      ) {
        return
      }

      // In parallel: the two go to different hosts — candles straight to the
      // exchange, the statistics path through our own origin and its limiter —
      // so neither is waiting on the other's allowance.
      const [klines, openInterest] = await Promise.all([
        fetchOkxKlines({ instId, period: dailyBarOf(session), limit: BARS }),
        fetchOkxOpenInterestHistory({ instId, period: '1D', limit: OI_DAYS }),
      ])
      if (!klines?.length) return

      setDailyStats(
        instId,
        dailyStatsOf(klines),
        oiPercentileOf(openInterest),
        session,
      )
    },
    [setDailyStats],
  )

  const updateBenchmark = useCallback(async () => {
    const session = openTimeRef.current
    const { benchmarkDailyAt, benchmarkDailyOpenTime, setBenchmarkDaily } =
      useTickerStore.getState()
    if (
      benchmarkDailyOpenTime === session &&
      benchmarkDailyAt > Date.now() - STALE_AFTER_MS
    ) {
      return
    }

    const res = await fetchOkxKlines({
      instId: BENCHMARK_INST_ID,
      period: dailyBarOf(session),
      limit: BARS,
    })
    if (!res?.length) return

    setBenchmarkDaily(dailyStatsOf(res), session)
  }, [])

  const updateAll = useCallback(async () => {
    try {
      // First, so that a board whose symbols land one at a time has something
      // to be measured against by the time the first of them arrives.
      await updateBenchmark()
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
  }, [instIds, updateByInstId, updateBenchmark])

  updateAllRef.current = updateAll

  // Runs on an open change as well as on mount: every stored month is stamped
  // with the open it was cut at, so they all miss at once.
  //
  // Straight away on the change, and the delay is kept for the mount alone. It
  // is there for a cold start, where this poller and the momentum one would
  // otherwise walk the same endpoint at the same moment; a board that has been
  // open for an hour is not that, and until the walk lands the dialog is
  // showing a month cut at the open the reader has just stopped using — which
  // is the reading this whole stamp exists to get rid of, so half a minute of
  // it is half a minute too long.
  //
  // The previous value rather than a "have I mounted" flag: StrictMode runs
  // this twice on mount, and a flag would read the second pass as a change and
  // fetch immediately, which is the one thing the delay is for.
  const lastOpenTimeRef = useRef<OpenTime | null>(null)
  useEffect(() => {
    const changed =
      lastOpenTimeRef.current !== null && lastOpenTimeRef.current !== openTime
    lastOpenTimeRef.current = openTime

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (changed) {
      void updateAllRef.current()
    } else {
      timerRef.current = setTimeout(() => {
        void updateAllRef.current()
      }, FIRST_PASS_DELAY_MS)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [openTime])

  return { updateDailyStatsByInstId: updateByInstId }
}
