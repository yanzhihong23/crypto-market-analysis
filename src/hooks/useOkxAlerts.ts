import { useEffect } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import { useAlertStore } from '../store/useAlertStore'
import { beep, isAway, showNotification } from '../utils/alarm'
import { deviationFrom, formatDeviation, isFlagged } from '../utils/signals'

/**
 * How long a symbol stays quiet after firing. A reading sitting right on the
 * threshold crosses it back and forth for as long as it stays there, and each
 * of those crossings is the same event.
 */
const COOLDOWN_MS = 1000 * 60 * 30

/**
 * Nothing fires in the first minute. The readings a flag is built from are
 * fetched per instrument on a loop, so a cold start walks the whole watchlist
 * from nothing to its real state — without this, opening the page on an empty
 * cache would announce everything that was already true.
 */
const STARTUP_GRACE_MS = 1000 * 60

/**
 * Watches the same bar the card's ring is drawn from and reports the moment it
 * is crossed, so the board is worth leaving open. It reports edges, not states:
 * a symbol that is still flagged an hour later has not happened again.
 */
export default function useOkxAlerts() {
  useEffect(() => {
    const flagged = new Map<string, boolean>()
    const firedAt = new Map<string, number>()
    const startedAt = Date.now()

    const evaluate = () => {
      const state = useTickerStore.getState()
      const now = Date.now()

      for (const instId of state.instIds) {
        const ratioDeviation = state.ratio[instId]?.deviation
        const fundingDeviation = deviationFrom(
          Number(state.fundingRate[instId]),
          state.fundingBaseline[instId],
        )
        const isNow = isFlagged({ ratioDeviation, fundingDeviation })

        // A symbol nobody has looked at yet has no edge to have crossed. This
        // covers the ones just added to the board as well as the ones present
        // at mount.
        const known = flagged.has(instId)
        const was = flagged.get(instId) ?? false
        flagged.set(instId, isNow)

        if (!known || !isNow || was) continue
        if (now - startedAt < STARTUP_GRACE_MS) continue
        if (now - (firedAt.get(instId) ?? 0) < COOLDOWN_MS) continue
        // Only reachable with both deviations past the threshold, so neither is
        // null; the check keeps that provable at the point they are formatted.
        if (ratioDeviation == null || fundingDeviation == null) continue

        firedAt.set(instId, now)
        useAlertStore.getState().push({
          id: `${instId}-${now}`,
          instId,
          at: now,
          ratioDeviation,
          fundingDeviation,
        })

        // Interrupting someone who is already looking at the board would only
        // repeat what the card's ring has already said.
        if (!isAway()) continue

        const { notificationsEnabled, soundEnabled } = useAlertStore.getState()
        if (notificationsEnabled) {
          showNotification(
            `${instId.split('-')[0]} positioning`,
            `L/S ${formatDeviation(ratioDeviation)}, funding ${formatDeviation(
              fundingDeviation,
            )} their recent range`,
            instId,
          )
        }
        if (soundEnabled) beep()
      }

      // Symbols taken off the board should not keep their edge, or adding one
      // back would compare against a state from before it left.
      const watched = new Set(state.instIds)
      for (const instId of flagged.keys()) {
        if (!watched.has(instId)) flagged.delete(instId)
      }
    }

    evaluate()
    return useTickerStore.subscribe(evaluate)
  }, [])
}
