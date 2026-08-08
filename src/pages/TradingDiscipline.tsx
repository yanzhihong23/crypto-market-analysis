import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { useLocalStorage } from 'usehooks-ts'

import { useLocale } from '../i18n'
import {
  DISCIPLINE,
  type Block,
  type DisciplineContent,
  type Section,
} from '../i18n/discipline'

/**
 * The app bar is fixed at 64. Below `md` the section chips sit under it and
 * take another 44, so an anchored heading has to clear both or it arrives
 * behind them. The scroll spy reads the same number, which is what keeps the
 * highlighted entry and the heading you actually landed on in agreement.
 */
const HEADER_OFFSET = { xs: 64 + 44 + 12, md: 64 + 24 }

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, bgcolor: 'surface.subtle', borderColor: 'surface.border' }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Paper>
  )
}

function Card({
  title,
  trailing,
  children,
}: {
  title: string
  trailing?: string
  children: React.ReactNode
}) {
  return (
    // No `height: 100%` here. A grid item already stretches to its row, so it
    // bought nothing — and it is a percentage resolved against a row whose
    // height is decided by this very card. Blink shrugs that off; WebKit
    // resolved it against something further up, inflated every card to about
    // three times its content, and left the section's own height measured
    // from before the inflation, so the next heading drew on top of it. On an
    // iPad the whole page came apart from this one line.
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'surface.border' }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.25,
        }}
      >
        <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
        {trailing ? (
          <Chip
            size="small"
            label={trailing}
            sx={{ bgcolor: 'surface.subtle', flexShrink: 0 }}
          />
        ) : null}
      </Stack>
      {children}
    </Paper>
  )
}

function CardGrid({
  columns,
  children,
}: {
  columns: 2 | 3
  children: React.ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns:
          columns === 2
            ? { xs: '1fr', sm: 'repeat(2, 1fr)' }
            : { xs: '1fr', md: 'repeat(3, 1fr)' },
      }}
    >
      {children}
    </Box>
  )
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderColor: 'surface.border' }}
    >
      {/* Three and four column tables squeezed into a phone break every cell
          down to two or three characters a line. Give them a floor and let the
          container scroll sideways instead. The floor stays under the content
          column on a desktop, so nothing scrolls there. */}
      <Table
        size="small"
        sx={{ minWidth: headers.length >= 3 ? 160 * headers.length + 160 : 0 }}
      >
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell
                key={h}
                sx={{ fontWeight: 600, bgcolor: 'surface.subtle' }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell
                  key={j}
                  sx={{
                    color: j === 0 ? 'text.primary' : 'text.secondary',
                    fontWeight: j === 0 ? 500 : 400,
                    verticalAlign: 'top',
                    // The cap keeps the subject column from eating the row.
                    // The floor is what stops WebKit reading the cap as
                    // licence to collapse the column to min-content — which,
                    // for text that breaks between any two characters, is one
                    // character per line. On an iPad the subject column came
                    // out as a vertical strip.
                    minWidth: j === 0 ? 88 : undefined,
                    maxWidth: j === 0 ? 220 : undefined,
                  }}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <Stack sx={{ gap: 1 }}>
      {items.map((item) => (
        <Typography key={item} variant="body2" color="text.secondary">
          {item}
        </Typography>
      ))}
    </Stack>
  )
}

/**
 * The list is for working through, not reading, so the ticks are kept: you can
 * start it, go back to the chart, and pick up where you were. Clearing is
 * manual — a checklist that empties itself is one you stop trusting.
 */
