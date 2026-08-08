import {
  Alert,
  Box,
  ButtonBase,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'

import IndicatorDiagram from '../components/IndicatorDiagram'
import { useLocale } from '../i18n'
import {
  INDICATORS,
  type IndicatorsContent,
  type Indicator,
  type Category,
} from '../i18n/indicators'
import { MONO_STACK } from '../fonts'

/**
 * Matches the discipline page: the app bar is fixed at 64, and below `md` the
 * section chips sit under it (~44). Anchored headings and the scroll spy share
 * the same clearance so the highlight and the heading stay in agreement.
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
      <Table
        size="small"
        sx={{ minWidth: headers.length >= 3 ? 160 * headers.length + 80 : 0 }}
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
                    minWidth: j === 0 ? 88 : undefined,
                    maxWidth: j === 0 ? 200 : undefined,
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

function FormulaBlock({ lines }: { lines: string[] }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderColor: 'surface.border',
        bgcolor: 'surface.subtle',
      }}
    >
      <Stack sx={{ gap: 0.75 }}>
        {lines.map((line) => (
          <Typography
            key={line}
            component="code"
            sx={{
              fontFamily: MONO_STACK,
              fontSize: 13,
              lineHeight: 1.55,
              color: 'text.primary',
              display: 'block',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {line}
          </Typography>
        ))}
      </Stack>
    </Paper>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <Stack component="ul" sx={{ gap: 0.75, m: 0, pl: 2.25 }}>
      {items.map((item) => (
        <Typography
          key={item}
          component="li"
          variant="body2"
          color="text.secondary"
        >
          {item}
        </Typography>
      ))}
    </Stack>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack sx={{ gap: 0.75 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: 0.2 }}
      >
        {label}
      </Typography>
      {children}
    </Stack>
  )
}

function SignalList({
  items,
  labelJoin,
}: {
  items: { label: string; text: string }[]
  labelJoin: string
}) {
  return (
    <Stack sx={{ gap: 1 }}>
      {items.map((item) => (
        <Typography key={item.label} variant="body2" color="text.secondary">
          <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
            {item.label}
            {labelJoin}
          </Box>
          {item.text}
        </Typography>
      ))}
    </Stack>
  )
}

function IndicatorCard({
  indicator,
  fields,
  labelJoin,
}: {
  indicator: Indicator
  fields: IndicatorsContent['fields']
  labelJoin: string
}) {
  return (
    <Paper
      id={indicator.id}
      variant="outlined"
      component="article"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderColor: 'surface.border',
        scrollMarginTop: { xs: HEADER_OFFSET.xs, md: HEADER_OFFSET.md },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ gap: 2.5, alignItems: 'stretch' }}
      >
        <Stack sx={{ gap: 2, flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {indicator.name}
            </Typography>
            <Chip
              size="small"
              label={indicator.tag}
              sx={{ bgcolor: 'surface.subtle', flexShrink: 0 }}
            />
          </Stack>

          <Field label={fields.principle}>
            <Typography variant="body2" color="text.secondary">
              {indicator.principle}
            </Typography>
          </Field>

          <Field label={fields.formula}>
            <FormulaBlock lines={indicator.formula} />
          </Field>

          <Field label={fields.params}>
            <Typography variant="body2" color="text.secondary">
              {indicator.params}
            </Typography>
          </Field>

          <Field label={fields.signals}>
            <SignalList items={indicator.signals} labelJoin={labelJoin} />
          </Field>

          <Field label={fields.regime}>
            <Typography variant="body2" color="text.secondary">
              {indicator.regime}
            </Typography>
          </Field>

          <Field label={fields.usage}>
            <Bullets items={indicator.usage} />
          </Field>

          <Field label={fields.pitfalls}>
            <Bullets items={indicator.pitfalls} />
          </Field>
        </Stack>

        <Box
          sx={{
            flex: { md: '0 0 280px' },
            width: { xs: '100%', md: 280 },
            alignSelf: { md: 'flex-start' },
            position: { md: 'sticky' },
            top: { md: HEADER_OFFSET.md },
          }}
        >
          <IndicatorDiagram id={indicator.diagram} />
        </Box>
      </Stack>
    </Paper>
  )
}

function CategorySection({
  category,
  fields,
  labelJoin,
}: {
  category: Category
  fields: IndicatorsContent['fields']
  labelJoin: string
}) {
  return (
    <Stack
      id={category.id}
      component="section"
      sx={{
        gap: 2,
        scrollMarginTop: { xs: HEADER_OFFSET.xs, md: HEADER_OFFSET.md },
      }}
    >
      <Stack sx={{ gap: 0.75 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          {category.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {category.intro}
        </Typography>
      </Stack>
      <Stack sx={{ gap: 2 }}>
        {category.indicators.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            indicator={indicator}
            fields={fields}
            labelJoin={labelJoin}
          />
        ))}
      </Stack>
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
 * Reference board for common technical indicators: classified by role, each
 * with principle, formula, parameters, usage, and a schematic diagram. Copy
 * lives in `i18n/indicators` so it stays out of the main message bundle.
 */
export default function TechnicalIndicators() {
  const locale = useLocale()
  const content = INDICATORS[locale]

  const entries = [
    { id: content.overview.id, label: content.overview.label },
    ...content.categories.map((c) => ({ id: c.id, label: c.label })),
    { id: content.combine.id, label: content.combine.label },
  ]

  const [activeId, setActiveId] = useState(entries[0].id)
  const theme = useTheme()
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))
  const offset = mdUp ? HEADER_OFFSET.md : HEADER_OFFSET.xs

  useEffect(() => {
    const ids = [
      content.overview.id,
      ...content.categories.map((c) => c.id),
      content.combine.id,
    ]
    let frame = 0

    const sync = () => {
      frame = 0
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= offset + 1) current = id
      }
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

          <Stack
            id={content.overview.id}
            component="section"
            sx={{
              gap: 1.5,
              scrollMarginTop: {
                xs: HEADER_OFFSET.xs,
                md: HEADER_OFFSET.md,
              },
            }}
          >
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              {content.overview.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {content.overview.intro}
            </Typography>
            <SimpleTable
              headers={content.overview.headers}
              rows={content.overview.rows}
            />
          </Stack>

          {content.categories.map((category) => (
            <Stack key={category.id} sx={{ gap: 3 }}>
              <Divider />
              <CategorySection
                category={category}
                fields={content.fields}
                labelJoin={content.labelJoin}
              />
            </Stack>
          ))}

          <Divider />

          <Stack
            id={content.combine.id}
            component="section"
            sx={{
              gap: 1.5,
              scrollMarginTop: {
                xs: HEADER_OFFSET.xs,
                md: HEADER_OFFSET.md,
              },
            }}
          >
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              {content.combine.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {content.combine.intro}
            </Typography>
            <SimpleTable
              headers={content.combine.headers}
              rows={content.combine.rows}
            />
            <Alert severity="info" variant="outlined">
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                {content.combine.noteTitle}
              </Typography>
              <Bullets items={content.combine.noteItems} />
            </Alert>
          </Stack>

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

          <Typography variant="caption" color="text.disabled">
            {content.closing.disclaimer}
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
