/**
 * Funding is charged at a settlement, not continuously. A position closed
 * before one pays nothing whatever the rate says, so how long is left is part
 * of reading the number.
 */

/**
 * Inside this, the settlement is close enough that holding through it is a
 * decision being made now rather than later, and the countdown earns a place on
 * the card. Outside it, it stays in the chip's tooltip.
 */
const IMMINENT_MS = 1000 * 60 * 5

const MINUTE_MS = 1000 * 60

export function msUntilFunding(fundingTime?: string) {
  const at = Number(fundingTime)
  if (!Number.isFinite(at) || at <= 0) return null
  const remaining = at - Date.now()
  // A settlement in the past means the feed has not sent the next one yet.
  return remaining > 0 ? remaining : null
}

export function isImminent(remaining: number | null) {
  return remaining !== null && remaining <= IMMINENT_MS
}

/** `2h13m` or `12m`, rounded up so it never reads 0m before it has settled. */
export function formatCountdown(remaining: number) {
  // Split after rounding, or the last half-minute of an hour reads "60m".
  const minutes = Math.ceil(remaining / MINUTE_MS)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h${minutes % 60}m`
}
