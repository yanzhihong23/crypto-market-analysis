/**
 * Shape of the technical-indicators page. Kept out of `Messages` so the long
 * copy only rides in the lazy chunk that renders it.
 *
 * `diagram` is an id the page maps to an SVG — the words never embed markup,
 * and adding a new diagram means teaching both sides together.
 */

export type DiagramId =
  | 'ma'
  | 'macd'
  | 'adx'
  | 'rsi'
  | 'stochastic'
  | 'bollinger'
  | 'atr'
  | 'volume'
  | 'vwap'
  | 'fibonacci'

export type SignalLine = { label: string; text: string }

export type Indicator = {
  id: string
  name: string
  /** Short chip under the name — usually the role inside its category. */
  tag: string
  principle: string
  /** One formula, or a short list when several pieces matter. */
  formula: string[]
  /** Typical defaults, not prescriptions. */
  params: string
  /**
   * Concrete chart readings: what you see on the pane, and what to do with it.
   * Kept as labelled lines so a scan can stop at the labels.
   */
  signals: SignalLine[]
  /** When this tool is on vs when to mute it. */
  regime: string
  usage: string[]
  pitfalls: string[]
  diagram: DiagramId
}

export type Category = {
  id: string
  label: string
  title: string
  intro: string
  indicators: Indicator[]
}

export type IndicatorsContent = {
  title: string
  lede: string
  tocLabel: string
  /**
   * Between a signal label and its text. Stored with the words because the
   * punctuation is part of the language (full-width vs ASCII colon).
   */
  labelJoin: string
  stats: { value: string; label: string }[]
  principle: string
  /** Section labels used by the field headings on each card. */
  fields: {
    principle: string
    formula: string
    params: string
    signals: string
    regime: string
    usage: string
    pitfalls: string
  }
  overview: {
    id: string
    label: string
    title: string
    intro: string
    headers: string[]
    rows: string[][]
  }
  categories: Category[]
  combine: {
    id: string
    label: string
    title: string
    intro: string
    headers: string[]
    rows: string[][]
    noteTitle: string
    noteItems: string[]
  }
  closing: {
    label: string
    oneLiner: string
    chips: string[]
    disclaimer: string
  }
}
