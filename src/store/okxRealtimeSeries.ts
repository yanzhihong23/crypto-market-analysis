/**
 * A five-minute memory for the two readings that arrive as a level and mean
 * something as a change: the price and the open interest.
 *
 * Both already stream in on the websocket, and both were being overwritten on
 * arrival — the store kept the newest figure and nothing to compare it against,
 * so "up three percent in five minutes" was not a question the board could
 * answer at any price. Keeping a handful of samples per instrument makes it free
 * to answer: no request, no endpoint, no poll.
 *
 * Out here with the other realtime maps rather than in the persisted store,
 * because every write to that one is serialised and handed to localStorage. The
 * yardsticks these changes are measured against are the slow-moving half and do
 * live there, the same split the funding rate already uses.
 */

/** The window a change is taken over. Also what its baseline is a sigma of. */
export const SERIES_WINDOW_MS = 1000 * 60 * 5

/**
 * One sample per instrument per this. The feed pushes the price every hundred
 * milliseconds; keeping all of it would be three thousand samples an instrument
 * to answer a question that moves on the scale of minutes.
 */
const SAMPLE_INTERVAL_MS = 1000 * 10

/**
 * A change taken over much less than the window is not the change the window's
 * baseline describes, so a buffer that does not reach back this far reports
 * nothing rather than a number that reads as comparable and is not. It also
 * covers the cold start: nothing fires for the first four minutes after the
 * page opens, which is honest — the board did not see what came before.
 */
const MIN_SPAN_MS = 1000 * 60 * 4

/** Enough to keep one sample older than the window, which brackets its start. */
const RETAIN_MS = SERIES_WINDOW_MS + SAMPLE_INTERVAL_MS * 2

type Listener = () => void

interface Sample {
  ts: number
  value: number
}

export interface SeriesChange {
  /** Percent move of the price across the window, or null without the span. */
  pricePercent: number | null
  /** Percent move of open interest across the window. */
  oiPercent: number | null
  /** What the samples actually cover, which is at most the window. */
  spanMs: number
}

/** Oldest first, so appending is a push and the window start is a scan. */
const priceSamples = new Map<string, Sample[]>()
const oiSamples = new Map<string, Sample[]>()

/**
 * Recomputed when a sample lands rather than when it is read: a snapshot has to
 * keep its identity between renders or `useSyncExternalStore` re-renders
 * forever, and a fresh object per read is exactly what that forbids.
 */
const changes = new Map<string, SeriesChange>()

/** Spot index price, keyed by index instrument, e.g. `BTC-USDT`. */
const indexPrices = new Map<string, number>()

const seriesListeners = new Map<string, Set<Listener>>()
const indexListeners = new Map<string, Set<Listener>>()
const anyListeners = new Set<Listener>()

const subscribeByKey = (
  registry: Map<string, Set<Listener>>,
  key: string,
  listener: Listener,
) => {
  let listeners = registry.get(key)
  if (!listeners) {
    listeners = new Set()
    registry.set(key, listeners)
  }
  listeners.add(listener)
  return () => {
    listeners?.delete(listener)
    if (listeners?.size === 0) registry.delete(key)
  }
}

const notifyKey = (registry: Map<string, Set<Listener>>, key: string) => {
  registry.get(key)?.forEach((listener) => listener())
}

/**
 * The whole-board listener is the alert pass, which walks every symbol each time
 * it runs. Firing it once per instrument per sample would run it several times a
 * second on a busy watchlist to answer a question none of whose inputs moved
 * more than once in that time.
 */
const ANY_FLUSH_MS = 1000
let anyFlushTimer: ReturnType<typeof setTimeout> | undefined

const scheduleAnyNotify = () => {
  if (anyFlushTimer) return
  anyFlushTimer = setTimeout(() => {
    anyFlushTimer = undefined
    anyListeners.forEach((listener) => listener())
  }, ANY_FLUSH_MS)
}

/**
 * The sample the window opened at. The newest one already outside the window
 * brackets its start; a buffer too young to have one falls back to its oldest,
 * and the span it reports is what lets the caller reject that.
 */
const anchorOf = (samples: Sample[], now: number) => {
  const target = now - SERIES_WINDOW_MS
  let anchor: Sample | undefined
  for (const sample of samples) {
    if (sample.ts > target) break
    anchor = sample
  }
  return anchor ?? samples[0]
}

const changeOf = (samples: Sample[] | undefined, now: number) => {
  if (!samples?.length) return { percent: null, spanMs: 0 }

  const latest = samples[samples.length - 1]
  const anchor = anchorOf(samples, now)
  const spanMs = latest.ts - anchor.ts

  if (spanMs < MIN_SPAN_MS || !(anchor.value > 0)) {
    return { percent: null, spanMs }
  }
  return {
    percent: ((latest.value - anchor.value) / anchor.value) * 100,
    spanMs,
  }
}

