import { useEffect } from 'react'

import { groupIdOf, useTickerStore } from '../store/useTickerStore'
import { useAlertStore } from '../store/useAlertStore'
import { openOkxDetail } from '../store/useOkxDetailStore'
import { readSignalInput } from '../store/okxSignalInput'
import { readBackdrop } from '../store/okxBackdropInput'
import {
  boardMedianPricePercent,
  subscribeOkxSeriesAny,
} from '../store/okxRealtimeSeries'
import { subscribeOkxLiquidationAny } from '../store/okxRealtimeLiquidation'
import { subscribeOkxSpreadAny } from '../store/okxRealtimeSpread'
import { getOkxTickerSnapshot } from '../store/okxRealtimeTicker'
import { beep, isAway, showNotification } from '../utils/alarm'
import {
  AlertMemory,
  DEFAULT_COOLDOWN_MS,
  DEFAULT_ESCALATION_FLOOR_MS,
  evaluateAlertOutcomes,
  memoryOfFlag,
  shouldEmitAlert,
} from '../utils/alertEngine'
import { collectSignals } from '../utils/detectors'
import { flagStateOf } from '../utils/signals'
import { currentMessages } from '../i18n'

/**
 * Nothing fires in the first minute. The readings a flag is built from are
 * fetched per instrument on a loop, so a cold start walks the whole watchlist
 * from nothing to its real state — without this, opening the page on an empty
 * cache would announce everything that was already true.
 */
const STARTUP_GRACE_MS = 1000 * 60

/**
 * Feeds write in bursts — the candle poll walks the whole watchlist, and the
 * realtime buffers republish several instruments at once — so collapsing a
 * burst into one board pass saves redundant work at negligible latency.
 */
const PASS_DEBOUNCE_MS = 250

/** How often realized +5m/+15m/+1h outcomes are checked for recent alerts. */
const OUTCOME_TICK_MS = 1000 * 30

/** How many readings a notification body carries before it stops being one line. */
const MAX_NOTIFIED_REASONS = 3

/**
 * Watches the same bar the card's ring is drawn from and reports the moment it
 * is crossed — or when an already-ringing symbol escalates into a higher tier,
 * adds a third family, flips direction, or hits a liquidation/major breakout.
 */
export default function useOkxAlerts() {
  useEffect(() => {
    const flagged = new Map<string, boolean>()
    const lastAlert = new Map<string, AlertMemory>()
    const startedAt = Date.now()
    let passTimer: ReturnType<typeof setTimeout> | undefined

    const evaluate = () => {
      const state = useTickerStore.getState()
      const { instIds, groups, symbolGroup } = state
      const now = Date.now()
      // One sort per group rather than one per symbol: every instrument in a
      // section shares the same peer median, and different asset classes no
      // longer skew each other's relative strength.
      const peersByGroup = new Map<string, string[]>()
      for (const instId of instIds) {
        const gid = groups.length ? groupIdOf(instId, groups, symbolGroup) : ''
        const bucket = peersByGroup.get(gid)
        if (bucket) bucket.push(instId)
        else peersByGroup.set(gid, [instId])
      }
      const boardPercentByGroup = new Map<string, number | null>()
      for (const [gid, peers] of peersByGroup) {
        boardPercentByGroup.set(gid, boardMedianPricePercent(peers))
      }
      // Read once per pass rather than subscribed to: an entry is written in
      // whatever language was in force when it fired, and switching afterwards
      // does not rewrite what already happened.
      const t = currentMessages()

      for (const instId of instIds) {
        const gid = groups.length ? groupIdOf(instId, groups, symbolGroup) : ''
        const signals = collectSignals(
          readSignalInput(instId, {
            boardPercent: boardPercentByGroup.get(gid),
            now,
          }),
          t,
        )
        const backdropReadings = readBackdrop(instId, t).readings
        const flag = flagStateOf(signals, t, backdropReadings)
        const isNow = flag !== null

        // A symbol nobody has looked at yet has no edge to have crossed. This
        // covers the ones just added to the board as well as the ones present
        // at mount.
        const known = flagged.has(instId)
        const was = flagged.get(instId) ?? false
        flagged.set(instId, isNow)

        if (!known || !flag) continue
        if (now - startedAt < STARTUP_GRACE_MS) continue

        const previous = lastAlert.get(instId)
        if (
          !shouldEmitAlert(previous, flag, now, {
            wasFlagged: was,
            cooldownMs: DEFAULT_COOLDOWN_MS,
            escalationFloorMs: DEFAULT_ESCALATION_FLOOR_MS,
          })
        ) {
          continue
        }

        lastAlert.set(instId, memoryOfFlag(flag, now))

        const livePrice = Number(getOkxTickerSnapshot(instId)?.last)
        useAlertStore.getState().push({
          id: `${instId}-${now}`,
          instId,
          at: now,
          headline: flag.headline,
          reasons: flag.reasons,
          context: backdropReadings,
          tier: flag.tier,
          regime: flag.regime,
          direction: flag.direction,
          triggerPrice:
            Number.isFinite(livePrice) && livePrice > 0 ? livePrice : undefined,
        })

        const {
          notificationsEnabled,
          soundEnabled,
          quietWhenPresent,
          highPriorityOnly,
        } = useAlertStore.getState()

        if (highPriorityOnly && flag.tier !== 'high') continue

        // Interrupting someone who is already looking at the board would only
        // repeat what the card's ring has already said — unless they have said
        // the ring is not enough, which is the case for a board left on a
        // monitor nobody is reading.
        if (quietWhenPresent && !isAway()) continue

        if (notificationsEnabled) {
          showNotification(
            `${instId.split('-')[0]} — ${flag.headline}`,
            flag.reasons
              .slice(0, MAX_NOTIFIED_REASONS)
              .map((reason) => reason.detail)
              .join(' · '),
            instId,
            () => openOkxDetail(instId),
          )
        }
        if (soundEnabled) beep()
      }

      // Symbols taken off the board should not keep their edge, or adding one
      // back would compare against a state from before it left.
      const watched = new Set(instIds)
      for (const instId of flagged.keys()) {
        if (!watched.has(instId)) {
          flagged.delete(instId)
          lastAlert.delete(instId)
        }
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

    // Subscribe to every source that can flip a detector: persisted store
    // polls, 5m series & spot index updates, live liquidations, and live book
    // spread changes.
    const unsubscribeStore = useTickerStore.subscribe(schedulePass)
    const unsubscribeSeries = subscribeOkxSeriesAny(schedulePass)
    const unsubscribeLiquidation = subscribeOkxLiquidationAny(schedulePass)
    const unsubscribeSpread = subscribeOkxSpreadAny(schedulePass)

    const outcomeInterval = setInterval(() => {
      const store = useAlertStore.getState()
      const updates = evaluateAlertOutcomes(
        store.alerts,
        (instId) => Number(getOkxTickerSnapshot(instId)?.last),
        Date.now(),
      )
      if (Object.keys(updates).length) {
        store.recordOutcomes(updates)
      }
    }, OUTCOME_TICK_MS)

    return () => {
      if (passTimer) clearTimeout(passTimer)
      clearInterval(outcomeInterval)
      unsubscribeStore()
      unsubscribeSeries()
      unsubscribeLiquidation()
      unsubscribeSpread()
    }
  }, [])
}
