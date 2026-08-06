/**
 * Positions the exchange closed out for their holders, over the last five
 * minutes.
 *
 * Everything else on this board describes what people chose to do. This is the
 * one reading that describes what was done to them, and that is why it is worth
 * carrying: a move that ran on forced selling is a different animal from one
 * that ran on selling, both in what caused it and in what happens next — a
 * cascade sells until the positions are gone and then has nothing left to sell.
 *
 * The board already infers this. `squeezeRead` looks at the price and the open
 * interest together and says "longs liquidated into the fall" when the pair
 * points that way, which is a fair guess from two numbers that each have other
 * explanations. This is the exchange saying so outright.
 *
 * Out here with the other realtime maps rather than in the persisted store, for
 * the reason they all are: it is written from the socket and read on render, and
 * every write through the persisted store is handed to localStorage.
 */

/** The window liquidations are counted over, matching the price and OI moves. */
export const LIQUIDATION_WINDOW_MS = 1000 * 60 * 5

interface Event {
  ts: number
  /** Contracts, the same unit the open interest is quoted in. */
  sz: number
  long: boolean
}

export interface LiquidationRead {
  /** Contracts of long positions closed out inside the window. */
  long: number
  /** And of short ones. */
  short: number
}

type Listener = () => void

/** Oldest first, so appending is a push and expiring is a shift. */
const events = new Map<string, Event[]>()

/**
 * Recomputed when the window changes rather than when it is read. A snapshot has
 * to keep its identity between renders or `useSyncExternalStore` re-renders
 * forever, and summing on read would hand back a new object every time.
 */
const reads = new Map<string, LiquidationRead>()

const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>()
const listeners = new Map<string, Set<Listener>>()

const notify = (instId: string) =>
  listeners.get(instId)?.forEach((listener) => listener())

/**
 * Rebuilds the window and arms a timer for the moment its oldest event falls
 * out of it.
 *
 * The timer is the part that earns its keep. A window that only recomputed when
 * something arrived would leave an instrument that was liquidated hard and then
 * went quiet reporting the same figure until the next thing happened to it,
 * which is exactly backwards — the whole claim is "in the last five minutes".
 */
const recompute = (instId: string, now: number) => {
  const existing = expiryTimers.get(instId)
  if (existing) {
    clearTimeout(existing)
    expiryTimers.delete(instId)
  }

  const buffer = events.get(instId)
  if (!buffer) return

  const cutoff = now - LIQUIDATION_WINDOW_MS
  while (buffer.length && buffer[0].ts < cutoff) buffer.shift()

  if (!buffer.length) {
    events.delete(instId)
    // Absent rather than a pair of zeros, so a caller can tell "nothing has
    // been liquidated" from "nothing is watching this" without either of them
    // reading as a measurement.
    if (reads.delete(instId)) notify(instId)
    return
  }

  let long = 0
  let short = 0
  for (const event of buffer) {
    if (event.long) long += event.sz
    else short += event.sz
  }
  reads.set(instId, { long, short })

  expiryTimers.set(
    instId,
    setTimeout(
      () => recompute(instId, Date.now()),
      Math.max(buffer[0].ts + LIQUIDATION_WINDOW_MS - now, 0) + 1,
    ),
  )

  notify(instId)
}

/**
 * Records one liquidation. Per detail rather than per message, because a single
 * message carries however many happened at once — which on the occasions this
 * reading matters at all is a great many.
 */
export const recordOkxLiquidation = (
  instId: string,
  sz: number,
  long: boolean,
  ts: number,
) => {
  if (!(sz > 0) || !Number.isFinite(ts)) return

  let buffer = events.get(instId)
  if (!buffer) {
    buffer = []
    events.set(instId, buffer)
  }

  // Inserted by the exchange's stamp rather than by arrival. A cascade is the
  // one time this reading matters and the one time a message carries hundreds
  // of details, and they do not arrive in order — an older one landing last
  // would sit at the head, where the expiry scan stops at the first row still
  // inside the window and would therefore stop immediately, holding every
  // expired event in the count behind it. Appending is still the common path:
  // the search starts from the newest end and usually finds nothing later.
  let at = buffer.length
  while (at > 0 && buffer[at - 1].ts > ts) at--
  buffer.splice(at, 0, { ts, sz, long })

  recompute(instId, Date.now())
}

export const getOkxLiquidation = (instId: string) => reads.get(instId)

export const subscribeOkxLiquidation = (instId: string, listener: Listener) => {
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

export const removeOkxLiquidation = (instId: string) => {
  const timer = expiryTimers.get(instId)
  if (timer) clearTimeout(timer)
  expiryTimers.delete(instId)
  events.delete(instId)
  reads.delete(instId)
  notify(instId)
}
