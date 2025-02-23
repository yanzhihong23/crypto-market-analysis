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
 * @param val - The number to format.
 * @returns The formatted number.
 */
export function compactNumberFormatter(
  val: number,
  minimumFractionDigits?: number,
) {
  return new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits,
  }).format(val)
}
