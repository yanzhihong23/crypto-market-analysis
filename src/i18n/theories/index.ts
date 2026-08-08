import type { Locale } from '../locale'

import { theoriesEn } from './en'
import { theoriesZh } from './zh'
import type { TheoriesContent } from './types'

export type {
  TheoriesContent,
  Theory,
  TheorySection,
  TheoryDiagramId,
  Line,
  CompareTable,
} from './types'

/**
 * Kept out of `Messages` on purpose — several pages of prose that only one
 * route reads, so it rides in that lazy chunk instead of the entry.
 */
export const THEORIES: Record<Locale, TheoriesContent> = {
  en: theoriesEn,
  zh: theoriesZh,
}
