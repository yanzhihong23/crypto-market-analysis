import { enUS, zhCN } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'

import { useLocaleStore } from '../store/useLocaleStore'

import { en, Messages } from './en'
import { zh } from './zh'
import { Locale, browserLocale } from './locale'

export type { Messages } from './en'

const MESSAGES: Record<Locale, Messages> = { en, zh }

const DATE_LOCALES: Record<Locale, DateFnsLocale> = { en: enUS, zh: zhCN }

/**
 * The language in force: an explicit choice if one has been made, and whatever
 * the browser asks for until then.
 *
 * There are two ways in because there are two kinds of caller. A component
 * subscribes, so that switching language redraws it. The alert pass is not a
 * render — it walks the board on a timer and writes the sentences it finds into
 * a stored entry — so it reads the current value once, at the moment it fires,
 * and an alert keeps the words it was written in.
 */
export function currentLocale(): Locale {
  return useLocaleStore.getState().preference ?? browserLocale()
}

export function currentMessages(): Messages {
  return MESSAGES[currentLocale()]
}

export function useLocale(): Locale {
  const preference = useLocaleStore((state) => state.preference)
  return preference ?? browserLocale()
}

export function useMessages(): Messages {
  const locale = useLocale()
  return MESSAGES[locale]
}

export function useSetLocale() {
  return useLocaleStore((state) => state.setPreference)
}

/** For the relative times in the alert list, which date-fns writes itself. */
export function useDateLocale(): DateFnsLocale {
  const locale = useLocale()
  return DATE_LOCALES[locale]
}
