import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { Signal, formatDeviation, formatSigmas } from '../utils/signals'
import { currentMessages } from '../i18n'

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
  /**
   * Whether the strip along the bottom runs at all. On, because it is the only
   * one of these channels that cannot interrupt anything — it says its piece on
   * the page you are already looking at. Off is for the reader who cannot read
   * a board with something moving on it, and it has to be a setting rather than
   * the strip's own dismissal: that one clears the batch in front of you, so
   * without this they would be closing it again every time a card fired.
   */
  tapeEnabled: boolean
  setTapeEnabled: (enabled: boolean) => void
  /**
   * When the tape along the bottom was last waved away, which every entry on it
   * is dated against. Separate from `seenAt` because the two answer different
   * questions: opening the list means you have read it, while dismissing the
   * tape only means you are done being shown it — and a later alert brings the
   * strip back on its own, which is the whole reason this is a timestamp rather
   * than a flag.
   */
  tapeDismissedAt: number
  dismissTape: () => void
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  /**
   * Whether the two channels above hold their fire while the window is the one
   * in front. On by default, which is how they behaved before this was a choice:
   * being pinged about a card you are already watching is noise. Off is for a
   * board on a second monitor, where nothing is watching it closely enough for
   * the ring on the card to count as having been told.
   */
  quietWhenPresent: boolean
  setQuietWhenPresent: (quiet: boolean) => void
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
      tapeEnabled: true,
      setTapeEnabled: (tapeEnabled: boolean) => set({ tapeEnabled }),
      tapeDismissedAt: 0,
      dismissTape: () => set({ tapeDismissedAt: Date.now() }),
      // Off until asked for. Turning either on is what gets the browser's own
      // permission prompt in front of someone who is expecting it.
      notificationsEnabled: false,
      setNotificationsEnabled: (notificationsEnabled: boolean) =>
        set({ notificationsEnabled }),
      soundEnabled: false,
      setSoundEnabled: (soundEnabled: boolean) => set({ soundEnabled }),
      quietWhenPresent: true,
      setQuietWhenPresent: (quietWhenPresent: boolean) =>
        set({ quietWhenPresent }),
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

        // Rewritten in the language in force at the upgrade, which is the only
        // one available: the old entries stored two deviations and no words.
        const t = currentMessages()

        return {
          ...state,
          alerts: (state.alerts ?? []).map(
            ({ id, instId, at, ratioDeviation, fundingDeviation }): Alert => ({
              id,
              instId,
              at,
              headline: t.headline.positioning,
              reasons: [
                {
                  kind: 'ratio',
                  deviation: ratioDeviation,
                  label: t.signal.ratio(formatSigmas(ratioDeviation, t)),
                  detail: t.signal.ratioDetail(
                    formatDeviation(ratioDeviation, t),
                  ),
                },
                {
                  kind: 'funding',
                  deviation: fundingDeviation,
                  label: t.signal.funding(formatSigmas(fundingDeviation, t)),
                  detail: t.signal.fundingDetail(
                    formatDeviation(fundingDeviation, t),
                  ),
                },
              ],
            }),
          ),
        }
      },
    },
  ),
)