/**
 * Bumped whenever any instrument's change is rewritten, which is the only thing
 * that can move the board's median. Cheaper than comparing the map.
 */
let version = 0

const recompute = (instId: string, now: number) => {
  const price = changeOf(priceSamples.get(instId), now)
  const oi = changeOf(oiSamples.get(instId), now)

  changes.set(instId, {
    pricePercent: price.percent,
    oiPercent: oi.percent,
    spanMs: Math.max(price.spanMs, oi.spanMs),
  })
  version++

  notifyKey(seriesListeners, instId)
  scheduleAnyNotify()
}

const record = (
  registry: Map<string, Sample[]>,
  instId: string,
  value: number,
  ts: number,
) => {
  if (!Number.isFinite(value) || !Number.isFinite(ts)) return

  let samples = registry.get(instId)
  if (!samples) {
    samples = []
    registry.set(instId, samples)
  }

  const latest = samples[samples.length - 1]
  // A feed that pushes faster than the sample rate contributes its first
  // message in each slot and nothing else. Out-of-order stamps are dropped
  // rather than sorted in: they would put the window start after its end.
  if (latest && ts - latest.ts < SAMPLE_INTERVAL_MS) return

  samples.push({ ts, value })

  const cutoff = ts - RETAIN_MS
  while (samples.length > 1 && samples[0].ts < cutoff) samples.shift()

  recompute(instId, ts)
}

export const recordOkxPrice = (instId: string, price: number, ts: number) =>
  record(priceSamples, instId, price, ts)

export const recordOkxOpenInterest = (instId: string, oi: number, ts: number) =>
  record(oiSamples, instId, oi, ts)

export const getOkxSeriesChange = (instId: string) => changes.get(instId)

export const subscribeOkxSeries = (instId: string, listener: Listener) =>
  subscribeByKey(seriesListeners, instId, listener)

/** Every instrument at once, coalesced. For the pass that watches the board. */
export const subscribeOkxSeriesAny = (listener: Listener) => {
  anyListeners.add(listener)
  return () => {
    anyListeners.delete(listener)
  }
}

/**
 * The spot index a perpetual is quoted against: `BTC-USDT-SWAP` settles against
 * the `BTC-USDT` index, and the gap between the two is the premium the contract
 * is trading at.
 */
export const indexInstIdOf = (instId: string) =>
  instId.endsWith('-SWAP') ? instId.slice(0, -'-SWAP'.length) : instId

export const setOkxIndexPrice = (indexInstId: string, idxPx: number) => {
  if (!Number.isFinite(idxPx) || indexPrices.get(indexInstId) === idxPx) return
  indexPrices.set(indexInstId, idxPx)
  notifyKey(indexListeners, indexInstId)
}

export const getOkxIndexPrice = (indexInstId: string) =>
  indexPrices.get(indexInstId)

export const subscribeOkxIndexPrice = (
  indexInstId: string,
  listener: Listener,
) => subscribeByKey(indexListeners, indexInstId, listener)

/**
 * Cached because every card on the board asks for the same number on every one
 * of its renders, and the answer can only differ once a sample has landed.
 * Uncached this was a sort per card per tick for a value identical across all of
 * them.
 */
let median: { key: string; version: number; value: number | null } | undefined

/**
 * The middle of the board's five-minute moves, which is what a symbol has to
 * beat to have done anything of its own. A mean would be dragged around by the
 * one symbol that just moved twenty percent — the number it is being compared
 * against would contain the thing being measured.
 */
export const boardMedianPricePercent = (instIds: string[]) => {
  const key = instIds.join(',')
  if (median && median.version === version && median.key === key) {
    return median.value
  }

  const moves = instIds
    .map((instId) => changes.get(instId)?.pricePercent)
    .filter(
      (percent): percent is number => percent !== null && percent !== undefined,
    )
    .sort((a, b) => a - b)

  const middle = Math.floor(moves.length / 2)
  const value = !moves.length
    ? null
    : moves.length % 2
      ? moves[middle]
      : (moves[middle - 1] + moves[middle]) / 2

  median = { key, version, value }
  return value
}

export const removeOkxSeries = (instId: string) => {
  priceSamples.delete(instId)
  oiSamples.delete(instId)
  changes.delete(instId)
  indexPrices.delete(indexInstIdOf(instId))
  version++
  notifyKey(seriesListeners, instId)
  scheduleAnyNotify()
}
