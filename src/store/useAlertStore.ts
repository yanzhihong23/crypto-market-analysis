import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { Signal, formatDeviation, formatSigmas } from '../utils/signals'

export interface Alert {
  id: string
  instId: string
  at: number
  /** The combination in words, e.g. "Move with flow behind it". */
  headline: string
  /**
   * Every reading that was out of range when it fired, with the sentence each
   * wrote for itself. Stored rather than recomputed: the series behind a reading
   * has rolled off long before anyone scrolls back to it, and an entry that
   * changed its mind about what happened would be worse than no entry.
   */
  reasons: Signal[]
}

/** Alerts as they were stored before a reading other than the two could fire. */
interface LegacyAlert {
  id: string
  instId: string
  at: number
  ratioDeviation: number
  fundingDeviation: number
}

/**
 * Enough to answer "what happened while I was out" and no more. The list is a
 * log of moments, not a dataset — an unbounded one persisted to localStorage
 * would grow forever for a page nobody scrolls to the bottom of.
 */
const MAX_ALERTS = 50

interface AlertStore {
  alerts: Alert[]
  push: (alert: Alert) => void
  clear: () => void
  /** When the list was last opened, which is what the badge counts against. */
  seenAt: number
  markSeen: () => void
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set) => ({
      alerts: [],
      push: (alert: Alert) =>
        set((state) => ({
          alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS),
        })),
      clear: () => set({ alerts: [], seenAt: Date.now() }),
      seenAt: 0,
      markSeen: () => set({ seenAt: Date.now() }),
      // Off until asked for. Turning either on is what gets the browser's own
      // permission prompt in front of someone who is expecting it.
      notificationsEnabled: false,
      setNotificationsEnabled: (notificationsEnabled: boolean) =>
        set({ notificationsEnabled }),
      soundEnabled: false,
      setSoundEnabled: (soundEnabled: boolean) => set({ soundEnabled }),
    }),
    {
      name: 'alerts',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      /**
       * Alerts written before the list could hold anything but the positioning
       * pair. Rewritten rather than dropped: the point of the list is to answer
       * what happened while you were out, and clearing it on an upgrade answers
       * it wrongly.
       */
      migrate: (persisted, version) => {
        const state = persisted as Omit<AlertStore, 'alerts'> & {
          alerts: LegacyAlert[]
        }
        if (version >= 1) return persisted as AlertStore

        return {
          ...state,
          alerts: (state.alerts ?? []).map(
            ({ id, instId, at, ratioDeviation, fundingDeviation }): Alert => ({
              id,
              instId,
              at,
              headline: 'Positioning stretched on two readings',
              reasons: [
                {
                  kind: 'ratio',
                  deviation: ratioDeviation,
                  label: `L/S ${formatSigmas(ratioDeviation)}`,
                  detail: `L/S ${formatDeviation(ratioDeviation)}`,
                },
                {
                  kind: 'funding',
                  deviation: fundingDeviation,
                  label: `funding ${formatSigmas(fundingDeviation)}`,
                  detail: `funding ${formatDeviation(fundingDeviation)}`,
                },
              ],
            }),
          ),
        }
      },
    },
  ),
)
