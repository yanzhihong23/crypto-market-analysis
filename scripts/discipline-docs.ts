/**
 * Prints `docs/trading-discipline*.md` from the dictionaries the page renders.
 *
 * The markdown copy used to be maintained by hand next to the page, and the
 * two had already drifted in both directions — the file carried reasoning the
 * page had dropped, the page carried lines the file never got. There is one
 * copy of the words now and this prints the other view of them.
 *
 *   node scripts/discipline-docs.ts
 *
 * Run through Node's own type stripping, so keep this file and everything it
 * imports to erasable syntax.
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { disciplineEn } from '../src/i18n/discipline/en.ts'
import { disciplineZh } from '../src/i18n/discipline/zh.ts'
import type {
  Block,
  DisciplineContent,
  Section,
} from '../src/i18n/discipline/types.ts'

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs')

/**
 * The anchor GitHub will give a heading: lowercased, punctuation dropped,
 * whitespace hyphenated. CJK survives it, which is why "K 线与结构技巧"
 * addresses as `#k-线与结构技巧`.
 */
function slug(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
}

function table(headers: string[], rows: string[][]) {
  const cell = (text: string) => text.replace(/\|/g, '\\|')
  const line = (cells: string[]) => `| ${cells.map(cell).join(' | ')} |`
  return [
    line(headers),
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(line),
  ].join('\n')
}

function block(b: Block, content: DisciplineContent): string {
  switch (b.kind) {
    case 'paragraph':
      return b.text

    case 'steps':
      return b.items
        .map((item, i) => `### ${i + 1}. ${item.title}\n\n${item.body}`)
        .join('\n\n')

    case 'table':
      return table(b.headers, b.rows)

    case 'subTable':
      return `### ${b.title}\n\n${table(b.headers, b.rows)}`

    case 'recipes':
      return b.items
        .map((item) => {
          const lines = item.lines
            .map((l) => `- **${l.label}**${content.labelJoin}${l.text}`)
            .join('\n')
          return `### ${item.title}\n\n${lines}`
        })
        .join('\n\n')

    case 'rules':
      return b.items
        .map(
          (item) =>
            `### ${item.title}\n\n${item.items.map((i) => `- ${i}`).join('\n')}`,
        )
        .join('\n\n')

    case 'note':
      return `### ${b.title}\n\n${b.items.map((i) => `- ${i}`).join('\n')}`

    case 'checklist':
      return b.items
        .map((i) => `- [ ] **${i.label}**${content.labelJoin}${i.text}`)
        .join('\n')

    // The page has the calculator; a file can only show the arithmetic.
    case 'sizer': {
      const { sizer } = content
      return `### ${sizer.title}\n\n${sizer.intro}\n\n\`\`\`\n${sizer.formula}\n\`\`\`\n\n${sizer.note}`
    }
  }
}

function section(s: Section, content: DisciplineContent) {
  return [`## ${s.title}`, ...s.blocks.map((b) => block(b, content))].join(
    '\n\n',
  )
}

function render(content: DisciplineContent) {
  const { docs, closing } = content

  const toc = content.sections
    .map((s) => `- [${s.label}](#${slug(s.title)})`)
    .join('\n')

  return (
    [
      `# ${content.title}`,
      content.lede,
      docs.preferPage,
      docs.backLink,
      `## ${docs.tocHeading}`,
      `- [${docs.principleHeading}](#${slug(docs.principleHeading)})\n${toc}`,
      `## ${docs.principleHeading}`,
      table(
        docs.statHeaders,
        content.stats.map((s) => [s.label, s.value]),
      ),
      `> ${content.principle}`,
      ...content.sections.map((s) => section(s, content)),
      `## ${closing.label}`,
      `> ${closing.oneLiner}`,
      closing.chips.join(' · '),
      content.related
        ? `**${content.related.label}:** ${content.related.text} → [\`${content.related.href}\`](${content.related.href})`
        : null,
      '---',
      closing.disclaimer,
    ]
      .filter((line): line is string => line != null)
      .join('\n\n') + '\n'
  )
}

for (const [file, content] of [
  ['trading-discipline.md', disciplineEn],
  ['trading-discipline.zh.md', disciplineZh],
] as const) {
  const path = join(DOCS, file)
  writeFileSync(path, render(content))
  console.log(`wrote ${path}`)
}