function Checklist({
  items,
  content,
}: {
  items: ({ id: string } & { label: string; text: string })[]
  content: DisciplineContent
}) {
  const [checked, setChecked] = useLocalStorage<Record<string, boolean>>(
    'discipline-checklist',
    {},
  )
  const done = items.filter((item) => checked[item.id]).length

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'surface.border' }}>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          {content.checklist.progress(done, items.length)}
        </Typography>
        <Button
          size="small"
          onClick={() => setChecked({})}
          disabled={done === 0}
        >
          {content.checklist.reset}
        </Button>
      </Stack>

      <Stack sx={{ gap: 0.5 }}>
        {items.map((item) => (
          <FormControlLabel
            key={item.id}
            control={
              <Checkbox
                size="small"
                checked={checked[item.id] ?? false}
                onChange={(e) =>
                  setChecked((prev) => ({
                    ...prev,
                    [item.id]: e.target.checked,
                  }))
                }
              />
            }
            sx={{ alignItems: 'flex-start', ml: 0, gap: 1 }}
            label={
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 0.75 }}
              >
                <Box
                  component="span"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 500,
                    textDecoration: checked[item.id] ? 'line-through' : 'none',
                  }}
                >
                  {item.label}
                  {content.labelJoin}
                </Box>
                {item.text}
              </Typography>
            }
          />
        ))}
      </Stack>
    </Paper>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  )
}

/**
 * The page says four times over to size back from the stop rather than picking
 * a position and fitting a stop around it, and then gave you nowhere to do it.
 * Arithmetic only: no quote is fetched and nothing is stored.
 */
function Sizer({ content }: { content: DisciplineContent }) {
  const t = content.sizer
  const [equity, setEquity] = useState('')
  const [risk, setRisk] = useState('1')
  const [entry, setEntry] = useState('')
  const [stop, setStop] = useState('')

  const result = useMemo(() => {
    const e = Number(equity)
    const r = Number(risk)
    const inPrice = Number(entry)
    const stopPrice = Number(stop)
    const distance = Math.abs(inPrice - stopPrice)

    if (!(e > 0 && r > 0 && inPrice > 0 && stopPrice > 0 && distance > 0)) {
      return null
    }

    const amount = (e * r) / 100
    const size = amount / distance
    const notional = size * inPrice

    return {
      amount,
      distance,
      distancePercent: (distance / inPrice) * 100,
      size,
      notional,
      leverage: notional / e,
    }
  }, [equity, risk, entry, stop])

  // Four to six significant digits covers an account balance and a DOGE tick
  // without printing either as exponential.
  const num = (value: number, digits = 2) =>
    value.toLocaleString(undefined, {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    })

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <TextField
      size="small"
      type="number"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{ htmlInput: { inputMode: 'decimal', min: 0 } }}
    />
  )

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'surface.border' }}>
      <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{t.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t.intro}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
        }}
      >
        {field(t.equity, equity, setEquity)}
        {field(t.risk, risk, setRisk)}
        {field(t.entry, entry, setEntry)}
        {field(t.stop, stop, setStop)}
      </Box>

      <Box
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'surface.subtle',
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: result
            ? { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }
            : '1fr',
        }}
      >
        {result ? (
          <>
            <Figure label={t.riskAmount} value={num(result.amount)} />
            <Figure
              label={t.stopDistance}
              value={`${num(result.distancePercent)}%`}
            />
            <Figure label={t.size} value={num(result.size, 6)} />
            <Figure label={t.notional} value={num(result.notional)} />
            <Figure label={t.leverage} value={`${num(result.leverage, 1)}×`} />
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t.incomplete}
          </Typography>
        )}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1.5, display: 'block' }}
      >
        {t.note}
      </Typography>
    </Paper>
  )
}

