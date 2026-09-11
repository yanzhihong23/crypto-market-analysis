/**
 * A persisted store's writes, collapsed to at most one serialisation per tick
 * of the clock below.
 *
 * `persist` saves on every write through the store, and what it saves is the
 * whole state — so the cost of one write is the size of everything the store
 * holds, however small the thing that changed. On a live board that is not a
 * detail: measured on a watchlist of forty, the candle poll, the funding
 * channel and the slow yardstick walks between them came to 220 writes a
 * minute of a 425KB blob, which is 90MB a minute of throwaway strings handed
 * one at a time to a synchronous `localStorage`. A tab doing that is a tab
 * Safari reloads for using significant memory, which is exactly what it did.
 *
 * Nothing here changes what is saved, only how often. The newest value is held
 * and written on the next tick, so a burst — the walk of a watchlist, a
 * reconnect resubscribing every symbol — costs one serialisation instead of
 * one per symbol.
 *
 * This is the layer below `createJSONStorage`, which is what makes the saving
 * real: `persist` hands a storage the state *object* and lets it decide how to
 * write it, so deferring here defers the `JSON.stringify` as well rather than
 * merely the `setItem`.
 */

import type { PersistStorage, StorageValue } from 'zustand/middleware'

/**
 * How long a write may sit unsaved. The ceiling on what a crash costs, and
 * everything in these stores is either refetched on mount or a preference the
 * same hand is about to set again — so seconds are affordable where the write
 * rate is not.
 */
const WRITE_INTERVAL_MS = 3000

/** Newest value per store name, waiting for the tick. */
const pending = new Map<string, unknown>()

let timer: ReturnType<typeof setTimeout> | undefined

const flush = () => {
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
  if (!pending.size) return

  for (const [name, value] of pending) {
    try {
      localStorage.setItem(name, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save the persisted state:', error)
    }
  }
  pending.clear()
}

/**
 * A throttle rather than a debounce: later writes replace the value without
 * pushing the write back, so a feed that never goes quiet still saves on the
 * interval instead of never.
 */
const schedule = () => {
  timer ??= setTimeout(flush, WRITE_INTERVAL_MS)
}

if (typeof window !== 'undefined') {
  // `pagehide` is the one that fires on the way out of a page in every browser,
  // including the Safari back/forward cache where `unload` does not. The
  // visibility change covers the tab being backgrounded on a phone, which on
  // iOS may be the last thing that happens before the page is discarded.
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

export function coalescedLocalStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name) => {
      // Its own unwritten value first, so a read cannot hand back a state older
      // than the one this has already been told about.
      const held = pending.get(name)
      if (held) return held as StorageValue<T>

      const saved = localStorage.getItem(name)
      if (!saved) return null
      try {
        return JSON.parse(saved) as StorageValue<T>
      } catch (error) {
        console.error('Failed to read the persisted state:', error)
        return null
      }
    },
    setItem: (name, value) => {
      pending.set(name, value)
      schedule()
    },
    removeItem: (name) => {
      pending.delete(name)
      localStorage.removeItem(name)
    },
  }
}
