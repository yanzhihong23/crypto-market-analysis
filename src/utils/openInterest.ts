/**
 * What a price move and an open interest move say together.
 *
 * Open interest is the count of contracts still open, so it rises only when a
 * buyer and a seller both take on new exposure and falls only when a pair of
 * them closes. That makes it the one reading that separates a move somebody is
 * putting money behind from a move somebody is getting out of the way of — the
 * price change alone cannot tell those apart.
 */

/**
 * Below this the reading is noise rather than flow. Open interest drifts by
 * fractions of a percent all day on its own, and attributing that drift to
 * anyone would put a confident sentence on a card that has nothing behind it.
 */
const FLAT_OI_PERCENT = 0.5
const FLAT_PRICE_PERCENT = 0.1

export type FlowRead =
  'longs-building' | 'shorts-covering' | 'shorts-building' | 'longs-closing'

/**
 * Each says what the move is and what it is not, because the pair that shares a
 * price direction is what gets confused: a rally on falling open interest is
 * shorts buying their way out, and it runs out of fuel where a rally on new
 * longs need not.
 */
const FLOW_DESCRIPTIONS: Record<FlowRead, string> = {
  'longs-building': 'new longs behind the move up',
  'shorts-covering': 'shorts covering, not new longs',
  'shorts-building': 'new shorts behind the move down',
  'longs-closing': 'longs closing, not new shorts',
}

/** Which of the four quadrants the pair of moves falls in, if either is real. */
export function flowRead(
  pricePercent: number,
  oiPercent: number,
): FlowRead | null {
  if (!Number.isFinite(pricePercent) || !Number.isFinite(oiPercent)) return null
  if (Math.abs(oiPercent) < FLAT_OI_PERCENT) return null
  if (Math.abs(pricePercent) < FLAT_PRICE_PERCENT) return null

  if (pricePercent > 0) {
    return oiPercent > 0 ? 'longs-building' : 'shorts-covering'
  }
  return oiPercent > 0 ? 'shorts-building' : 'longs-closing'
}

/** How the chip's tooltip says it. */
export function describeFlow(read: FlowRead) {
  return FLOW_DESCRIPTIONS[read]
}

/**
 * The same four quadrants over five minutes instead of a session, which is a
 * different event and deserves different words.
 *
 * Over a session, open interest coming off while the price moves is positions
 * being closed, and that is all it is. Over five minutes, with the price moving
 * far enough to be worth flagging at all, it is positions being closed faster
 * than their holders chose to: a rally on collapsing open interest is shorts
 * buying back at whatever it costs, and a slide on collapsing open interest is
 * longs being liquidated into it. Those two are the only readings on this board
 * that identify a move as forced rather than intended, which is what makes them
 * worth the buffer they cost — a forced move is the one that tends to snap back.
 */
export type SqueezeRead =
  'longs-building' | 'short-squeeze' | 'shorts-building' | 'long-liquidation'

const SQUEEZE_DESCRIPTIONS: Record<SqueezeRead, string> = {
  'longs-building': 'new longs paying up',
  'short-squeeze': 'shorts squeezed out of the move',
  'shorts-building': 'new shorts pressing it down',
  'long-liquidation': 'longs liquidated into the fall',
}

/**
 * The window is short enough that the floors from the session read would reject
 * everything: open interest rarely moves half a percent in five minutes even
 * when it is moving hard. The price side has no floor here at all, because the
 * only caller has already established that the move is unusual for this
 * instrument and a second, absolute opinion about it would overrule that.
 *
 * Exported because the detector that decides whether a five-minute open
 * interest move is unusual has to hold it to the same floor this does. Two
 * numbers that must agree, kept as one.
 */
export const MIN_SHORT_OI_PERCENT = 0.15

export function squeezeRead(
  pricePercent: number,
  oiPercent: number,
): SqueezeRead | null {
  if (!Number.isFinite(pricePercent) || !Number.isFinite(oiPercent)) return null
  if (Math.abs(oiPercent) < MIN_SHORT_OI_PERCENT) return null

  if (pricePercent > 0) {
    return oiPercent > 0 ? 'longs-building' : 'short-squeeze'
  }
  return oiPercent > 0 ? 'shorts-building' : 'long-liquidation'
}

export function describeSqueeze(read: SqueezeRead) {
  return SQUEEZE_DESCRIPTIONS[read]
}

/** Whether the quadrant is one of the two where the exit was not voluntary. */
export function isForcedExit(read: SqueezeRead) {
  return read === 'short-squeeze' || read === 'long-liquidation'
}
