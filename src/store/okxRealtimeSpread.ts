/**
 * What the book is charging to cross it, and what this instrument's book
 * usually charges.
 *
 * The best bid and the best ask have been arriving on every ticker message
 * since the board was first wired up, and nothing has ever read them. They are
 * worth reading: a spread widening is liquidity leaving, and it is the reason an
 * ordinary-sized order turns into a two percent candle. Every other reading here
 * describes something that has already happened — this one describes the
 * condition it happens into.
 *
 * There is no history endpoint for a spread, so the yardstick has to be built
 * from what arrives. That puts this module out here with the other realtime maps
 * rather than in the persisted store, and it means the first couple of minutes
 * after a page opens report nothing, which is honest: the board did not see what
 * the book looked like before it got here.
 */

import { Baseline, baselineOf, medianOf } from '../utils/signals'

/**
 * How much of its own recent behaviour a spread is judged against. Half an hour
 * covers the regime the book is currently in — spreads widen for a session and
 * narrow again, so a day of them would call an ordinary spread in a nervous hour
 * unusual and miss a real withdrawal in a calm one.
 */
export const SPREAD_WINDOW_MS = 1000 * 60 * 30

/**
 * Faster than the five-minute buffer samples at, because a spread is a level
 * that jumps rather than one that drifts: it can be one tick wide and four ticks
 * wide inside the same second, and a sample every ten would be describing a
 * different quantity depending on which instant it landed on.
 */
const SAMPLE_INTERVAL_MS = 5000

/**
 * How many of the newest samples make up the reading. A single snapshot fires on
 * one market maker pulling one quote for a moment; the middle of the last half
 * minute is the book, and it is still current enough to be worth saying.
 */
const CURRENT_SAMPLES = 6

const RETAIN_MS = SPREAD_WINDOW_MS + SAMPLE_INTERVAL_MS

type Listener = () => void

interface Sample {
  ts: number
  value: number
}

export interface SpreadRead {
  /** Ask over bid as a share of the mid, in basis points. */
  bps: number
  /**
   * What this instrument's book has been charging over the window, excluding
   * the samples the reading itself is made of — a yardstick containing the
   * thing being measured would flatten exactly the event this is here to catch.
   */
  baseline: Baseline | null
}

/** Oldest first, so appending is a push and the newest are a tail slice. */
const samples = new Map<string, Sample[]>()

/**
 * Recomputed when a sample lands rather than when one is read: a snapshot has to
 * keep its identity between renders or `useSyncExternalStore` re-renders
 * forever.
 */
const reads = new Map<string, SpreadRead>()

const listeners = new Map<string, Set<Listener>>()

const recompute = (instId: string) => {
  const buffer = samples.get(instId)
  if (!buffer?.length) return

  const current = buffer.slice(-CURRENT_SAMPLES)
  const history = buffer.slice(0, -CURRENT_SAMPLES)

  const bps = medianOf(current.map((sample) => sample.value))
  if (bps === null) return

  reads.set(instId, {
    bps,
    baseline: baselineOf(history.map((sample) => sample.value)),
  })

  listeners.get(instId)?.forEach((listener) => listener())
}

export const recordOkxSpread = (
  instId: string,
  bid: number,
  ask: number,
  ts: number,
) => {
  // A crossed or half-quoted book is not a wide book, it is a message that
  // arrived mid-update, and averaging it in would put a negative spread into
  // the baseline every reconnect.
  if (!(bid > 0) || !(ask > 0) || ask < bid || !Number.isFinite(ts)) return

  const mid = (ask + bid) / 2
  const bps = ((ask - bid) / mid) * 10000

  let buffer = samples.get(instId)
  if (!buffer) {
    buffer = []
    samples.set(instId, buffer)
  }

  // The feed pushes faster than the sample rate, so each slot keeps its first
  // message and drops the rest. Out-of-order stamps are dropped rather than
  // sorted in: they would put part of the window's history into its tail.
  const latest = buffer[buffer.length - 1]
  if (latest && ts - latest.ts < SAMPLE_INTERVAL_MS) return

  buffer.push({ ts, value: bps })

  const cutoff = ts - RETAIN_MS
  while (buffer.length > 1 && buffer[0].ts < cutoff) buffer.shift()

  recompute(instId)
}

export const getOkxSpread = (instId: string) => reads.get(instId)

export const subscribeOkxSpread = (instId: string, listener: Listener) => {
  let set = listeners.get(instId)
  if (!set) {
    set = new Set()
    listeners.set(instId, set)
  }
  set.add(listener)
  return () => {
    set?.delete(listener)
    if (set?.size === 0) listeners.delete(instId)
  }
}

export const removeOkxSpread = (instId: string) => {
  samples.delete(instId)
  reads.delete(instId)
  listeners.get(instId)?.forEach((listener) => listener())
}
