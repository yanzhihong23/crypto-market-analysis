import { OkxKline, OpenTime } from '../types/okx'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Where the session the board is measuring against started, in epoch ms.
 *
 * The card's percent comes from the ticker's own `sodUtc0` / `sodUtc8` /
 * `open24h`, so anything else measured "over the session" — the sparkline, the
 * open interest change — has to start from the same instant or the two readings
 * describe different windows.
 */
export function sessionStartMs(openTime: OpenTime, now = Date.now()) {
  if (openTime === OpenTime.OPEN24H) return now - DAY_MS

  const date = new Date(now)
  // UTC+8's day opens at 16:00 the previous UTC day.
  const hour = openTime === OpenTime.UTC8 ? 16 : 0
  const boundary = new Date(date).setUTCHours(hour, 0, 0, 0)

  // Before today's boundary the session in progress is the one that opened a
  // day earlier, which only ever happens for UTC+8.
  return boundary <= now ? boundary : boundary - DAY_MS
}

/**
 * The bars belonging to the session in progress, off a series that is not cut
 * to one.
 *
 * The candles are fetched uncut and sliced here rather than the other way
 * round, because the two things that read them want opposite windows. The
 * sparkline and the volume figure are about the session, and have to be — they
 * sit next to a percent taken from the ticker's own `sodUtc0`/`sodUtc8`. The
 * statistics behind `volume`, `volatility` and `rejection` are about this
 * instrument's own spread, which has nothing to do with where a day is
 * considered to begin: cutting them to the session left them with fewer than
 * the twenty closed bars a baseline needs for the first five hours of every one
 * of them, so all three went silent daily across the whole board.
 *
 * Bars arrive newest first and are returned in that order.
 */
export function sessionKlines(klines: OkxKline[], openTime: OpenTime) {
  const start = sessionStartMs(openTime)
  return klines.filter((kline) => Number(kline[0]) >= start)
}
