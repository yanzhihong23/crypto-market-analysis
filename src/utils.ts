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

export function compactNumberFormatter(val: number) {
  return new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 1
  }).format(val)
}
