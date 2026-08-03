import type { Messages } from '../i18n/en'

/**
 * The routes that own a nav entry, so a selected tab cannot drift from them.
 * The desktop tabs and the mobile drawer read the same list: two would let the
 * phone and the desktop disagree about which pages exist.
 *
 * Each carries the key to its name rather than the name itself. A module-level
 * constant is built once, before any language is known, so holding the string
 * here would pin the menu to whichever language the app was bundled in.
 */
export const NAV_ITEMS: { key: keyof Messages['nav']; path: string }[] = [
  { key: 'okx', path: '/' },
  { key: 'binance', path: '/binance' },
  { key: 'charts', path: '/charts' },
]
