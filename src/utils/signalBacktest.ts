import type { Messages } from '../i18n/en'
import type { OkxKline } from '../types/okx'

import {
  DEFAULT_COOLDOWN_MS,
  DEFAULT_ESCALATION_FLOOR_MS,
  memoryOfFlag,
  shouldEmitAlert,
  type AlertMemory,
} from './alertEngine'
import { collectBackdrop } from './backdrop'
import { collectSignals } from './detectors'
import { fundingCarryOf } from './funding'
import {
  barReturnsOf,
  betaBaselineOf,
  coilOf,
  dailyStatsOf,
  type BetaBaseline,
  type Coil,
  type DailyStats,
} from './klineStats'
import { oiPercentileOf } from './openInterest'
import { computeOutcomesFromKlines, type SignalSample } from './signalAnalytics'
import {
  MIN_BOARD_SYMBOLS,
  baselineOf,
  deviationFrom,
  flagStateOf,
  medianOf,
  type Baseline,
} from './signals'

const BAR_5M_MS = 5 * 60 * 1000
const BAR_15M_MS = 15 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const BENCHMARK_INST_ID = 'BTC-USDT-SWAP'
const BASELINE_REFRESH_BARS = 6 // 30 minutes
const LOOKBACK_BARS = 100
const DAY_BARS_5M = 288

export interface BacktestFundingRow {
  fundingTime: string
  fundingRate: string
  realizedRate?: string
}

export interface SymbolHistory {
  instId: string
  /** 5m candles, any order; sorted oldest-first internally. */
  klines5m: OkxKline[]
  /** 15m candles (optional — synthesized from 5m if omitted). */
  klines15m?: OkxKline[]
  /** Daily candles (`1Dutc`). */
  klines1d?: OkxKline[]
  /** 5m open interest `[ts, oi, oiCcy, oiUsd]`. */
  oi5m?: Array<[string, string, string, string]>
  /** 1D open interest `[ts, oi, oiCcy, oiUsd]`. */
  oi1d?: Array<[string, string, string, string]>
  /** 5m taker volume `[ts, sellVol, buyVol]`. */
  taker5m?: Array<[string, string, string]>
  /** 5m account long/short ratio `[ts, ratio]`. */
  ratio5m?: Array<[string, string]>
  /** 5m contract account ratio `[ts, ratio]`. */
  contractRatio5m?: Array<[string, string]>
  /** 5m top trader position ratio `[ts, ratio]`. */
  eliteRatio5m?: Array<[string, string]>
  /** Historical funding settlements. */
  funding?: BacktestFundingRow[]
}

export interface BacktestOptions {
  /** Only record alerts strictly at or after this epoch ms (warm-up before). */
  fromTs?: number
  /** Stop evaluating at this epoch ms. */
  toTs?: number
  cooldownMs?: number
  escalationFloorMs?: number
}

const sortAscByTs = <T extends [string, ...unknown[]]>(rows?: T[]): T[] =>
  [...(rows ?? [])].sort((a, b) => Number(a[0]) - Number(b[0]))

