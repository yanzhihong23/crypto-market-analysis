/**
 * Positioning signals. Both say the same thing from different sides — the
 * crowd is short — which is why a card carrying both is worth more than a card
 * carrying one, and why they are flagged rather than left in the metric row.
 *
 * Every feed here delivers strings, and an absent metric is an empty string or
 * undefined rather than a number, so `Number('')` being 0 would otherwise read
 * as a ratio below 1 on every card that has no ratio yet.
 */
function toNumber(value?: string) {
  if (value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** More short accounts than long ones. */
export function isCrowdedShort(ratio?: string) {
  const parsed = toNumber(ratio)
  return parsed !== null && parsed < 1
}

/** Shorts are paying longs to keep the position open. */
export function isFundingNegative(fundingRate?: string) {
  const parsed = toNumber(fundingRate)
  return parsed !== null && parsed < 0
}
