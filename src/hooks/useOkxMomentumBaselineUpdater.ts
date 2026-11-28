import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxKlines } from '../apis'
import { seedOkxPriceSamples } from '../store/okxRealtimeSeries'
import { useTickerStore } from '../store/useTickerStore'
import { OkxKline, Period } from '../types/okx'
import { barReturnsOf, betaBaselineOf, coilOf } from '../utils/klineStats'
import { baselineOf } from '../utils/signals'

/**
 * How much of its own history a five-minute move is judged against. A hundred
 * bars is a little over eight hours, which is long enough for the spread to
 * settle and short enough to still describe the session the move is happening
 * in — a month of returns would call an ordinary move in a volatile week
 * unusual, and miss a violent one in a quiet fortnight.
 */
const BARS = 100
const BAR_MS = 1000 * 60 * 5
const BENCHMARK_INST_ID = 'BTC-USDT-SWAP'

/**
 * The spread of returns drifts with the volatility regime rather than jumping,
 * so half an hour is often enough. The move it is compared against is taken off
 * the live buffer and is current to the second; only the yardstick is polled.
 */
const STALE_AFTER_MS = 1000 * 60 * 30
const POLL_INTERVAL_MS = 1000 * 60 * 30

const seedPriceFromKlines = (instId: string, klines: OkxKline[]) => {
  // Seed from the two most recent bars (open + close timestamps) so a freshly
  // opened page already has a 5m price anchor once the first live tick lands.
  const points: Array<{ ts: number; value: number }> = []
  for (const bar of klines.slice(0, 3)) {
    const openTs = Number(bar[0])
    const openPx = Number(bar[1])
    const closePx = Number(bar[4])
    if (openTs > 0 && openPx > 0) points.push({ ts: openTs, value: openPx })
    if (bar[8] === '1' && openTs > 0 && closePx > 0) {
      points.push({ ts: openTs + BAR_MS, value: closePx })
    }
  }
  seedOkxPriceSamples(instId, points)
}

export default function useOkxMomentumBaselineUpdater() {
  const setMomentumBaseline = useTickerStore(
    (state) => state.setMomentumBaseline,
  )
  const instIds = useTickerStore((state) => state.instIds)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})
  const benchmarkRef = useRef<{ klines: OkxKline[]; fetchedAt: number } | null>(
    null,
  )

  const getBenchmarkKlines = useCallback(async () => {
    const cached = benchmarkRef.current
    if (cached && cached.fetchedAt > Date.now() - STALE_AFTER_MS) {
      return cached.klines
    }
    const res = await fetchOkxKlines({
      instId: BENCHMARK_INST_ID,
      period: Period.MINUTE_5,
      limit: BARS,
    })
    if (res?.length) {
      benchmarkRef.current = { klines: res, fetchedAt: Date.now() }
      return res
    }
    return cached?.klines ?? null
  }, [])

  const updateByInstId = useCallback(
    async (instId: string, benchmarkKlines?: OkxKline[] | null) => {
      const state = useTickerStore.getState()
      const fetchedAt = state.momentumBaselineAt[instId]
      const hasBetaEntry = instId in state.betaBaseline
      if (
        fetchedAt &&
        fetchedAt > Date.now() - STALE_AFTER_MS &&
        hasBetaEntry
      ) {
        return
      }

      // Deliberately not cut to the board's session open, which the sparkline
      // candles are: this is a spread rather than a shape, and clipping it to a
      // session that started twenty minutes ago would leave nothing to measure.
      const res =
        instId === BENCHMARK_INST_ID && benchmarkKlines?.length
          ? benchmarkKlines
          : await fetchOkxKlines({
              instId,
              period: Period.MINUTE_5,
              limit: BARS,
            })
      if (!res?.length) return

      seedPriceFromKlines(instId, res)

      // Closed bars only, the way every other series here is read.
      const closed = res.filter((kline) => kline[8] === '1')
      if (!closed.length) return

      const bench =
        instId === BENCHMARK_INST_ID
          ? null
          : (benchmarkKlines ?? (await getBenchmarkKlines()))
      const beta = bench ? betaBaselineOf(closed, bench) : null

      setMomentumBaseline(
        instId,
        baselineOf(barReturnsOf(closed)),
        coilOf(closed),
        beta,
      )
    },
    [getBenchmarkKlines, setMomentumBaseline],
  )

  const updateAll = useCallback(async () => {
    try {
      const benchmark = await getBenchmarkKlines()
      for (const instId of instIds) {
        await updateByInstId(instId, benchmark)
      }
    } catch (error) {
      console.error('Failed to fetch momentum baseline candles:', error)
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      void updateAllRef.current()
    }, POLL_INTERVAL_MS)
  }, [getBenchmarkKlines, instIds, updateByInstId])

  updateAllRef.current = updateAll

  useEffect(() => {
    void updateAllRef.current()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { updateMomentumBaselineByInstId: updateByInstId }
}
