/**
 * The routes that own a nav entry, so a selected tab cannot drift from them.
 * The desktop tabs and the mobile drawer read the same list: two would let the
 * phone and the desktop disagree about which pages exist.
 */
export const NAV_ITEMS = [
  { label: 'OKX', path: '/' },
  { label: 'Binance', path: '/binance' },
  { label: 'Charts', path: '/charts' },
]
