/**
 * Spot marketing logos use different symbols than USDT-M futures for some
 * markets. TradFi / bStocks spot pairs insert a `B` before the quote
 * (`SPCXBUSDT` spot ↔ `SPCXUSDT` futures). Leveraged meme contracts may only
 * have a logo under the unscaled base (`1000PEPEUSDT` → `PEPEUSDT`).
 *
 * Callers should try candidates in order (exact first) via img onError.
 */

const USDT = 'USDT'
const MULTIPLIER_PREFIXES = ['1000000', '1000'] as const

function withBusdtVariant(symbol: string): string[] {
  if (!symbol.endsWith(USDT)) return [symbol]
  const base = symbol.slice(0, -USDT.length)
  // Skip base length 1 so futures BUSDT does not map to BBUSDT.
  if (base.length < 2) return [symbol]
  return [symbol, `${base}B${USDT}`]
}

function dedupe(symbols: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of symbols) {
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

/** Ordered logo filename stems (without `.png`) for a futures symbol. */
export function binanceLogoCandidates(symbol: string): string[] {
  const upper = symbol.toUpperCase()
  const candidates = [...withBusdtVariant(upper)]

  // Longest prefix only — otherwise 1000000MOG also yields 000MOG via 1000.
  for (const prefix of MULTIPLIER_PREFIXES) {
    if (!upper.startsWith(prefix)) continue
    const rest = upper.slice(prefix.length)
    if (rest) candidates.push(...withBusdtVariant(rest))
    break
  }

  return dedupe(candidates)
}

export function binanceLogoUrl(symbol: string): string {
  return `/logos/${binanceLogoCandidates(symbol)[0]}.png`
}