function BlockView({
  block,
  content,
}: {
  block: Block
  content: DisciplineContent
}) {
  const labelJoin = content.labelJoin

  switch (block.kind) {
    case 'paragraph':
      return (
        <Typography variant="body2" color="text.secondary">
          {block.text}
        </Typography>
      )

    case 'steps':
      return (
        <CardGrid columns={2}>
          {block.items.map((item, i) => (
            <Card key={item.title} title={item.title} trailing={String(i + 1)}>
              <Typography variant="body2" color="text.secondary">
                {item.body}
              </Typography>
            </Card>
          ))}
        </CardGrid>
      )

    case 'table':
      return <SimpleTable headers={block.headers} rows={block.rows} />

    case 'subTable':
      return (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'surface.border' }}>
          <Typography sx={{ fontWeight: 600, mb: 1.25 }}>
            {block.title}
          </Typography>
          <SimpleTable headers={block.headers} rows={block.rows} />
        </Paper>
      )

    case 'recipes':
      return (
        <CardGrid columns={2}>
          {block.items.map((item) => (
            <Card key={item.title} title={item.title}>
              <Stack sx={{ gap: 1 }}>
                {item.lines.map((line) => (
                  <Typography
                    key={line.label}
                    variant="body2"
                    color="text.secondary"
                  >
                    <Box
                      component="span"
                      sx={{ color: 'text.primary', fontWeight: 500 }}
                    >
                      {line.label}
                      {labelJoin}
                    </Box>
                    {line.text}
                  </Typography>
                ))}
              </Stack>
            </Card>
          ))}
        </CardGrid>
      )

    case 'rules':
      return (
        <CardGrid columns={block.items.length >= 3 ? 3 : 2}>
          {block.items.map((item) => (
            <Card key={item.title} title={item.title}>
              <Bullets items={item.items} />
            </Card>
          ))}
        </CardGrid>
      )

    case 'note':
      return (
        <Alert severity="info" variant="outlined">
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
            {block.title}
          </Typography>
          <Bullets items={block.items} />
        </Alert>
      )

    case 'checklist':
      return <Checklist items={block.items} content={content} />

    case 'sizer':
      return <Sizer content={content} />
  }
}

function SectionView({
  section,
  content,
}: {
  section: Section
  content: DisciplineContent
}) {
  return (
    <Stack
      id={section.id}
      component="section"
      sx={{
        gap: 1.5,
        scrollMarginTop: { xs: HEADER_OFFSET.xs, md: HEADER_OFFSET.md },
      }}
    >
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
        {section.title}
      </Typography>
      {section.blocks.map((block, i) => (
        <BlockView key={i} block={block} content={content} />
      ))}
    </Stack>
  )
}

