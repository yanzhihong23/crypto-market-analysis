/**
 * Shape of the technical-analysis theories page. Kept out of `Messages` so the
 * long copy only rides in the lazy chunk that renders it.
 *
 * Each theory is a short article: several sections, each optionally paired with
 * a schematic. `diagram` ids map to SVGs — words never embed markup, and a new
 * diagram means teaching both sides together.
 */

export type TheoryDiagramId =
  // Dow
  | 'dow-degrees'
  | 'dow-phases'
  | 'dow-confirm'
  // Volume-price
  | 'vp-quadrants'
  | 'vp-breakout'
  | 'vp-divergence'
  // Elliott
  | 'elliott-impulse'
  | 'elliott-correction'
  | 'elliott-fib'
  // Wyckoff
  | 'wyckoff-cycle'
  | 'wyckoff-accum'
  | 'wyckoff-distrib'
  | 'wyckoff-spring'
  // Structure
  | 'structure-trend'
  | 'structure-choch'
  | 'structure-value'
  // Candlesticks
  | 'candle-reversal'
  | 'candle-continuation'
  | 'candle-location'

export type Line = { label: string; text: string }

/** One beat of a theory article: prose, optional labelled list, optional figure. */
export type TheorySection = {
  title: string
  /** One or more paragraphs. */
  body: string[]
  /** Optional labelled bullets under the prose. */
  points?: Line[]
  diagram?: TheoryDiagramId
  /** Short line under the diagram. */
  caption?: string
}

export type Theory = {
  id: string
  name: string
  /** Short chip under the name — usually the school's role. */
  tag: string
  /** Opening paragraph under the heading. */
  lede: string
  sections: TheorySection[]
  /** Concrete checklist to take to the chart. */
  playbook: {
    title: string
    steps: Line[]
  }
  pitfalls: string[]
  /** Closing one-liner for this school. */
  summary: string
}

export type CompareTable = {
  title: string
  headers: string[]
  rows: string[][]
}

export type TheoriesContent = {
  title: string
  lede: string
  tocLabel: string
  /**
   * Between a labelled line and its text. Stored with the words because the
   * punctuation is part of the language (full-width vs ASCII colon).
   */
  labelJoin: string
  stats: { value: string; label: string }[]
  principle: string
  fields: {
    pitfalls: string
  }
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
  theories: Theory[]
  compare: {
    id: string
    label: string
    title: string
    intro: string
    tables: CompareTable[]
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
