/**
 * OKX serves one icon per base currency, so the instId has to be reduced to its
 * first segment. Shared with the picker so a symbol looks the same before it is
 * on the watchlist as it does on the card afterwards.
 */
export function okxLogoUrl(instId: string) {
  const symbol = instId.split('-')[0].toLowerCase()
  return `https://static.okx.com/cdn/oksupport/asset/currency/icon/${symbol}.png?x-oss-process=image/format,webp`
}

export function getPeriodPattern(period: string) {
  switch (period) {
    case '5m':
    case '15m':
      return 'HH:mm'
    case '1d':
      return 'MM-dd'
    default:
      return 'MM-dd HH:mm'
  }
}

/**
 * Formats a number to a more readable format.
 *
 * Not language-dependent, unlike the compact formatter below: both languages
 * this board speaks group in threes and point the decimal, so plain notation
 * comes out the same either way and a locale here would be one to keep in step
 * for nothing.
 *
 * @param num - The number to format.
 * @returns The formatted number.
 */
export function formatNumber(num: number, digits?: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'standard',
    maximumFractionDigits: digits ?? 2,
  }).format(num)
}

/**
 * Formats a number to a compact format.
 *
 * The locale is a required argument rather than a default, because a default
 * would silently print English on a Chinese board. Callers get it bound to the
 * active language from `useCompactNumber`.
 *
 * @param val - The number to format.
 * @param locale - A BCP 47 tag, from `compactLocale`.
 * @returns The formatted number.
 */
export function compactNumberFormatter(
  val: number,
  locale: string,
  minimumFractionDigits?: number,
) {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits,
  }).format(val)
}
