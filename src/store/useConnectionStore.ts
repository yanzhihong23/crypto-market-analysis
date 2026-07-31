import { create } from 'zustand'

export type FeedStatus = 'idle' | 'connecting' | 'live' | 'reconnecting'

interface ConnectionStore {
  status: FeedStatus
  setFeedStatus: (status: FeedStatus) => void
}

export const useConnectionStore = create<ConnectionStore>()((set) => ({
  status: 'idle',
  setFeedStatus: (status) => set({ status }),
}))

export const setFeedStatus = (status: FeedStatus) =>
  useConnectionStore.getState().setFeedStatus(status)

/**
 * Message timestamps live outside the store on purpose: they move several times
 * a second and nothing should re-render on them. The indicator reads this on
 * the one-second tick it already runs for its own label.
 */
let lastMessageAt = 0

export const markFeedMessage = () => {
  lastMessageAt = Date.now()
}

export const getLastFeedMessage = () => lastMessageAt

export const resetFeed = () => {
  lastMessageAt = 0
  setFeedStatus('idle')
}
