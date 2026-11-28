import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import { format } from 'date-fns'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { useNavigate } from 'react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { numericFont } from '../fonts'
import { backfillJournalOutcomes } from '../hooks/useOkxJournalBackfill'
import { useMessages } from '../i18n'
import {
  clearJournal,
  getAllJournalSamples,
  putJournalSamples,
  subscribeJournal,
} from '../store/signalJournalDb'
import { openOkxDetail } from '../store/useOkxDetailStore'
import { formatNumber } from '../utils'
import {
  buildAnalyticsReport,
  samplesToCsv,
  type BreakdownRow,
  type HorizonMetric,
  type OutcomeHorizon,
  type SignalSample,
} from '../utils/signalAnalytics'

type WindowFilter = 'all' | '24h' | '7d' | '30d'
type SourceFilter = 'all' | 'live' | 'backtest'
type BreakdownTab = 'regime' | 'kind' | 'backdrop' | 'session' | 'symbol'

const WINDOW_MS: Record<Exclude<WindowFilter, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

const fmtPct = (value: number | null | undefined, signed = false) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '-'
  }
  return `${signed && value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

const fmtRatio = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? '-'
    : `${value.toFixed(2)}×`

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function isSignalSample(value: unknown): value is SignalSample {
  if (!value || typeof value !== 'object') return false
  const row = value as Partial<SignalSample>
  return (
    typeof row.id === 'string' &&
    typeof row.instId === 'string' &&
    typeof row.at === 'number' &&
    typeof row.triggerPrice === 'number' &&
    Array.isArray(row.kinds)
  )
}

function OutcomeCell({ metric }: { metric?: HorizonMetric }) {
  if (!metric) {
    return (
      <Typography
        component="span"
        sx={{ fontSize: 12, color: 'text.secondary', ...numericFont }}
      >
        -
      </Typography>
    )
  }
  const color =
    metric.ret > 0
      ? 'market.up'
      : metric.ret < 0
        ? 'market.down'
        : 'text.secondary'
  return (
    <Tooltip
      arrow
      title={`MFE +${metric.mfe.toFixed(2)}% · MAE -${metric.mae.toFixed(2)}%`}
    >
      <Typography
        component="span"
        sx={{ fontSize: 12, fontWeight: 600, color, ...numericFont }}
      >
        {fmtPct(metric.ret, true)}
      </Typography>
    </Tooltip>
  )
}

export default function SignalStats() {
  const t = useMessages()
  const theme = useTheme()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [allSamples, setAllSamples] = useState<SignalSample[]>([])
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('30d')
  const [horizon, setHorizon] = useState<OutcomeHorizon>('m15')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [tab, setTab] = useState<BreakdownTab>('regime')
  const [backfilling, setBackfilling] = useState(false)
  const [notice, setNotice] = useState<{
    severity: 'info' | 'success' | 'error'
    text: string
  } | null>(null)

  const reload = useCallback(async () => {
    const items = await getAllJournalSamples()
    setAllSamples(items)
  }, [])

  useEffect(() => {
    void reload()
    return subscribeJournal(() => {
      void reload()
    })
  }, [reload])

  const filteredSamples = useMemo(() => {
    const cutoff =
      windowFilter === 'all' ? 0 : Date.now() - WINDOW_MS[windowFilter]
    return allSamples.filter((sample) => {
      if (sample.at < cutoff) return false
      if (sourceFilter !== 'all' && sample.source !== sourceFilter) return false
      return true
    })
  }, [allSamples, windowFilter, sourceFilter])

  const report = useMemo(
    () => buildAnalyticsReport(filteredSamples, horizon),
    [filteredSamples, horizon],
  )

  const handleBackfill = useCallback(async () => {
    setBackfilling(true)
    setNotice(null)
    try {
      const updated = await backfillJournalOutcomes()
      setNotice({
        severity: 'success',
        text: t.signalLab.backfillDone(updated),
      })
    } finally {
      setBackfilling(false)
    }
  }, [t.signalLab])

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return

      try {
        const raw = JSON.parse(await file.text()) as unknown
        const candidate = Array.isArray(raw)
          ? raw
          : raw && typeof raw === 'object' && 'samples' in raw
            ? (raw as { samples: unknown }).samples
            : null
        if (!Array.isArray(candidate)) {
          setNotice({ severity: 'error', text: t.signalLab.importFailed })
          return
        }
        const valid = candidate.filter(isSignalSample).map((sample) => ({
          ...sample,
          source: sample.source ?? ('backtest' as const),
          backdropKinds: sample.backdropKinds ?? [],
          families: sample.families ?? [],
          reasons: sample.reasons ?? [],
          tier: sample.tier ?? ('standard' as const),
          direction: sample.direction ?? ('neutral' as const),
          regime: sample.regime ?? null,
        }))
        if (!valid.length) {
          setNotice({ severity: 'error', text: t.signalLab.importFailed })
          return
        }
        await putJournalSamples(valid)
        setNotice({
          severity: 'success',
          text: t.signalLab.importDone(valid.length),
        })
      } catch {
        setNotice({ severity: 'error', text: t.signalLab.importFailed })
      }
    },
    [t.signalLab],
  )

  const handleExportCsv = useCallback(() => {
    downloadText(
      `signal-samples-${horizon}.csv`,
      samplesToCsv(filteredSamples),
      'text/csv;charset=utf-8',
    )
  }, [filteredSamples, horizon])

  const handleExportJson = useCallback(() => {
    downloadText(
      `signal-report-${horizon}.json`,
      JSON.stringify(
        { generatedAt: Date.now(), horizon, report, samples: filteredSamples },
        null,
        2,
      ),
      'application/json',
    )
  }, [filteredSamples, horizon, report])

  const handleClear = useCallback(async () => {
    await clearJournal(sourceFilter === 'all' ? undefined : sourceFilter)
    setNotice(null)
  }, [sourceFilter])

  const openSymbolDetail = useCallback(
    (instId: string) => {
      openOkxDetail(instId)
      void navigate('/')
    },
    [navigate],
  )

  const regimeLabel = useCallback(
    (key: string) =>
      t.signalLab.regimes[key as keyof typeof t.signalLab.regimes] ?? key,
    [t],
  )

  const sessionLabel = useCallback(
    (key: string) => {
      if (key === 'asia') return t.signalLab.sessionAsia
      if (key === 'europe') return t.signalLab.sessionEurope
      if (key === 'us') return t.signalLab.sessionUs
      return key
    },
    [t.signalLab],
  )

  const breakdownRows: Array<{ label: string; row: BreakdownRow }> =
    useMemo(() => {
      if (tab === 'regime') {
        return report.byRegime.map((row) => ({
          label: regimeLabel(row.key),
          row,
        }))
      }
      if (tab === 'kind') {
        return report.byKind.map((row) => ({ label: row.key, row }))
      }
      if (tab === 'backdrop') {
        return report.byBackdrop.map((row) => ({
          label: row.key === 'none' ? t.signalLab.backdropNone : row.key,
          row,
        }))
      }
      if (tab === 'session') {
        return report.bySession.map((row) => ({
          label: sessionLabel(row.key),
          row,
        }))
      }
      return report.bySymbol.map((row) => ({
        label: row.key.split('-')[0],
        row,
      }))
    }, [tab, report, regimeLabel, sessionLabel, t.signalLab.backdropNone])

  const regimeChartData = useMemo(
    () =>
      report.byRegime
        .filter((r) => r.stats.continuationRate !== null)
        .map((r) => ({
          name: regimeLabel(r.key),
          continuation: r.stats.continuationRate ?? 0,
          avgDir: r.stats.avgDirectionalRet ?? 0,
          count: r.stats.directionalCount,
        })),
    [report.byRegime, regimeLabel],
  )

  const cardSx = {
    p: 2,
    borderRadius: '14px',
    border: '1px solid',
    borderColor: 'surface.border',
    backgroundColor: 'background.paper',
    backgroundImage: 'none',
    boxShadow: 'none',
  } as const

  const upColor = theme.vars.palette.market.up
  const downColor = theme.vars.palette.market.down
  const signalColor = theme.vars.palette.signal.main
  const gridColor = theme.vars.palette.surface.border
  const axisColor = theme.vars.palette.text.secondary

  return (
    <Stack sx={{ maxWidth: 1280, mx: 'auto', gap: 2.5 }}>
      {/* Header + actions */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          alignItems: { xs: 'stretch', md: 'flex-start' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}>
            {t.signalLab.title}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
            {t.signalLab.subtitle}
          </Typography>
        </Box>

        <Stack
          direction="row"
          sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => void handleImportFile(e)}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
            disabled={backfilling}
            onClick={() => void handleBackfill()}
          >
            {backfilling ? t.signalLab.backfilling : t.signalLab.backfill}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadFileOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => fileInputRef.current?.click()}
          >
            {t.signalLab.importJson}
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={!filteredSamples.length}
            startIcon={<CloudDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportCsv}
          >
            {t.signalLab.exportCsv}
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={!filteredSamples.length}
            onClick={handleExportJson}
          >
            {t.signalLab.exportJson}
          </Button>
          {allSamples.length > 0 && (
            <Button
              size="small"
              color="inherit"
              startIcon={<DeleteForeverOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => void handleClear()}
              sx={{ color: 'text.secondary' }}
            >
              {t.signalLab.clear}
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Filter bar */}
      <Stack
        direction="row"
        sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={windowFilter}
          onChange={(_, next: WindowFilter | null) => {
            if (next) setWindowFilter(next)
          }}
        >
          <ToggleButton value="24h">{t.signalLab.window24h}</ToggleButton>
          <ToggleButton value="7d">{t.signalLab.window7d}</ToggleButton>
          <ToggleButton value="30d">{t.signalLab.window30d}</ToggleButton>
          <ToggleButton value="all">{t.signalLab.windowAll}</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={horizon}
          onChange={(_, next: OutcomeHorizon | null) => {
            if (next) setHorizon(next)
          }}
        >
          <ToggleButton value="m5">5m</ToggleButton>
          <ToggleButton value="m15">15m</ToggleButton>
          <ToggleButton value="h1">1h</ToggleButton>
          <ToggleButton value="h4">4h</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={sourceFilter}
          onChange={(_, next: SourceFilter | null) => {
            if (next) setSourceFilter(next)
          }}
        >
          <ToggleButton value="all">{t.signalLab.sourceAll}</ToggleButton>
          <ToggleButton value="live">{t.signalLab.sourceLive}</ToggleButton>
          <ToggleButton value="backtest">
            {t.signalLab.sourceBacktest}
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {notice && (
        <Alert
          severity={notice.severity}
          variant="outlined"
          onClose={() => setNotice(null)}
        >
          {notice.text}
        </Alert>
      )}

      {filteredSamples.length === 0 ? (
        <Paper sx={{ ...cardSx, p: 4, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
            {t.signalLab.emptyTitle}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: 'text.secondary',
              mt: 1,
              maxWidth: 640,
              mx: 'auto',
            }}
          >
            {t.signalLab.emptyBody}
          </Typography>
          <Box
            component="pre"
            sx={{
              ...numericFont,
              display: 'inline-block',
              mt: 2,
              px: 2,
              py: 1,
              borderRadius: '8px',
              backgroundColor: 'surface.subtle',
              fontSize: 12,
              color: 'text.primary',
              overflowX: 'auto',
              maxWidth: '100%',
            }}
          >
            pnpm backtest --days 7 --out backtest-reports/report.json
          </Box>
        </Paper>
      ) : (
        <>
          {/* KPI Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {t.signalLab.kpiSamples}
              </Typography>
              <Typography
                sx={{ fontSize: 26, fontWeight: 700, mt: 0.5, ...numericFont }}
              >
                {report.overall.total}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  mt: 0.5,
                  ...numericFont,
                }}
              >
                {t.signalLab.kpiEvaluated(
                  report.overall.evaluated,
                  report.alertsPerDay === null
                    ? '-'
                    : report.alertsPerDay.toFixed(1),
                )}
              </Typography>
            </Paper>

            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {t.signalLab.kpiContinuation} ({horizon})
              </Typography>
              <Typography
                sx={{
                  fontSize: 26,
                  fontWeight: 700,
                  mt: 0.5,
                  color:
                    (report.overall.continuationRate ?? 50) >= 50
                      ? 'market.up'
                      : 'market.down',
                  ...numericFont,
                }}
              >
                {fmtPct(report.overall.continuationRate)}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  mt: 0.5,
                  ...numericFont,
                }}
              >
                {t.signalLab.kpiDirectionalDetail(
                  fmtPct(report.overall.avgDirectionalRet, true),
                  fmtPct(report.overall.medianDirectionalRet, true),
                )}
              </Typography>
            </Paper>

            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {t.signalLab.kpiExcursion} ({horizon})
              </Typography>
              <Typography
                sx={{ fontSize: 26, fontWeight: 700, mt: 0.5, ...numericFont }}
              >
                {fmtRatio(report.overall.mfeMaeRatio)}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  mt: 0.5,
                  ...numericFont,
                }}
              >
                {t.signalLab.kpiExcursionDetail(
                  fmtPct(report.overall.avgMfe),
                  fmtPct(report.overall.avgMae),
                )}
              </Typography>
            </Paper>

            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {t.signalLab.kpiTierCompare}
              </Typography>
              <Stack sx={{ gap: 0.5, mt: 1 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'signal.main',
                    ...numericFont,
                  }}
                >
                  {t.signalLab.kpiTierLine(
                    t.alerts.highPriorityTag,
                    fmtPct(report.byTier.high.continuationRate),
                    fmtPct(report.byTier.high.avgDirectionalRet, true),
                    report.byTier.high.evaluated,
                  )}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: 'text.secondary',
                    ...numericFont,
                  }}
                >
                  {t.signalLab.kpiTierLine(
                    'STD',
                    fmtPct(report.byTier.standard.continuationRate),
                    fmtPct(report.byTier.standard.avgDirectionalRet, true),
                    report.byTier.standard.evaluated,
                  )}
                </Typography>
              </Stack>
            </Paper>
          </Box>

          {/* Charts */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
                {t.signalLab.chartRegimeTitle} ({horizon})
              </Typography>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regimeChartData}
                    margin={{ top: 8, right: 16, left: -12, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke={gridColor}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: axisColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: axisColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                    />
                    <ReferenceLine
                      y={50}
                      stroke={axisColor}
                      strokeDasharray="4 4"
                    />
                    <RechartsTooltip
                      formatter={(value: unknown) => [
                        `${Number(value).toFixed(1)}%`,
                        t.signalLab.colCont,
                      ]}
                    />
                    <Bar
                      dataKey="continuation"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                    >
                      {regimeChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.continuation >= 50 ? upColor : downColor}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Paper sx={cardSx}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
                {t.signalLab.chartDistTitle} ({horizon})
              </Typography>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={report.distribution}
                    margin={{ top: 8, right: 16, left: -16, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke={gridColor}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: axisColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: axisColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      formatter={(value: unknown) => [
                        Number(value),
                        t.signalLab.chartSamples,
                      ]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={38}>
                      {report.distribution.map((bucket) => (
                        <Cell
                          key={bucket.label}
                          fill={
                            bucket.min >= 0
                              ? upColor
                              : bucket.max <= 0
                                ? downColor
                                : signalColor
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>

          {/* Multi-dimension Breakdown */}
          <Paper sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
            <Box
              sx={{
                px: 2,
                pt: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, next: BreakdownTab) => setTab(next)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab value="regime" label={t.signalLab.tabRegime} />
                <Tab value="kind" label={t.signalLab.tabKind} />
                <Tab value="backdrop" label={t.signalLab.tabBackdrop} />
                <Tab value="session" label={t.signalLab.tabSession} />
                <Tab value="symbol" label={t.signalLab.tabSymbol} />
              </Tabs>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t.signalLab.colGroup}</TableCell>
                    <TableCell align="right">{t.signalLab.colTotal}</TableCell>
                    <TableCell align="right">{t.signalLab.colEval}</TableCell>
                    <TableCell align="right">{t.signalLab.colCont}</TableCell>
                    <TableCell align="right">{t.signalLab.colAvgDir}</TableCell>
                    <TableCell align="right">{t.signalLab.colMedDir}</TableCell>
                    <TableCell align="right">{t.signalLab.colMfe}</TableCell>
                    <TableCell align="right">{t.signalLab.colMae}</TableCell>
                    <TableCell align="right">{t.signalLab.colRatio}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {breakdownRows.map(({ label, row }) => (
                    <TableRow key={row.key} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{label}</TableCell>
                      <TableCell align="right" sx={numericFont}>
                        {row.stats.total}
                      </TableCell>
                      <TableCell align="right" sx={numericFont}>
                        {row.stats.evaluated}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          ...numericFont,
                          fontWeight: 600,
                          color:
                            row.stats.continuationRate === null
                              ? 'text.secondary'
                              : row.stats.continuationRate >= 50
                                ? 'market.up'
                                : 'market.down',
                        }}
                      >
                        {fmtPct(row.stats.continuationRate)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          ...numericFont,
                          color:
                            row.stats.avgDirectionalRet === null
                              ? 'text.secondary'
                              : row.stats.avgDirectionalRet >= 0
                                ? 'market.up'
                                : 'market.down',
                        }}
                      >
                        {fmtPct(row.stats.avgDirectionalRet, true)}
                      </TableCell>
                      <TableCell align="right" sx={numericFont}>
                        {fmtPct(row.stats.medianDirectionalRet, true)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...numericFont, color: 'market.up' }}
                      >
                        {fmtPct(row.stats.avgMfe)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...numericFont, color: 'market.down' }}
                      >
                        {fmtPct(row.stats.avgMae)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...numericFont, fontWeight: 600 }}
                      >
                        {fmtRatio(row.stats.mfeMaeRatio)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Recent Samples */}
          <Paper sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {t.signalLab.recentTitle} (
                {Math.min(50, filteredSamples.length)}/{filteredSamples.length})
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>{t.signalLab.colTime}</TableCell>
                    <TableCell>{t.signalLab.colSymbol}</TableCell>
                    <TableCell>{t.signalLab.colSource}</TableCell>
                    <TableCell>{t.signalLab.colRegime}</TableCell>
                    <TableCell align="right">{t.signalLab.colEntry}</TableCell>
                    <TableCell align="right">{t.signalLab.colM5}</TableCell>
                    <TableCell align="right">{t.signalLab.colM15}</TableCell>
                    <TableCell align="right">{t.signalLab.colH1}</TableCell>
                    <TableCell align="right">{t.signalLab.colH4}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSamples.slice(0, 50).map((sample) => (
                    <TableRow key={sample.id} hover>
                      <TableCell
                        sx={{
                          ...numericFont,
                          fontSize: 12,
                          color: 'text.secondary',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {format(sample.at, 'MM-dd HH:mm')}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => openSymbolDetail(sample.instId)}
                          sx={{
                            minWidth: 0,
                            px: 0.5,
                            height: 'auto',
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {sample.instId.split('-')[0]}
                        </Button>
                        {sample.tier === 'high' && (
                          <Chip
                            size="small"
                            label={t.alerts.highPriorityTag}
                            sx={{
                              ml: 0.5,
                              height: 18,
                              fontSize: 10,
                              color: 'signal.main',
                              backgroundColor: 'signal.surface',
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            sample.source === 'live'
                              ? t.signalLab.badgeLive
                              : t.signalLab.badgeBacktest
                          }
                          sx={{
                            height: 18,
                            fontSize: 10,
                            backgroundColor: 'surface.subtle',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                          {sample.headline}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11, color: 'text.secondary' }}
                        >
                          {sample.kinds.join(' · ')}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ ...numericFont, fontSize: 12 }}
                      >
                        {formatNumber(sample.triggerPrice, 6)}
                      </TableCell>
                      <TableCell align="right">
                        <OutcomeCell metric={sample.outcomes?.m5} />
                      </TableCell>
                      <TableCell align="right">
                        <OutcomeCell metric={sample.outcomes?.m15} />
                      </TableCell>
                      <TableCell align="right">
                        <OutcomeCell metric={sample.outcomes?.h1} />
                      </TableCell>
                      <TableCell align="right">
                        <OutcomeCell metric={sample.outcomes?.h4} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Stack>
  )
}
