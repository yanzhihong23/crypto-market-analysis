import { useEffect, useRef } from 'react'
import { useCallback } from 'react'

import { fetchOkxKlines } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { OkxKline, OpenTime } from '../types/okx'
import { sessionKlines } from '../utils/session'

const POLL_INTERVAL_MS = 1000 * 60

/**
 * Quarter hours held per symbol. Twenty-five hours, which covers any of the
 * three sessions in full — each is at most a day long — with a bar of margin at
 * the boundary.
 *
 * Fetched uncut and sliced where a session is wanted, rather than cut here.
 * Cutting here is what left the statistics taken off these bars short of the
 * twenty closed bars a baseline needs for the first five hours of every
 * session, which took `volume`, `volatility` and `rejection` off the whole
 * board daily.
 */
const BARS = 100

/** What has changed hands since the session opened, in the quote currency. */
const sessionVolumeOf = (klines: OkxKline[], openTime: OpenTime) =>
  sessionKlines(klines, openTime)
    .reduce((sum, kline) => sum + Number(kline[7]), 0)
    .toString()

export default function useOkxKlinesUpdater() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const instIds = useTickerStore((state) => state.instIds)
  const openTime = useTickerStore((state) => state.openTime)
  const setKlines = useTickerStore((state) => state.setKlines)

  // Held in a ref so the fetch does not have to be rebuilt when the session
  // moves. The candles it asks for no longer depend on the session at all;
  // only the figure derived from them does.
  const openTimeRef = useRef(openTime)
  openTimeRef.current = openTime

  const updateKlinesByInstId = useCallback(
    async (instId: string) => {
      const kline = await fetchOkxKlines({ instId, limit: BARS })
      // The getter returns the exchange's error body when the code is not `0`,
      // and that is not an array. Treating it as candles would throw inside
      // `sessionVolumeOf` and abort the whole walk of the watchlist.
      if (!Array.isArray(kline)) return
      setKlines(instId, kline, sessionVolumeOf(kline, openTimeRef.current))
    },
    [setKlines],
  )

  const updateAllRef = useRef<() => Promise<void>>(async () => {})

  const updateAllKlines = useCallback(async () => {
    // There is one chain and the ref holds its only timer. This used to be
    // started from two effects at once, which left a second chain running that
    // nothing held a handle to: every symbol was fetched twice a minute and
    // written to the persisted store twice as often, forever.
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void updateAllRef.current()
    }, POLL_INTERVAL_MS)

    try {
      // Read off the store rather than closed over, so the loop follows the
      // watchlist without having to be restarted when it changes.
      for (const instId of useTickerStore.getState().instIds) {
        await updateKlinesByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch klines:', error)
    }
  }, [updateKlinesByInstId])

  updateAllRef.current = updateAllKlines

  const prevInstIdsRef = useRef<string[]>([])
  const firstPassRef = useRef(true)

  // Newly added symbols only, so they draw a chart without waiting out the
  // poll. The first run is the mount, where the loop's own opening pass covers
  // the whole watchlist.
  useEffect(() => {
    const prevInstIds = prevInstIdsRef.current
    const addedInstIds = instIds.filter((id) => !prevInstIds.includes(id))
    prevInstIdsRef.current = instIds

    if (firstPassRef.current) {
      firstPassRef.current = false
      return
    }
    if (!addedInstIds.length) return

    void Promise.all(addedInstIds.map((id) => updateKlinesByInstId(id)))
  }, [instIds, updateKlinesByInstId])

  useEffect(() => {
    void updateAllRef.current()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // A session change re-slices what is already held rather than refetching it.
  // The candles are the same twenty-five hours whichever session is selected,
  // and the only thing that moves is the volume summed out of them — this used
  // to walk the whole watchlist against the exchange to arrive back at the same
  // bars. The sparkline re-slices on its own, since it reads the session too.
  const firstSliceRef = useRef(true)

  useEffect(() => {
    if (firstSliceRef.current) {
      firstSliceRef.current = false
      return
    }

    const state = useTickerStore.getState()
    for (const [instId, klines] of Object.entries(state.klineData)) {
      if (klines?.length) {
        state.setKlines(instId, klines, sessionVolumeOf(klines, openTime))
      }
    }
  }, [openTime])

  return { updateKlinesByInstId }
}
