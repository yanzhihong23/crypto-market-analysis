/**
 * Which languages exist, and which one to use before anybody has said.
 *
 * Kept apart from the dictionaries so the store that remembers a choice can
 * name the type without pulling every string in the app in behind it.
 */
export type Locale = 'en' | 'zh'

export const LOCALES: Locale[] = ['en', 'zh']

/** The other one, which is the only place a two-language toggle can go. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh' : 'en'
}

/**
 * What the browser was already asking for. Read in preference order rather than
 * off `navigator.language` alone: someone whose first choice is a language this
 * app does not have still usually lists one it does underneath it.
 *
 * Any Chinese tag counts, simplified or not. A board of numbers and ticker
 * symbols does not have enough prose in it to be worth splitting hant from
 * hans, and serving a zh-TW reader English would be the worse of the two.
 */
export function browserLocale(): Locale {
  const tags = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]

  for (const tag of tags) {
    if (/^zh\b/i.test(tag)) return 'zh'
    if (/^en\b/i.test(tag)) return 'en'
  }
  return 'en'
}

/**
 * The tag that goes on `<html lang>`, which is what a screen reader picks a
 * voice from and what the browser hyphenates by.
 */
export function htmlLang(locale: Locale) {
  return locale === 'zh' ? 'zh-CN' : 'en'
}

/**
 * The locale the compact number formatter is asked for, which is the only
 * number on the board whose shape is a language question: English groups by
 * thousands and Chinese by ten thousands, so one board reads `4.1B` where the
 * other reads `41亿` — the scale a Chinese-language exchange quotes in.
 *
 * `en-GB` on the English side because that is the tag this board was already
 * passing, and a language switch should not restyle the language that was
 * already there. Current CLDR gives it the same abbreviations as `en-US`;
 * older data lowercases them (`4.1bn`), which is a difference this keeps on
 * whichever side of it the reader was already seeing.
 *
 * Plain notation needs no equivalent. Both locales group in threes and both
 * point the decimal, so `formatNumber` is the same function in either language.
 */
export function compactLocale(locale: Locale) {
  return locale === 'zh' ? 'zh-CN' : 'en-GB'
}
