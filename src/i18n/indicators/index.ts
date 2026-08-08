import type { Locale } from '../locale'

import { indicatorsEn } from './en'
import { indicatorsZh } from './zh'
import type { IndicatorsContent } from './types'

export type {
  IndicatorsContent,
  Category,
  Indicator,
  DiagramId,
  SignalLine,
  MisreadItem,
  CompareTable,
} from './types'

/**
 * Kept out of `Messages` on purpose — several pages of prose that only one
 * route reads, so it rides in that lazy chunk instead of the entry.
 */
export const INDICATORS: Record<Locale, IndicatorsContent> = {
  en: indicatorsEn,
  zh: indicatorsZh,
}
