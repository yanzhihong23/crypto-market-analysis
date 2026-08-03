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
