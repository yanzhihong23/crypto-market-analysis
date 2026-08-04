import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxKlines } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { Period } from '../types/okx'
import { coilOf } from '../utils/klineStats'
import { baselineOf } from '../utils/signals'

/**
 * How much of its own history a five-minute move is judged against. A hundred
 * bars is a little over eight hours, which is long enough for the spread to
 * settle and short enough to still describe the session the move is happening
 * in — a month of returns would call an ordinary move in a volatile week
 * unusual, and miss a violent one in a quiet fortnight.
 */
const BARS = 100

/**
 * The spread of returns drifts with the volatility regime rather than jumping,
 * so half an hour is often enough. The move it is compared against is taken off
 * the live buffer and is current to the second; only the yardstick is polled.
 */
const STALE_AFTER_MS = 1000 * 60 * 30
const POLL_INTERVAL_MS = 1000 * 60 * 30

/** Percent moves bar to bar, off a series that arrives newest first. */
const returnsOf = (closes: number[]) =>
  closes
    .slice(0, -1)
    .map((close, index) => {
      const previous = closes[index + 1]
      return previous > 0 ? ((close - previous) / previous) * 100 : NaN
    })
    .filter((value) => Number.isFinite(value))

export default function useOkxMomentumBaselineUpdater() {
  const setMomentumBaseline = useTickerStore(
    (state) => state.setMomentumBaseline,
  )
  const instIds = useTickerStore((state) => state.instIds)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})

  const updateByInstId = useCallback(
    async (instId: string) => {
      const fetchedAt = useTickerStore.getState().momentumBaselineAt[instId]
      if (fetchedAt && fetchedAt > Date.now() - STALE_AFTER_MS) return

      // Deliberately not cut to the board's session open, which the sparkline
      // candles are: this is a spread rather than a shape, and clipping it to a
      // session that started twenty minutes ago would leave nothing to measure.
      const res = await fetchOkxKlines({
        instId,
        period: Period.MINUTE_5,
        limit: BARS,
      })
      if (!res?.length) return

      // The coil comes off the same candles and goes in on the same write. It
      // wants an uncut series for its own reason — the board's are clipped to
      // the session, so half of every day has too few of them to have a quiet
      // end — and this is the only uncut series anything here fetches.
      //
      // Half an hour old at worst, which sounds careless for a two-hour window
      // and is not: the case where a stale coil would be wrong is the coil
      // breaking, and a break is a move, and a move puts the momentum reading in
      // front of this one on the badge. What is left is the sentence underneath
      // it saying how long the thing that just broke had been winding up.
      setMomentumBaseline(
        instId,
        baselineOf(returnsOf(res.map((kline) => Number(kline[4])))),
        coilOf(res),
      )
    },
    [setMomentumBaseline],
  )

  const updateAll = useCallback(async () => {
    try {
      for (const instId of instIds) {
        await updateByInstId(instId)
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

  return { updateMomentumBaselineByInstId: updateByInstId }
}
