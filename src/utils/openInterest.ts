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
  | 'longs-building'
  | 'shorts-covering'
  | 'shorts-building'
  | 'longs-closing'

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
