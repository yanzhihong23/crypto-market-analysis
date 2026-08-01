import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Alert {
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
    },
  ),
)
