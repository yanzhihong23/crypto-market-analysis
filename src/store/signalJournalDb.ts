import type { HorizonOutcomes, SignalSample } from '../utils/signalAnalytics'

const DB_NAME = 'vigil-signal-journal'
const DB_VERSION = 1
const STORE_NAME = 'samples'
/** Keep enough samples for meaningful multi-week regime statistics without unbounded growth. */
const MAX_JOURNAL_SAMPLES = 2000

type Listener = () => void
const listeners = new Set<Listener>()
const notify = () => listeners.forEach((listener) => listener())

/** In-memory fallback when IndexedDB is unavailable (e.g. private browsing / tests). */
const memoryFallback = new Map<string, SignalSample>()

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('at', 'at')
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })

  return dbPromise
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function pruneOldest(db: IDBDatabase) {
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const count = await new Promise<number>((resolve, reject) => {
    const req = store.count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  const excess = count - MAX_JOURNAL_SAMPLES
  if (excess <= 0) return

  const index = store.index('at')
  let removed = 0
  await new Promise<void>((resolve, reject) => {
    const cursorReq = index.openCursor()
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      if (!cursor || removed >= excess) {
        resolve()
        return
      }
      cursor.delete()
      removed++
      cursor.continue()
    }
    cursorReq.onerror = () => reject(cursorReq.error)
  })
  await txDone(tx)
}

export function subscribeJournal(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function getAllJournalSamples(): Promise<SignalSample[]> {
  const db = await openDb()
  if (!db) {
    return [...memoryFallback.values()].sort((a, b) => b.at - a.at)
  }

  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const items = await new Promise<SignalSample[]>((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as SignalSample[])
    req.onerror = () => reject(req.error)
  })
  return items.sort((a, b) => b.at - a.at)
}

export async function putJournalSample(sample: SignalSample): Promise<void> {
  await putJournalSamples([sample])
}

export async function putJournalSamples(
  samples: SignalSample[],
): Promise<void> {
  if (!samples.length) return
  const db = await openDb()
  if (!db) {
    for (const sample of samples) memoryFallback.set(sample.id, sample)
    while (memoryFallback.size > MAX_JOURNAL_SAMPLES) {
      const oldest = [...memoryFallback.values()].sort((a, b) => a.at - b.at)[0]
      if (!oldest) break
      memoryFallback.delete(oldest.id)
    }
    notify()
    return
  }

  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  for (const sample of samples) {
    store.put(sample)
  }
  await txDone(tx)
  await pruneOldest(db)
  notify()
}

export async function updateJournalOutcomes(
  updates: Record<string, HorizonOutcomes>,
): Promise<number> {
  const ids = Object.keys(updates)
  if (!ids.length) return 0

  const db = await openDb()
  if (!db) {
    let updated = 0
    for (const id of ids) {
      const existing = memoryFallback.get(id)
      if (!existing) continue
      memoryFallback.set(id, {
        ...existing,
        outcomes: { ...existing.outcomes, ...updates[id] },
      })
      updated++
    }
    if (updated) notify()
    return updated
  }

  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  let updated = 0

  for (const id of ids) {
    const existing = await new Promise<SignalSample | undefined>(
      (resolve, reject) => {
        const req = store.get(id)
        req.onsuccess = () => resolve(req.result as SignalSample | undefined)
        req.onerror = () => reject(req.error)
      },
    )
    if (!existing) continue
    store.put({
      ...existing,
      outcomes: { ...existing.outcomes, ...updates[id] },
    })
    updated++
  }

  await txDone(tx)
  if (updated) notify()
  return updated
}

export async function clearJournal(
  source?: SignalSample['source'],
): Promise<void> {
  const db = await openDb()
  if (!db) {
    if (!source) {
      memoryFallback.clear()
    } else {
      for (const [id, sample] of memoryFallback) {
        if (sample.source === source) memoryFallback.delete(id)
      }
    }
    notify()
    return
  }

  if (!source) {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    await txDone(tx)
    notify()
    return
  }

  const all = await getAllJournalSamples()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  for (const sample of all) {
    if (sample.source === source) store.delete(sample.id)
  }
  await txDone(tx)
  notify()
}
