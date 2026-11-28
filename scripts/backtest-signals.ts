/**
 * Offline historical signal backtester.
 *
 * Replays the exact production `collectSignals` + `collectBackdrop` +
 * `flagStateOf` + `shouldEmitAlert` logic over OKX historical 5m/15m/1D
 * candles and rubik series, printing a multi-dimensional effectiveness report
 * (continuation rate, avg directional return, MFE/MAE, high vs standard tier,
 * regime, signal kind, backdrop confluence, session, and symbol).
 *
 * Usage:
 *   pnpm backtest
 *   pnpm backtest --days 14 --horizon h1 --symbols BTC-USDT-SWAP,ETH-USDT-SWAP,SOL-USDT-SWAP
 *   pnpm backtest --out backtest-reports/report.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { en } from '../src/i18n/en'
import { zh } from '../src/i18n/zh'
import type { OkxKline } from '../src/types/okx'
import {
  buildAnalyticsReport,
  type GroupStats,
  type OutcomeHorizon,
} from '../src/utils/signalAnalytics'
import {
  runBacktest,
  type BacktestFundingRow,
  type SymbolHistory,
} from '../src/utils/signalBacktest'

const OKX_BASE = 'https://www.okx.com/api/v5'
const CACHE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.cache',
  'backtest',
)
const CACHE_TTL_MS = 30 * 60 * 1000
const DEFAULT_SYMBOLS = [
  'BTC-USDT-SWAP',
  'ETH-USDT-SWAP',
  'SOL-USDT-SWAP',
  'XRP-USDT-SWAP',
  'DOGE-USDT-SWAP',
  'SUI-USDT-SWAP',
  'BNB-USDT-SWAP',
  'AVAX-USDT-SWAP',
]

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
    } else {
      args[key] = next
      i++
    }
  }
  const symbols =
    typeof args.symbols === 'string'
      ? args.symbols
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : DEFAULT_SYMBOLS
  const days = Math.max(1, Math.min(30, Number(args.days) || 7))
  const horizon = (
    ['m5', 'm15', 'h1', 'h4'].includes(String(args.horizon))
      ? String(args.horizon)
      : 'm15'
  ) as OutcomeHorizon
  const out = typeof args.out === 'string' ? args.out : null
  const noCache = Boolean(args['no-cache'])
  const lang = args.lang === 'en' ? 'en' : 'zh'
  return { symbols, days, horizon, out, noCache, lang }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function okxGet<T>(
  path: string,
  params: Record<string, string | number>,
) {
  const url = new URL(`${OKX_BASE}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  }
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`OKX HTTP ${res.status} for ${path}`)
  }
  const json = (await res.json()) as { code: string; msg?: string; data?: T }
  if (json.code !== '0') {
    throw new Error(`OKX error ${json.code}: ${json.msg ?? path}`)
  }
  return json.data ?? ([] as unknown as T)
}

async function fetchPaginatedCandles(
  instId: string,
  bar: string,
  sinceTs: number,
  maxPages = 25,
): Promise<OkxKline[]> {
  const rows: OkxKline[] = []
  let after: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const endpoint = page === 0 ? '/market/candles' : '/market/history-candles'
    const params: Record<string, string | number> = {
      instId,
      bar,
      limit: 300,
    }
    if (after) params.after = after
    const batch = await okxGet<OkxKline[]>(endpoint, params)
    if (!batch.length) break
    rows.push(...batch)
    const oldestTs = Number(batch[batch.length - 1][0])
    if (oldestTs <= sinceTs || batch.length < 100) break
    after = String(oldestTs)
    await sleep(120)
  }
  const dedup = new Map(rows.map((row) => [row[0], row]))
  return [...dedup.values()]
}

async function safeGet<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

async function fetchSymbolHistory(
  instId: string,
  days: number,
  noCache: boolean,
): Promise<SymbolHistory> {
  mkdirSync(CACHE_DIR, { recursive: true })
  const cacheFile = join(CACHE_DIR, `${instId}-${days}d.json`)
  if (!noCache && existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(readFileSync(cacheFile, 'utf8')) as {
        fetchedAt: number
        data: SymbolHistory
      }
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data
      }
    } catch {
      // ignore corrupted cache
    }
  }

  // Extra 1.5 days of warm-up before `days` so 24h range & 5m baselines are full.
  const now = Date.now()
  const since5m = now - (days + 1.5) * 24 * 60 * 60 * 1000
  const since1d = now - 120 * 24 * 60 * 60 * 1000
  const coin = instId.split('-')[0]

  const klines5m = await fetchPaginatedCandles(instId, '5m', since5m, 35)
  const klines1d = await fetchPaginatedCandles(instId, '1Dutc', since1d, 2)

  await sleep(150)
  const funding = await safeGet(
    () =>
      okxGet<BacktestFundingRow[]>('/public/funding-rate-history', {
        instId,
        limit: 100,
      }),
    [],
  )
  await sleep(250)
  const oi5m = await safeGet(
    () =>
      okxGet<Array<[string, string, string, string]>>(
        '/rubik/stat/contracts/open-interest-history',
        { instId, period: '5m', limit: 100 },
      ),
    [],
  )
  await sleep(250)
  const oi1d = await safeGet(
    () =>
      okxGet<Array<[string, string, string, string]>>(
        '/rubik/stat/contracts/open-interest-history',
        { instId, period: '1D', limit: 100 },
      ),
    [],
  )
  await sleep(250)
  const taker5m = await safeGet(
    () =>
      okxGet<Array<[string, string, string]>>(
        '/rubik/stat/taker-volume-contract',
        { instId, period: '5m', limit: 100 },
      ),
    [],
  )
  await sleep(250)
  const ratio5m = await safeGet(
    () =>
      okxGet<Array<[string, string]>>(
        '/rubik/stat/contracts/long-short-account-ratio',
        { ccy: coin, period: '5m' },
      ),
    [],
  )
  await sleep(250)
  const contractRatio5m = await safeGet(
    () =>
      okxGet<Array<[string, string]>>(
        '/rubik/stat/contracts/long-short-account-ratio-contract',
        { instId, period: '5m' },
      ),
    [],
  )
  await sleep(250)
  const eliteRatio5m = await safeGet(
    () =>
      okxGet<Array<[string, string]>>(
        '/rubik/stat/contracts/long-short-position-ratio-contract-top-trader',
        { instId, period: '5m' },
      ),
    [],
  )

  const data: SymbolHistory = {
    instId,
    klines5m,
    klines1d,
    oi5m,
    oi1d,
    taker5m,
    ratio5m,
    contractRatio5m,
    eliteRatio5m,
    funding,
  }
  writeFileSync(cacheFile, JSON.stringify({ fetchedAt: Date.now(), data }))
  return data
}

const fmtPct = (v: number | null, signed = false) =>
  v === null ? '-' : `${signed && v > 0 ? '+' : ''}${v.toFixed(2)}%`
const fmtRatio = (v: number | null) => (v === null ? '-' : `${v.toFixed(2)}×`)

function printTable(
  title: string,
  rows: Array<{ label: string; stats: GroupStats }>,
) {
  console.log(`\n### ${title}`)
  console.log(
    '| Group | Total | Eval | Cont% | AvgDir | MedDir | MFE | MAE | MFE/MAE |',
  )
  console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
  for (const { label, stats } of rows) {
    console.log(
      `| ${label} | ${stats.total} | ${stats.evaluated} | ${fmtPct(stats.continuationRate)} | ${fmtPct(stats.avgDirectionalRet, true)} | ${fmtPct(stats.medianDirectionalRet, true)} | ${fmtPct(stats.avgMfe)} | ${fmtPct(stats.avgMae)} | ${fmtRatio(stats.mfeMaeRatio)} |`,
    )
  }
}

async function main() {
  const { symbols, days, horizon, out, noCache, lang } = parseArgs(
    process.argv.slice(2),
  )
  const messages = lang === 'en' ? en : zh

  // Always include BTC-USDT-SWAP so beta & daily relative strength have a benchmark.
  const fetchList = symbols.includes('BTC-USDT-SWAP')
    ? symbols
    : ['BTC-USDT-SWAP', ...symbols]

  console.error(
    `Fetching ${days}d historical data for ${fetchList.length} OKX perpetuals...`,
  )
  const histories: SymbolHistory[] = []
  for (const instId of fetchList) {
    process.stderr.write(`  - ${instId} ... `)
    const history = await fetchSymbolHistory(instId, days, noCache)
    console.error(`${history.klines5m.length}×5m bars`)
    histories.push(history)
  }

  const fromTs = Date.now() - days * 24 * 60 * 60 * 1000
  const allSamples = runBacktest(histories, messages, { fromTs })
  const requestedSet = new Set(symbols)
  const samples = allSamples.filter((s) => requestedSet.has(s.instId))
  const report = buildAnalyticsReport(samples, horizon)

  console.log(
    `\n# Signal Backtest Report (${days}d · horizon=${horizon} · ${symbols.length} symbols)`,
  )
  console.log(
    `Samples: ${report.overall.total} (~${report.alertsPerDay ?? 0}/day across ${report.spanDays}d)`,
  )

  printTable('Overall & Tier', [
    { label: 'Overall', stats: report.overall },
    { label: 'Tier: HIGH', stats: report.byTier.high },
    { label: 'Tier: standard', stats: report.byTier.standard },
  ])
  printTable(
    'By Regime',
    report.byRegime.map((r) => ({ label: r.key, stats: r.stats })),
  )
  printTable(
    'By Signal Kind',
    report.byKind.map((r) => ({ label: r.key, stats: r.stats })),
  )
  printTable(
    'By Backdrop Confluence',
    report.byBackdrop.map((r) => ({ label: r.key, stats: r.stats })),
  )
  printTable(
    'By Session (UTC)',
    report.bySession.map((r) => ({ label: r.key, stats: r.stats })),
  )
  printTable(
    'By Symbol',
    report.bySymbol.map((r) => ({ label: r.key, stats: r.stats })),
  )

  if (out) {
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(
      out,
      JSON.stringify(
        {
          generatedAt: Date.now(),
          symbols,
          days,
          horizon,
          report,
          samples,
        },
        null,
        2,
      ),
    )
    console.error(`\nSaved JSON report + ${samples.length} samples to ${out}`)
  }
}

void main()
