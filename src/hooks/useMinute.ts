import { useSyncExternalStore } from 'react'

/**
 * The current minute, shared by every card that shows a countdown.
 *
 * One interval for the whole board rather than one per card, and a snapshot
 * that only changes on the minute so a card re-renders when its label would
 * actually differ. Polled more often than it changes so the turn of the minute
 * is never more than a few seconds stale.
 */
const POLL_MS = 15_000

const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  timer ??= setInterval(() => listeners.forEach((notify) => notify()), POLL_MS)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

const getSnapshot = () => Math.floor(Date.now() / 60_000)

export default function useMinute() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
