import { useEffect } from 'react'

import { fetchOkxHistoryKlines, fetchOkxKlines } from '../apis'
import {
  getAllJournalSamples,
  updateJournalOutcomes,
} from '../store/signalJournalDb'
import { useAlertStore } from '../store/useAlertStore'
import { OkxKline, Period } from '../types/okx'
import type { AlertOutcomes } from '../utils/alertEngine'
import {
  ALL_HORIZONS,
  HORIZON_MS,
  computeOutcomesFromKlines,
  type HorizonOutcomes,
  type SignalSample,
} from '../utils/signalAnalytics'

const BAR_5M_MS = 5 * 60 * 1000
const BACKFILL_INTERVAL_MS = 1000 * 60 * 5
const FIRST_RUN_DELAY_MS = 1000 * 12
const RECENT_CANDLE_WINDOW_MS = 23 * 60 * 60 * 1000
const MAX_BACKFILL_PAGES = 3

function needsBackfill(sample: SignalSample, now: number) {
  if (!(sample.triggerPrice > 0)) return false
  return ALL_HORIZONS.some(
    (horizon) =>
      sample.outcomes?.[horizon] === undefined &&
      now >= sample.at + HORIZON_MS[horizon] + BAR_5M_MS,
  )
}

async function fetchCandlesForRange(
  instId: string,
  minAt: number,
  maxEndTs: number,
  now: number,
): Promise<OkxKline[]> {
  if (now - minAt <= RECENT_CANDLE_WINDOW_MS) {
    const recent = await fetchOkxKlines({
      instId,
      period: Period.MINUTE_5,
      limit: 300,
    })
    return Array.isArray(recent) ? recent : []
  }

  const rows: OkxKline[] = []
  let after: string | undefined = String(
    Math.min(now, maxEndTs + 2 * BAR_5M_MS),
  )
  for (let page = 0; page < MAX_BACKFILL_PAGES; page++) {
    const batch = await fetchOkxHistoryKlines({
      instId,
      period: Period.MINUTE_5,
      limit: 300,
      after,
    })
    if (!Array.isArray(batch) || !batch.length) break
    rows.push(...batch)
    const oldest = Number(batch[batch.length - 1][0])
    if (oldest <= minAt || batch.length < 100) break
    after = String(oldest)
  }
  return rows
}

/**
 * Fetches closed 5m OKX candles for any journal samples with matured but
 * missing +5m/+15m/+1h/+4h outcomes (including windows missed while the tab
 * was closed), computing exact close returns plus MFE and MAE.
 */
export async function backfillJournalOutcomes(
  now = Date.now(),
): Promise<number> {
  const samples = await getAllJournalSamples()
  const pending = samples.filter((sample) => needsBackfill(sample, now))
  if (!pending.length) return 0

  const byInst = new Map<string, SignalSample[]>()
  for (const sample of pending) {
    const bucket = byInst.get(sample.instId)
    if (bucket) bucket.push(sample)
    else byInst.set(sample.instId, [sample])
  }

  const journalUpdates: Record<string, HorizonOutcomes> = {}
  const alertUpdates: Record<string, AlertOutcomes> = {}

  for (const [instId, items] of byInst) {
    let minAt = Infinity
    let maxEndTs = 0
    for (const item of items) {
      if (item.at < minAt) minAt = item.at
      const itemEnd = item.at + HORIZON_MS.h4
      if (itemEnd > maxEndTs) maxEndTs = itemEnd
    }

    try {
      const klines = await fetchCandlesForRange(instId, minAt, maxEndTs, now)
      if (!klines.length) continue

      for (const sample of items) {
        const computed = computeOutcomesFromKlines(sample, klines, now)
        const changed = ALL_HORIZONS.some(
          (horizon) =>
            computed[horizon] !== undefined &&
            sample.outcomes?.[horizon] === undefined,
        )
        if (!changed) continue

        journalUpdates[sample.id] = computed
        alertUpdates[sample.id] = {
          ...(computed.m5 ? { m5: computed.m5.ret } : {}),
          ...(computed.m15 ? { m15: computed.m15.ret } : {}),
          ...(computed.h1 ? { h1: computed.h1.ret } : {}),
        }
      }
    } catch (error) {
      console.error(`Failed to backfill outcomes for ${instId}:`, error)
    }
  }

  const updatedCount = await updateJournalOutcomes(journalUpdates)
  if (Object.keys(alertUpdates).length) {
    useAlertStore.getState().recordOutcomes(alertUpdates)
  }
  return updatedCount
}

/**
 * Periodically backfills realized K-line outcomes + MFE/MAE for persisted
 * IndexedDB signal samples so closing or reloading the tab never creates gaps.
 */
export default function useOkxJournalBackfill() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const run = async () => {
      try {
        await backfillJournalOutcomes()
      } finally {
        if (!cancelled) {
          timer = setTimeout(() => {
            void run()
          }, BACKFILL_INTERVAL_MS)
        }
      }
    }

    timer = setTimeout(() => {
      void run()
    }, FIRST_RUN_DELAY_MS)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])
}
