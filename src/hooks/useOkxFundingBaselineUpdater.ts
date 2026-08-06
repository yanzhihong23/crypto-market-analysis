import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxFundingRateHistory } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { baselineOf } from '../utils/signals'
import { fundingCarryOf } from '../utils/funding'

/**
 * The backstop, for an instrument whose next settlement the live channel has
 * not named yet. What normally decides a refetch is the settlement itself —
 * see below — and this only covers the gap before the socket has said when
 * that is.
 *
 * It used to be the whole of the test, and that was wrong by a whole
 * settlement: eight hours between charges against six of tolerance meant that
 * for roughly a third of every cycle `fundingPrev` was the rate charged two
 * settlements ago. `funding-shift` then measured a two-settlement drift against
 * the spread of one-settlement steps, which inflates the deviation by about
 * √2 and fires the reading on an ordinary week.
 */
const STALE_AFTER_MS = 1000 * 60 * 60 * 6
const POLL_INTERVAL_MS = 1000 * 60 * 30

/** The next settlement off the live channel, or 0 where there is not one yet. */
const settlementAhead = (instId: string) => {
  const at = Number(useTickerStore.getState().fundingTime[instId])
  return Number.isFinite(at) && at > Date.now() ? at : 0
}

export default function useOkxFundingBaselineUpdater() {
  const setFundingBaseline = useTickerStore((state) => state.setFundingBaseline)
  const instIds = useTickerStore((state) => state.instIds)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})

  const updateByInstId = useCallback(
    async (instId: string) => {
      const state = useTickerStore.getState()
      const fetchedAt = state.fundingBaselineAt[instId]

      // The settlement this history was fetched ahead of, and whether it has
      // been charged since. Once it has, the stored rows are a row short of
      // what was actually paid whatever the clock says — which is the thing
      // `fundingPrev` is, so this is the test that matters.
      //
      // A zero means the socket had not named a settlement yet when the last
      // fetch went out; if it has since, that alone is worth going back for,
      // and after one pass the stamp is real and this settles down.
      const settlesAt = state.fundingSettlesAt[instId] ?? 0
      const settled =
        settlesAt > 0 ? Date.now() >= settlesAt : settlementAhead(instId) > 0

      if (!settled && fetchedAt && fetchedAt > Date.now() - STALE_AFTER_MS) {
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
        // Read again rather than reused from the top of this function, since
        // the socket may well have named the next settlement while the request
        // was in flight.
        //
        // Only a settlement still ahead is worth stamping. At a cold start the
        // poller runs before the socket has said anything and the stamp comes
        // off whatever the last session persisted, which is by then in the
        // past — and a past stamp reads as "already charged" on every pass
        // afterwards, refetching each time instead of falling back to the
        // clock. Zero means unknown, and one pass with a live socket settles
        // it.
        settlementAhead(instId),
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
