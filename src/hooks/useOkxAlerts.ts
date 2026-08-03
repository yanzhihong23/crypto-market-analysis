import { useEffect } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import { useAlertStore } from '../store/useAlertStore'
import { readSignalInput } from '../store/okxSignalInput'
import {
  boardMedianPricePercent,
  subscribeOkxSeriesAny,
} from '../store/okxRealtimeSeries'
import { beep, isAway, showNotification } from '../utils/alarm'
import { collectSignals } from '../utils/detectors'
import { flagStateOf } from '../utils/signals'

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
 * Both feeds this listens to write in bursts — the candle poll walks the whole
 * watchlist, and the sample buffer republishes several instruments at once — and
 * a pass is a walk of the board. Collapsing a burst into one pass costs a
 * quarter of a second of latency on an alert that has already been true for as
 * long as it took the reading to arrive.
 */
const PASS_DEBOUNCE_MS = 250

/** How many readings a notification body carries before it stops being one line. */
const MAX_NOTIFIED_REASONS = 3

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
    let passTimer: ReturnType<typeof setTimeout> | undefined

    const evaluate = () => {
      const { instIds } = useTickerStore.getState()
      const now = Date.now()
      // One sort for the pass rather than one per symbol: the median is the same
      // number for every instrument being measured against it.
      const boardPercent = boardMedianPricePercent(instIds)

      for (const instId of instIds) {
        const signals = collectSignals(
          readSignalInput(instId, { boardPercent, now }),
        )
        const flag = flagStateOf(signals)
        const isNow = flag !== null

        // A symbol nobody has looked at yet has no edge to have crossed. This
        // covers the ones just added to the board as well as the ones present
        // at mount.
        const known = flagged.has(instId)
        const was = flagged.get(instId) ?? false
        flagged.set(instId, isNow)

        if (!known || !flag || was) continue
        if (now - startedAt < STARTUP_GRACE_MS) continue
        if (now - (firedAt.get(instId) ?? 0) < COOLDOWN_MS) continue

        firedAt.set(instId, now)
        useAlertStore.getState().push({
          id: `${instId}-${now}`,
          instId,
          at: now,
          headline: flag.headline,
          reasons: flag.reasons,
        })

        // Interrupting someone who is already looking at the board would only
        // repeat what the card's ring has already said.
        if (!isAway()) continue

        const { notificationsEnabled, soundEnabled } = useAlertStore.getState()
        if (notificationsEnabled) {
          showNotification(
            `${instId.split('-')[0]} — ${flag.headline}`,
            flag.reasons
              .slice(0, MAX_NOTIFIED_REASONS)
              .map((reason) => reason.detail)
              .join(' · '),
            instId,
          )
        }
        if (soundEnabled) beep()
      }

      // Symbols taken off the board should not keep their edge, or adding one
      // back would compare against a state from before it left.
      const watched = new Set(instIds)
      for (const instId of flagged.keys()) {
        if (!watched.has(instId)) flagged.delete(instId)
      }
    }

    const schedulePass = () => {
      if (passTimer) return
      passTimer = setTimeout(() => {
        passTimer = undefined
        evaluate()
      }, PASS_DEBOUNCE_MS)
    }

    evaluate()

    // Two feeds, because the readings live in two places by design: the polled
    // yardsticks and the candles come through the persisted store, and the
    // five-minute moves come off a buffer that deliberately never touches it.
    // Listening to only the first was enough while every reading was polled.
    const unsubscribeStore = useTickerStore.subscribe(schedulePass)
    const unsubscribeSeries = subscribeOkxSeriesAny(schedulePass)

    return () => {
      if (passTimer) clearTimeout(passTimer)
      unsubscribeStore()
      unsubscribeSeries()
    }
  }, [])
}
