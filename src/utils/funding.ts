/**
 * Funding is charged at a settlement, not continuously. A position closed
 * before one pays nothing whatever the rate says, so how long is left is part
 * of reading the number.
 */

import type { Messages } from '../i18n/en'

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
export function formatCountdown(remaining: number, t: Messages) {
  // Split after rounding, or the last half-minute of an hour reads "60m".
  const minutes = Math.ceil(remaining / MINUTE_MS)
  if (minutes < 60) return t.funding.countdownMinutes(minutes)
  return t.funding.countdownHours(Math.floor(minutes / 60), minutes % 60)
}

const WEEK_MS = 1000 * 60 * 60 * 24 * 7

/**
 * How much of the week the settlements have to span before their sum is a week's
 * worth of carry. Instruments settle every eight hours on most of the board and
 * every four on some, so counting them would need to know which; how far back the
 * oldest one reaches does not.
 *
 * Six days rather than seven because the newest settlement is up to a schedule
 * behind the clock, and a window that had to be exactly seven days long would
 * refuse to report for a third of every cycle.
 */
const MIN_CARRY_SPAN_MS = 1000 * 60 * 60 * 24 * 6

/**
 * What a long has paid to hold this contract for a week, in the unit the card
 * shows the rate in.
 *
 * The level and the shift already on the board both describe one settlement: the
 * rate now, and how far it moved since it was last charged. Neither says what
 * the position actually cost, which is the sum — a rate that has sat quietly at
 * a level nobody would flag still empties a long out over twenty-one
 * settlements, and that accumulation is the whole of what makes a trade crowded.
 *
 * Signed: positive is longs paying shorts, which is the direction that says the
 * crowd is long.
 */
export function fundingCarryOf(
  rows?: Array<{
    fundingTime: string
    fundingRate: string
    realizedRate: string
  }>,
  now = Date.now(),
) {
  const week = (rows ?? []).filter((row) => {
    const at = Number(row.fundingTime)
    return Number.isFinite(at) && at >= now - WEEK_MS && at <= now
  })
  if (!week.length) return null

  const oldest = Math.min(...week.map((row) => Number(row.fundingTime)))
  if (now - oldest < MIN_CARRY_SPAN_MS) return null

  return week.reduce(
    (sum, row) => sum + Number(row.realizedRate || row.fundingRate) * 10000,
    0,
  )
}
