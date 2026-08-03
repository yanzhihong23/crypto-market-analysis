import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxOpenInterestHistory } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { sessionStartMs } from '../utils/session'
import { baselineOf } from '../utils/signals'

/**
 * The session open only moves when the session does, so this is a slow poll.
 * Half an hour keeps a rolling 24h window honest — its start slides forward
 * continuously — without asking for a series that changes once an hour.
 */
const POLL_INTERVAL_MS = 1000 * 60 * 30
const STALE_AFTER_MS = 1000 * 60 * 30

/** Percent moves bar to bar, off a series that arrives newest first. */
const changesOf = (values: number[]) =>
  values
    .slice(0, -1)
    .map((value, index) => {
      const previous = values[index + 1]
      return previous > 0 ? ((value - previous) / previous) * 100 : NaN
    })
    .filter((value) => Number.isFinite(value))

export default function useOkxOpenInterestUpdater() {
  const setOpenInterestOpen = useTickerStore(
    (state) => state.setOpenInterestOpen,
  )
  const setOiChangeBaseline = useTickerStore(
    (state) => state.setOiChangeBaseline,
  )
  const openTime = useTickerStore((state) => state.openTime)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})
  const openTimeRef = useRef(openTime)
  openTimeRef.current = openTime

  const updateByInstId = useCallback(
    async (instId: string) => {
      const session = openTimeRef.current
      const stored = useTickerStore.getState().openInterestOpen[instId]
      if (
        stored?.openTime === session &&
        stored.fetchedAt > Date.now() - STALE_AFTER_MS
      ) {
        return
      }

      const res = await fetchOkxOpenInterestHistory({ instId })
      if (res?.length) {
        // Newest first. The open is the last bar that had already closed when
        // the session started; anything after it is inside the window being
        // measured.
        const start = sessionStartMs(session)
        const openRow =
          res.find(([ts]) => Number(ts) <= start) ?? res[res.length - 1]

        setOpenInterestOpen(instId, openRow[1], session)
      }

      // A second series off the same endpoint at the resolution the live buffer
      // measures in. The session figure above answers "is this new money"; this
      // one answers "is this fast", which is the half that separates positions
      // being closed from positions being taken out.
      const short = await fetchOkxOpenInterestHistory({
        instId,
        period: '5m',
        limit: 100,
      })
      setOiChangeBaseline(
        instId,
        short?.length
          ? baselineOf(changesOf(short.map((row) => Number(row[1]))))
          : null,
      )
    },
    [setOpenInterestOpen, setOiChangeBaseline],
  )

  const updateAll = useCallback(async () => {
    try {
      for (const instId of useTickerStore.getState().instIds) {
        await updateByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch open interest history:', error)
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      void updateAllRef.current()
    }, POLL_INTERVAL_MS)
  }, [updateByInstId])

  updateAllRef.current = updateAll

  // Refetches on an open change as well as on mount: every stored reference is
  // stamped with the session it belongs to, so they all miss at once.
  useEffect(() => {
    void updateAllRef.current()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [openTime])

  return { updateOpenInterestOpenByInstId: updateByInstId }
}
