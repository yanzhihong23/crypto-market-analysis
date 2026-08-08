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
  | 'divergence'
  | 'ma-pair'
  | 'rsi-pair'
  | 'bollinger-pair'

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

export type CompareTable = {
  title: string
  headers: string[]
  rows: string[][]
}

export type MisreadItem = {
  id: string
  title: string
  okLabel: string
  badLabel: string
  okCaption: string
  badCaption: string
  diagram: Extract<DiagramId, 'ma-pair' | 'rsi-pair' | 'bollinger-pair'>
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
  /** Suggested order before opening every card. */
  path: {
    id: string
    label: string
    title: string
    intro: string
    steps: { title: string; body: string }[]
    toolboxTitle: string
    toolboxItems: string[]
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
  /** Same-family picks so learners stop double-counting. */
  compare: {
    id: string
    label: string
    title: string
    intro: string
    tables: CompareTable[]
  }
  /** Cross-cutting idea taught once, not ten times. */
  divergence: {
    id: string
    label: string
    title: string
    intro: string
    howTitle: string
    how: SignalLine[]
    kindsTitle: string
    kinds: { title: string; body: string }[]
    rulesTitle: string
    rules: string[]
    noteTitle: string
    noteItems: string[]
    diagram: Extract<DiagramId, 'divergence'>
  }
  /** Side-by-side schematics: the read that pays vs the habit that costs. */
  misreads: {
    id: string
    label: string
    title: string
    intro: string
    items: MisreadItem[]
  }
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
  /** App navigation to the recipes/risk page — not a new indicator. */
  related: {
    label: string
    href: string
    text: string
    cta: string
  }
  closing: {
    label: string
    oneLiner: string
    chips: string[]
    disclaimer: string
  }
}
