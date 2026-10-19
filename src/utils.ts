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
 * Formatters built once per set of options and reused.
 *
 * Constructing one is the expensive half of formatting — it is where the locale
 * data is resolved and the native ICU formatter is allocated — and the two
 * functions below are on the feed's hot path: every ticker message went through
 * both, so the board built well over a hundred formatters a second, around the
 * clock, whether or not anything was on screen. JavaScriptCore sees only the
 * small wrapper each one sits behind, not the native memory it holds, so a page
 * doing this is collected as if it were cheap long after it has stopped being.
 * That is a footprint Safari reloads a tab for, and it grows fastest exactly
 * when a sleeping or hidden page is collected least.
 *
 * Keyed by the options that vary, which take a handful of values in practice.
 */
const formatters = new Map<string, Intl.NumberFormat>()

const formatterOf = (
  key: string,
  locale: string,
  options: Intl.NumberFormatOptions,
) => {
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options)
    formatters.set(key, formatter)
  }
  return formatter
}

/**
 * Formats a number to a more readable format.
 * @param num - The number to format.
 * @returns The formatted number.
 */
export function formatNumber(num: number, digits?: number) {
  const maximumFractionDigits = digits ?? 2
  return formatterOf(`standard:${maximumFractionDigits}`, 'en-US', {
    notation: 'standard',
    maximumFractionDigits,
  }).format(num)
}

/**
 * Formats a number to a compact format.
 *
 * Stays English on a Chinese board, which is the one deliberate exception to the
 * translation: Chinese groups by ten thousands, so `4.2b` reads `42亿` there, and
 * the wider label wraps a card's four chips onto a second line. The row fits on
 * one only because these abbreviations are this short.
 *
 * @param val - The number to format.
 * @returns The formatted number.
 */
export function compactNumberFormatter(
  val: number,
  minimumFractionDigits?: number,
) {
  return formatterOf(`compact:${minimumFractionDigits}`, 'en-GB', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits,
  }).format(val)
}
