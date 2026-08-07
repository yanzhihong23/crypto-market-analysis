import type { Locale } from '../locale'

import { disciplineEn } from './en'
import { disciplineZh } from './zh'
import type { DisciplineContent } from './types'

export type { DisciplineContent, Section, Block, Line } from './types'

/**
 * Kept out of `Messages` on purpose. That dictionary is loaded by every screen
 * in the app, and this is several pages of prose that only one route reads —
 * imported from the lazy page, it rides in that chunk instead of the entry.
 */
export const DISCIPLINE: Record<Locale, DisciplineContent> = {
  en: disciplineEn,
  zh: disciplineZh,
}
