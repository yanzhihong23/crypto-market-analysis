import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxOpenInterestHistory } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { sessionStartMs } from '../utils/session'

/**
 * The session open only moves when the session does, so this is a slow poll.
 * Half an hour keeps a rolling 24h window honest — its start slides forward
 * continuously — without asking for a series that changes once an hour.
 */
const POLL_INTERVAL_MS = 1000 * 60 * 30
const STALE_AFTER_MS = 1000 * 60 * 30

export default function useOkxOpenInterestUpdater() {
  const setOpenInterestOpen = useTickerStore(
    (state) => state.setOpenInterestOpen,
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
      if (!res?.length) return

      // Newest first. The open is the last bar that had already closed when the
      // session started; anything after it is inside the window being measured.
      const start = sessionStartMs(session)
      const openRow =
        res.find(([ts]) => Number(ts) <= start) ?? res[res.length - 1]

      setOpenInterestOpen(instId, openRow[1], session)
    },
    [setOpenInterestOpen],
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