/** Binary search: index of last row whose numeric ts <= target, or -1. */
function lastIndexAtOrBefore(timestamps: number[], target: number) {
  let lo = 0
  let hi = timestamps.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (timestamps[mid] <= target) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

/** Synthesizes 15m bars strictly from closed 5m bars when 15m history is absent. */
function aggregate15mFrom5m(klines5mAsc: OkxKline[]): OkxKline[] {
  const buckets = new Map<number, OkxKline[]>()
  for (const bar of klines5mAsc) {
    const ts = Number(bar[0])
    const start15 = Math.floor(ts / BAR_15M_MS) * BAR_15M_MS
    const list = buckets.get(start15)
    if (list) list.push(bar)
    else buckets.set(start15, [bar])
  }

  const out: OkxKline[] = []
  for (const [start15, bars] of [...buckets.entries()].sort(
    (a, b) => a[0] - b[0],
  )) {
    if (bars.length < 3) continue
    const open = bars[0][1]
    const close = bars[bars.length - 1][4]
    let high = -Infinity
    let low = Infinity
    let vol = 0
    let volCcy = 0
    let volQuote = 0
    for (const bar of bars) {
      high = Math.max(high, Number(bar[2]))
      low = Math.min(low, Number(bar[3]))
      vol += Number(bar[5])
      volCcy += Number(bar[6])
      volQuote += Number(bar[7])
    }
    out.push([
      String(start15),
      open,
      String(high),
      String(low),
      close,
      String(vol),
      String(volCcy),
      String(volQuote),
      '1',
    ])
  }
  return out
}

/** Builds a forming 15m bar at timestamp `t` using only 5m bars closed <= `t`. */
function forming15mAt(
  klines5mAsc: OkxKline[],
  endIdx5m: number,
  t: number,
): OkxKline | null {
  const start15 = Math.floor((t - 1) / BAR_15M_MS) * BAR_15M_MS
  // Exact 15m boundary means the bar just closed rather than still forming.
  if (t - start15 >= BAR_15M_MS) return null

  const bars: OkxKline[] = []
  for (let i = endIdx5m; i >= 0; i--) {
    const openTs = Number(klines5mAsc[i][0])
    if (openTs < start15) break
    bars.push(klines5mAsc[i])
  }
  if (!bars.length) return null
  bars.reverse()

  let high = -Infinity
  let low = Infinity
  let vol = 0
  let volCcy = 0
  let volQuote = 0
  for (const bar of bars) {
    high = Math.max(high, Number(bar[2]))
    low = Math.min(low, Number(bar[3]))
    vol += Number(bar[5])
    volCcy += Number(bar[6])
    volQuote += Number(bar[7])
  }
  return [
    String(start15),
    bars[0][1],
    String(high),
    String(low),
    bars[bars.length - 1][4],
    String(vol),
    String(volCcy),
    String(volQuote),
    '0',
  ]
}

interface PreparedSymbol {
  instId: string
  k5: OkxKline[]
  k5CloseTs: number[]
  k5IndexByCloseTs: Map<number, number>
  k15: OkxKline[]
  k15CloseTs: number[]
  k1d: OkxKline[]
  k1dCloseTs: number[]
  oi5m: Array<[string, string, string, string]>
  oi5mTs: number[]
  oi1d: Array<[string, string, string, string]>
  oi1dTs: number[]
  taker5m: Array<[string, string, string]>
  taker5mTs: number[]
  ratio5m: Array<[string, string]>
  ratio5mTs: number[]
  divGaps: Array<{ ts: number; gap: number }>
  divTs: number[]
  funding: BacktestFundingRow[]
  fundingTs: number[]
}

function prepareSymbol(raw: SymbolHistory): PreparedSymbol {
  const k5 = sortAscByTs(raw.klines5m.filter((bar) => bar[8] === '1'))
  const k5CloseTs = k5.map((bar) => Number(bar[0]) + BAR_5M_MS)
  const k5IndexByCloseTs = new Map<number, number>()
  k5CloseTs.forEach((ts, idx) => k5IndexByCloseTs.set(ts, idx))

  const k15 = raw.klines15m?.length
    ? sortAscByTs(raw.klines15m.filter((bar) => bar[8] === '1'))
    : aggregate15mFrom5m(k5)
  const k15CloseTs = k15.map((bar) => Number(bar[0]) + BAR_15M_MS)

  const k1d = sortAscByTs((raw.klines1d ?? []).filter((bar) => bar[8] === '1'))
  const k1dCloseTs = k1d.map((bar) => Number(bar[0]) + DAY_MS)

  const oi5m = sortAscByTs(raw.oi5m)
  const oi5mTs = oi5m.map((row) => Number(row[0]))

  const oi1d = sortAscByTs(raw.oi1d)
  const oi1dTs = oi1d.map((row) => Number(row[0]))

  const taker5m = sortAscByTs(raw.taker5m)
  const taker5mTs = taker5m.map((row) => Number(row[0]))

  const ratio5m = sortAscByTs(raw.ratio5m)
  const ratio5mTs = ratio5m.map((row) => Number(row[0]))

  const eliteMap = new Map(
    (raw.eliteRatio5m ?? []).map(([ts, val]) => [ts, Number(val)]),
  )
  const divGaps: Array<{ ts: number; gap: number }> = []
  for (const [ts, crowdStr] of sortAscByTs(raw.contractRatio5m)) {
    const crowd = Number(crowdStr)
    const elite = eliteMap.get(ts)
    if (crowd > 0 && elite && elite > 0) {
      divGaps.push({ ts: Number(ts), gap: Math.log(elite) - Math.log(crowd) })
    }
  }
  const divTs = divGaps.map((row) => row.ts)

  const funding = [...(raw.funding ?? [])].sort(
    (a, b) => Number(a.fundingTime) - Number(b.fundingTime),
  )
  const fundingTs = funding.map((row) => Number(row.fundingTime))

  return {
    instId: raw.instId,
    k5,
    k5CloseTs,
    k5IndexByCloseTs,
    k15,
    k15CloseTs,
    k1d,
    k1dCloseTs,
    oi5m,
    oi5mTs,
    oi1d,
    oi1dTs,
    taker5m,
    taker5mTs,
    ratio5m,
    ratio5mTs,
    divGaps,
    divTs,
    funding,
    fundingTs,
  }
}

/**
 * Strictly causal historical replay of the board's exact `collectSignals` +
 * `collectBackdrop` + `flagStateOf` + `shouldEmitAlert` pipeline over 5m steps.
 * Returns `SignalSample[]` stamped with realized +5m/+15m/+1h/+4h outcomes and
 * MFE/MAE from subsequent 5m candles.
 */
export function runBacktest(
  histories: SymbolHistory[],
  t: Messages,
  options: BacktestOptions = {},
): SignalSample[] {
  const prepared = histories.map(prepareSymbol).filter((s) => s.k5.length > 30)
  if (!prepared.length) return []

  const benchmark = prepared.find((s) => s.instId === BENCHMARK_INST_ID) ?? null

  // Collect unified sorted 5m close timeline across all symbols.
  const timelineSet = new Set<number>()
  let maxTimelineTs = 0
  for (const sym of prepared) {
    for (const ts of sym.k5CloseTs) {
      timelineSet.add(ts)
      if (ts > maxTimelineTs) maxTimelineTs = ts
    }
  }
  const timeline = [...timelineSet].sort((a, b) => a - b)

  // Per-symbol cached slow baselines (refreshed every 30m like live pollers).
  const cache = new Map<
    string,
    {
      step: number
      momentum: Baseline | null
      coil: Coil | null
      beta: BetaBaseline | null
      dailyIdx: number
      daily: DailyStats | null
      oiPct: number | null
      fundingIdx: number
      fundingBase: Baseline | null
      fundingShiftBase: Baseline | null
      fundingPrev?: string
      fundingCarry: number | null
      wasFlagged: boolean
      lastAlert?: AlertMemory
    }
  >()
  for (const sym of prepared) {
    cache.set(sym.instId, {
      step: -BASELINE_REFRESH_BARS,
      momentum: null,
      coil: null,
      beta: null,
      dailyIdx: -2,
      daily: null,
      oiPct: null,
      fundingIdx: -2,
      fundingBase: null,
      fundingShiftBase: null,
      fundingCarry: null,
      wasFlagged: false,
    })
  }

  const samples: SignalSample[] = []
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS
  const escalationFloorMs =
    options.escalationFloorMs ?? DEFAULT_ESCALATION_FLOOR_MS

  for (let step = 0; step < timeline.length; step++) {
    const now = timeline[step]
    if (options.toTs !== undefined && now > options.toTs) break

    // 1. Compute 5m price returns across the board at `now` for peer median.
    const priceReturnAtStep = new Map<string, number>()
    for (const sym of prepared) {
      const idx = sym.k5IndexByCloseTs.get(now)
      if (idx === undefined || idx < 1) continue
      const close = Number(sym.k5[idx][4])
      const prev = Number(sym.k5[idx - 1][4])
      if (close > 0 && prev > 0) {
        priceReturnAtStep.set(sym.instId, ((close - prev) / prev) * 100)
      }
    }
    const allRets = [...priceReturnAtStep.values()]
    const boardPercent =
      allRets.length >= MIN_BOARD_SYMBOLS ? medianOf(allRets) : null

    // Benchmark daily stats at `now` (for relative strength backdrop).
    let benchmarkDaily: DailyStats | null = null
    if (benchmark) {
      const bDayIdx = lastIndexAtOrBefore(benchmark.k1dCloseTs, now)
      if (bDayIdx >= 30) {
        const bCache = cache.get(benchmark.instId)!
        if (bCache.dailyIdx !== bDayIdx) {
          bCache.daily = dailyStatsOf(
            benchmark.k1d.slice(0, bDayIdx + 1).reverse(),
          )
          bCache.dailyIdx = bDayIdx
        }
        benchmarkDaily = bCache.daily
      }
    }

    // Benchmark 5m slice for beta estimation.
    const benchIdx5m = benchmark
      ? lastIndexAtOrBefore(benchmark.k5CloseTs, now)
      : -1
    const benchSlice5mNewest =
      benchmark && benchIdx5m >= 25
        ? benchmark.k5
            .slice(Math.max(0, benchIdx5m - LOOKBACK_BARS), benchIdx5m)
            .reverse()
        : null

    // 2. Evaluate each symbol strictly using data <= `now`.
    for (const sym of prepared) {
      const idx5 = sym.k5IndexByCloseTs.get(now)
      if (idx5 === undefined || idx5 < 25) continue

      const c = cache.get(sym.instId)!
      const bar5 = sym.k5[idx5]
      const last = Number(bar5[4])
      const pricePercent = priceReturnAtStep.get(sym.instId) ?? null

      // Refresh 5m momentum baseline, coil, and beta every 30m strictly from bars BEFORE idx5.
      if (step - c.step >= BASELINE_REFRESH_BARS) {
        const hist5Newest = sym.k5
          .slice(Math.max(0, idx5 - LOOKBACK_BARS), idx5)
          .reverse()
        c.momentum = baselineOf(barReturnsOf(hist5Newest))
        c.coil = coilOf(hist5Newest)
        c.beta =
          sym.instId !== BENCHMARK_INST_ID && benchSlice5mNewest
            ? betaBaselineOf(hist5Newest, benchSlice5mNewest)
            : null
        c.step = step
      }

      // Daily stats + OI percentile (recomputed only when a new daily bar closes).
      const dIdx = lastIndexAtOrBefore(sym.k1dCloseTs, now)
      if (dIdx !== c.dailyIdx) {
        c.daily =
          dIdx >= 30 ? dailyStatsOf(sym.k1d.slice(0, dIdx + 1).reverse()) : null
        const oiDayIdx = lastIndexAtOrBefore(sym.oi1dTs, now)
        c.oiPct =
          oiDayIdx >= 29
            ? oiPercentileOf(
                sym.oi1d
                  .slice(Math.max(0, oiDayIdx - 99), oiDayIdx + 1)
                  .reverse(),
              )
            : null
        c.dailyIdx = dIdx
      }

      // Skip emitting during warm-up window, but still maintain rolling state.
      const inEvalWindow = options.fromTs === undefined || now >= options.fromTs
      if (!inEvalWindow) continue

      // 24h rolling high/low from last 288 5m bars ending at idx5.
      let high24h = -Infinity
      let low24h = Infinity
      const start24 = Math.max(0, idx5 - DAY_BARS_5M + 1)
      for (let i = start24; i <= idx5; i++) {
        const h = Number(sym.k5[i][2])
        const l = Number(sym.k5[i][3])
        if (h > high24h) high24h = h
        if (l < low24h) low24h = l
      }

      // 15m klines slice (newest first) + optional forming bar strictly <= now.
      const idx15 = lastIndexAtOrBefore(sym.k15CloseTs, now)
      const closed15Newest =
        idx15 >= 0
          ? sym.k15
              .slice(Math.max(0, idx15 - LOOKBACK_BARS + 1), idx15 + 1)
              .reverse()
          : []
      const forming15 = forming15mAt(sym.k5, idx5, now)
      const klines15Newest = forming15
        ? [forming15, ...closed15Newest]
        : closed15Newest

      // 5m OI change & baseline.
      let oiPercent: number | null = null
      let oiChangeBaseline: Baseline | null = null
      let openInterest: number | null = null
      const oiIdx = lastIndexAtOrBefore(sym.oi5mTs, now)
      if (oiIdx >= 20) {
        const currOi = Number(sym.oi5m[oiIdx][1])
        const prevOi = Number(sym.oi5m[oiIdx - 1][1])
        openInterest = currOi
        if (currOi > 0 && prevOi > 0) {
          oiPercent = ((currOi - prevOi) / prevOi) * 100
        }
        const oiStart = Math.max(1, oiIdx - LOOKBACK_BARS)
        const changes: number[] = []
        for (let i = oiStart; i < oiIdx; i++) {
          const cur = Number(sym.oi5m[i][1])
          const prv = Number(sym.oi5m[i - 1][1])
          if (cur > 0 && prv > 0) changes.push(((cur - prv) / prv) * 100)
        }
        oiChangeBaseline = baselineOf(changes)
      }

      // 5m taker flow imbalance & deviation.
      let takerImbalance: number | null = null
      let takerDeviation: number | null = null
      const takerIdx = lastIndexAtOrBefore(sym.taker5mTs, now)
      if (takerIdx >= 20) {
        const imb = (row: [string, string, string]) => {
          const sell = Number(row[1])
          const buy = Number(row[2])
          const tot = sell + buy
          return tot > 0 ? (buy - sell) / tot : NaN
        }
        const cur = imb(sym.taker5m[takerIdx])
        if (Number.isFinite(cur)) {
          takerImbalance = cur
          const hist = sym.taker5m
            .slice(Math.max(0, takerIdx - LOOKBACK_BARS), takerIdx)
            .map(imb)
          takerDeviation = deviationFrom(cur, baselineOf(hist))
        }
      }

      // 5m account ratio deviation.
      let ratioDeviation: number | null = null
      const rIdx = lastIndexAtOrBefore(sym.ratio5mTs, now)
      if (rIdx >= 20) {
        const cur = Number(sym.ratio5m[rIdx][1])
        const hist = sym.ratio5m
          .slice(Math.max(0, rIdx - LOOKBACK_BARS), rIdx)
          .map((row) => Number(row[1]))
        ratioDeviation = deviationFrom(cur, baselineOf(hist))
      }

      // 5m elite-crowd divergence deviation.
      let divergenceDeviation: number | null = null
      const dGapIdx = lastIndexAtOrBefore(sym.divTs, now)
      if (dGapIdx >= 20) {
        const cur = sym.divGaps[dGapIdx].gap
        const hist = sym.divGaps
          .slice(Math.max(0, dGapIdx - LOOKBACK_BARS), dGapIdx)
          .map((row) => row.gap)
        divergenceDeviation = deviationFrom(cur, baselineOf(hist))
      }

      // Funding rate & shift baselines.
      const fIdx = lastIndexAtOrBefore(sym.fundingTs, now)
      if (fIdx !== c.fundingIdx && fIdx >= 20) {
        const sliceNewest = sym.funding
          .slice(Math.max(0, fIdx - LOOKBACK_BARS), fIdx + 1)
          .reverse()
        const rates = sliceNewest.map(
          (row) => Number(row.realizedRate || row.fundingRate) * 10000,
        )
        const historyRates = rates.slice(1)
        const steps = historyRates
          .slice(0, -1)
          .map((rate, i) => rate - historyRates[i + 1])
        c.fundingBase = baselineOf(historyRates)
        c.fundingShiftBase = baselineOf(steps)
        c.fundingPrev = historyRates[0]?.toFixed(1)
        c.fundingCarry = fundingCarryOf(
          sliceNewest.map((row) => ({
            fundingTime: row.fundingTime,
            fundingRate: row.fundingRate,
            realizedRate: row.realizedRate ?? '',
          })),
        )
        c.fundingIdx = fIdx
      }
      const fundingRate =
        fIdx >= 0
          ? (
              Number(
                sym.funding[fIdx].realizedRate || sym.funding[fIdx].fundingRate,
              ) * 10000
            ).toFixed(1)
          : undefined

      const signals = collectSignals(
        {
          last,
          high24h,
          low24h,
          klines: klines15Newest,
          pricePercent,
          oiPercent,
          openInterest,
          boardPercent,
          momentumBaseline: c.momentum,
          betaBaseline: c.beta,
          coil: c.coil,
          daily: c.daily,
          oiChangeBaseline,
          ratioDeviation,
          divergenceDeviation,
          takerImbalance,
          takerDeviation,
          fundingRate,
          fundingBaseline: c.fundingBase,
          fundingShiftBaseline: c.fundingShiftBase,
          fundingPrev: c.fundingPrev,
          now,
        },
        t,
      )

      const backdrop = collectBackdrop(
        {
          last,
          daily: c.daily,
          oiPercentile: c.oiPct,
          fundingCarry: c.fundingCarry,
          benchmark: benchmarkDaily,
        },
        t,
      )

      const flag = flagStateOf(signals, t, backdrop.readings)
      const was = c.wasFlagged
      c.wasFlagged = flag !== null

      if (!flag) continue
      if (
        !shouldEmitAlert(c.lastAlert, flag, now, {
          wasFlagged: was,
          cooldownMs,
          escalationFloorMs,
        })
      ) {
        continue
      }

      c.lastAlert = memoryOfFlag(flag, now)

      const sample: SignalSample = {
        id: `bt-${sym.instId}-${now}`,
        instId: sym.instId,
        at: now,
        headline: flag.headline,
        tier: flag.tier,
        regime: flag.regime,
        direction: flag.direction,
        families: flag.families,
        kinds: flag.reasons.map((r) => r.kind),
        backdropKinds: backdrop.readings.map((r) => r.kind),
        reasons: flag.reasons.map((r) => ({
          kind: r.kind,
          label: r.label,
          detail: r.detail,
          deviation: r.deviation,
        })),
        context: backdrop.readings.map((r) => ({
          kind: r.kind,
          label: r.label,
          detail: r.detail,
        })),
        triggerPrice: last,
        source: 'backtest',
      }

      // Compute exact outcomes from the symbol's subsequent 5m candles.
      const futureWindow = sym.k5.slice(idx5 + 1, idx5 + 52)
      sample.outcomes = computeOutcomesFromKlines(
        sample,
        futureWindow,
        maxTimelineTs,
        BAR_5M_MS,
      )

      samples.push(sample)
    }
  }

  return samples
}