function TableOfContents({
  label,
  entries,
  activeId,
}: {
  label: string
  entries: { id: string; label: string }[]
  activeId: string
}) {
  return (
    <Paper
      component="nav"
      aria-label={label}
      variant="outlined"
      sx={{
        p: 1.5,
        borderColor: 'surface.border',
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ px: 1, mb: 0.5, display: 'block', fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Stack sx={{ gap: 0.25 }}>
        {entries.map((item) => {
          const active = item.id === activeId
          return (
            <ButtonBase
              key={item.id}
              onClick={() => scrollToId(item.id)}
              aria-current={active ? 'true' : undefined}
              sx={{
                display: 'block',
                textAlign: 'left',
                px: 1,
                py: 0.75,
                borderRadius: 1,
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'surface.subtle' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                lineHeight: 1.35,
                borderLeft: '2px solid',
                borderColor: active ? 'primary.main' : 'transparent',
                '&:hover': { bgcolor: 'surface.subtle', color: 'text.primary' },
              }}
            >
              {item.label}
            </ButtonBase>
          )
        })}
      </Stack>
    </Paper>
  )
}

function MobileToc({
  label,
  entries,
  activeId,
}: {
  label: string
  entries: { id: string; label: string }[]
  activeId: string
}) {
  return (
    <Box
      component="nav"
      aria-label={label}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'sticky',
        // Flush against the app bar, not 8px under its top edge, which is
        // where the row's own padding used to disappear.
        top: 64,
        zIndex: 2,
        mx: -2,
        px: 2,
        py: 1,
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'surface.border',
      }}
    >
      <Stack
        direction="row"
        sx={{ gap: 1, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'thin' }}
      >
        {entries.map((item) => (
          <Chip
            key={item.id}
            size="small"
            label={item.label}
            onClick={() => scrollToId(item.id)}
            color={item.id === activeId ? 'primary' : 'default'}
            variant={item.id === activeId ? 'filled' : 'outlined'}
            aria-current={item.id === activeId ? 'true' : undefined}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Stack>
    </Box>
  )
}

/**
 * Chart-reading and risk rules as a readable board with in-page contents. The
 * words live in `i18n/discipline`, which the markdown under `docs/` is printed
 * from as well — the page and the file cannot drift apart because there is
 * only one copy of them.
 */
export default function TradingDiscipline() {
  const locale = useLocale()
  const content = DISCIPLINE[locale]
  const entries = content.sections.map((s) => ({ id: s.id, label: s.label }))

  const [activeId, setActiveId] = useState<string>(content.sections[0].id)
  const theme = useTheme()
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const offset = mdUp ? HEADER_OFFSET.md : HEADER_OFFSET.xs

  // An IntersectionObserver was the obvious thing here and it was wrong twice
  // over. Its callback is handed only the sections whose visibility *changed*,
  // so a section leaving arrives alone as `isIntersecting: false` and leaves
  // nothing to promote — the highlight simply stopped moving partway down the
  // page. And the sections run 200–650px against a band a quarter of the
  // viewport tall, so most of them can never reach a ratio threshold relative
  // to themselves anyway. Reading the positions off the scroll answers the
  // question directly: the active section is the last one whose top has
  // crossed under the header.
  useEffect(() => {
    const ids = content.sections.map((s) => s.id)
    let frame = 0

    const sync = () => {
      frame = 0

      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= offset + 1) current = id
      }

      // What follows the last section is shorter than a viewport, so its top
      // never makes it under the header and the entry for it would never light
      // up. Reaching the bottom of the page is the signal instead.
      const doc = document.documentElement
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        current = ids[ids.length - 1]
      }

      setActiveId(current)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(sync)
    }

    sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [content, offset])

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <MobileToc
        label={content.tocLabel}
        entries={entries}
        activeId={activeId}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '200px minmax(0, 1fr)' },
          alignItems: 'start',
          mt: { xs: 1.5, md: 0 },
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: 88,
            // Dynamic viewport units, because on a tablet `vh` is the height
            // the page would have with the browser chrome collapsed — the
            // contents would run past the bottom of what you can actually see
            // and the last few entries would be unreachable.
            maxHeight: 'calc(100dvh - 104px)',
            overflowY: 'auto',
          }}
        >
          <TableOfContents
            label={content.tocLabel}
            entries={entries}
            activeId={activeId}
          />
        </Box>

        <Stack sx={{ gap: 3, minWidth: 0 }}>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {content.title}
            </Typography>
            <Typography color="text.secondary">{content.lede}</Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            }}
          >
            {content.stats.map((stat) => (
              <StatCard
                key={stat.label}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </Box>

          <Alert severity="warning" variant="outlined">
            {content.principle}
          </Alert>

          {content.sections.map((section) => (
            <Stack key={section.id} sx={{ gap: 3 }}>
              {section.rule ? <Divider /> : null}
              <SectionView section={section} content={content} />
            </Stack>
          ))}

          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderColor: 'surface.border' }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {content.closing.label}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: 'primary.main', mb: 1.5 }}
            >
              {content.closing.oneLiner}
            </Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {content.closing.chips.map((label) => (
                <Chip
                  key={label}
                  size="small"
                  label={label}
                  sx={{ bgcolor: 'surface.subtle' }}
                />
              ))}
            </Stack>
          </Paper>

          {content.related ? (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderColor: 'surface.border',
                bgcolor: 'surface.subtle',
              }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 0.75 }}
              >
                {content.related.label}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                {content.related.text}
              </Typography>
              <Button
                component={RouterLink}
                to={content.related.href}
                variant="outlined"
                size="small"
              >
                {content.related.cta}
              </Button>
            </Paper>
          ) : null}

          <Typography variant="caption" color="text.disabled">
            {content.closing.disclaimer}
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
