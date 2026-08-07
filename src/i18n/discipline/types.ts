/**
 * The shape of the discipline page, kept apart from the words that fill it.
 *
 * The page used to be a thousand lines of JSX with the prose inlined, which
 * made it the one screen in the app that could not be translated and left the
 * markdown copy under `docs/` to drift on its own. Both now read from the same
 * dictionaries: the page renders these blocks, and `scripts/discipline-docs.ts`
 * prints them.
 *
 * Only the block kinds actually in use are here. A new kind means teaching the
 * renderer and the printer about it together, which is the point — neither can
 * quietly fall behind the other.
 */

export type Block =
  /** A line of prose introducing whatever follows it. */
  | { kind: 'paragraph'; text: string }
  /** Numbered cards. The step is the ordinal, printed as a heading level down. */
  | { kind: 'steps'; items: { title: string; body: string }[] }
  /** The workhorse. First column is the subject and is emphasised. */
  | { kind: 'table'; headers: string[]; rows: string[][] }
  /** A named table nested under a heading of its own. */
  | { kind: 'subTable'; title: string; headers: string[]; rows: string[][] }
  /** Cards whose lines are labelled — 条件 / 入场 / 失效 and so on. */
  | { kind: 'recipes'; items: { title: string; lines: Line[] }[] }
  /** Cards holding a plain list. */
  | { kind: 'rules'; items: { title: string; items: string[] }[] }
  /** Set apart from the run of the section, as an aside rather than a warning. */
  | { kind: 'note'; title: string; items: string[] }
  /**
   * A list you tick off before entering. Ticks are remembered until reset, and
   * are stored against the item's `id` rather than its position or its words,
   * so neither editing the list nor switching language moves a tick onto a
   * question it was never given for.
   */
  | { kind: 'checklist'; items: ({ id: string } & Line)[] }
  /**
   * The position sizer. The page renders the calculator; the markdown prints
   * the arithmetic it does, since a file cannot do it for you.
   */
  | { kind: 'sizer' }

export type Line = { label: string; text: string }

export type Section = {
  /** The anchor, and the key the table of contents scrolls by. */
  id: string
  /** How the section is named in the table of contents — short. */
  label: string
  /** How it is named on the page — long enough to say what it covers. */
  title: string
  /** Draw a rule above this one: it opens a new movement of the page. */
  rule?: boolean
  blocks: Block[]
}

export type DisciplineContent = {
  title: string
  lede: string
  tocLabel: string
  /**
   * What goes between a recipe line's label and its text. Stored with the
   * words rather than in the renderer because the punctuation is part of the
   * language: a full-width colon closes up against the label, an ASCII one
   * takes a space after it.
   */
  labelJoin: string
  /** The four figures across the top. */
  stats: { value: string; label: string }[]
  /** The one thing to take away if nothing else is read. */
  principle: string
  sections: Section[]
  /** Words for the checklist's own controls, which are not part of the list. */
  checklist: {
    reset: string
    progress: (done: number, total: number) => string
  }
  /**
   * The sizer's labels. Held here rather than in the block so the block stays
   * a marker — there is only ever one calculator, and it is the same one in
   * both languages.
   */
  sizer: {
    title: string
    intro: string
    equity: string
    risk: string
    entry: string
    stop: string
    riskAmount: string
    stopDistance: string
    size: string
    notional: string
    leverage: string
    /** Shown instead of the numbers when the inputs cannot produce any. */
    incomplete: string
    /** Printed into the markdown, where there is nothing to type into. */
    formula: string
    note: string
  }
  closing: {
    label: string
    oneLiner: string
    chips: string[]
    disclaimer: string
  }
  /** For the generated markdown only — the page is the recommended reading. */
  docs: {
    preferPage: string
    tocHeading: string
    principleHeading: string
    statHeaders: [string, string]
    backLink: string
  }
}
