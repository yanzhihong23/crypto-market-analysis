import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { en } from '../src/i18n/en'
import {
  baselineOf,
  deviationFrom,
  flagStateOf,
  logBaselineOf,
  logDeviationFrom,
  type Signal,
} from '../src/utils/signals'
import { betaBaselineOf, klineStatsOf } from '../src/utils/klineStats'
import {
  strengthSignal,
  volatilitySignal,
  volumeSignal,
} from '../src/utils/detectors'
import {
  evaluateAlertOutcomes,
  memoryOfFlag,
  shouldEmitAlert,
  summarizeAlertOutcomes,
} from '../src/utils/alertEngine'
import {
  getOkxSeriesChange,
  recordOkxOpenInterest,
  recordOkxPrice,
  removeOkxSeries,
  seedOkxOpenInterestSamples,
  seedOkxPriceSamples,
} from '../src/store/okxRealtimeSeries'
import type { OkxKline } from '../src/types/okx'

const BAR_15M = 15 * 60 * 1000
const BAR_5M = 5 * 60 * 1000

function makeKline({
  ts,
  open = 100,
  high = 101,
  low = 99,
  close = 100,
  volQuote = 1000,
  confirm = '1',
}: {
  ts: number
  open?: number
  high?: number
  low?: number
  close?: number
  volQuote?: number
  confirm?: string
}): OkxKline {
  return [
    String(ts),
    String(open),
    String(high),
    String(low),
    String(close),
    '10',
    '10',
    String(volQuote),
    confirm,
  ]
}

describe('robust baselines and kline stats', () => {
  it('resists single-spike masking via 5% winsorisation', () => {
    const steady = Array.from({ length: 40 }, (_, i) =>
      i % 2 === 0 ? 0.2 : -0.2,
    )
    const withOneSpike = [...steady, 12]
    const base = baselineOf(withOneSpike)
    assert.ok(base)
    // Without winsorisation sigma would be ~1.88, hiding a +1.0 move (<1σ).
    // With 5% winsorisation, +1.0 clearly exceeds 3σ.
    const z = deviationFrom(1.0, base)
    assert.ok(z !== null && z > 3, `expected z > 3, got ${z}`)
  })

  it('falls back to raw stats if winsorisation flattens a quantised series', () => {
    // 95% identical values + 2 non-zero ticks
    const quantised = [...Array.from({ length: 38 }, () => 1), 2, 2]
    const base = baselineOf(quantised)
    assert.ok(base && base.sigma > 0)
  })

  it('excludes newest closed bar from klineStatsOf baselines (no self-contamination)', () => {
    const now = 1_700_000_000_000
    // 30 normal closed bars + 1 huge closed bar at the head (newest first)
    const normal = Array.from({ length: 30 }, (_, i) =>
      makeKline({
        ts: now - (i + 2) * BAR_15M,
        high: 100.5 + (i % 3) * 0.05,
        low: 99.5,
        close: 100,
        volQuote: 1000 + (i % 5) * 40,
      }),
    )
    const giantClosed = makeKline({
      ts: now - BAR_15M,
      high: 106,
      low: 99,
      close: 105,
      volQuote: 6000,
    })

    const stats = klineStatsOf([giantClosed, ...normal])
    assert.ok(
      stats && stats.volume && stats.range && stats.logVolume && stats.logRange,
    )
    // Mean volume must reflect only the normal history (~1080), not the 6000 spike.
    assert.ok(
      stats.volume.mean < 1200,
      `expected mean < 1200, got ${stats.volume.mean}`,
    )

    const volSig = volatilitySignal({ stats }, en)
    const flowSig = volumeSignal({ stats, now }, en)
    assert.ok(volSig, 'expected volatilitySignal to fire on giant closed bar')
    assert.ok(flowSig, 'expected volumeSignal to fire on giant closed bar')
  })

  it('fires volume and volatility immediately on forming bar before 20% elapsed', () => {
    const now = 1_700_000_000_000
    // Forming bar opened only 1 minute ago (6.7% elapsed < 20%)
    const formingOpen = now - 60_000
    const history = Array.from({ length: 30 }, (_, i) =>
      makeKline({
        ts: formingOpen - (i + 1) * BAR_15M,
        high: 100.4 + (i % 3) * 0.05,
        low: 99.6,
        close: 100,
        volQuote: 1000 + (i % 4) * 50,
      }),
    )
    const forming = makeKline({
      ts: formingOpen,
      high: 105,
      low: 99.5,
      close: 104.5,
      volQuote: 5000,
      confirm: '0',
    })

    const stats = klineStatsOf([forming, ...history])
    assert.ok(stats)
    assert.ok(
      volumeSignal({ stats, now }, en),
      'raw forming volume should fire immediately',
    )
    assert.ok(
      volatilitySignal({ stats }, en),
      'forming bar range should fire immediately',
    )
  })

  it('scores log-space deviation accurately on right-skewed series', () => {
    const values = Array.from({ length: 30 }, (_, i) => 1000 + (i % 5) * 60)
    const logBase = logBaselineOf(values)
    assert.ok(logBase)
    const z = logDeviationFrom(4000, logBase)
    assert.ok(z !== null && z > 3)
  })
})

describe('beta-adjusted strength signal', () => {
  it('prevents high-beta alt from false-firing on normal market-proportional moves', () => {
    const baseTs = 1_700_000_000_000
    // Build 40 matched 5m bars where alt moves ~2x BTC plus tiny noise
    const btcCloses = [100]
    const altCloses = [100]
    for (let i = 1; i <= 40; i++) {
      const btcRet = Math.sin(i * 0.7) * 0.5
      const noise = ((i % 3) - 1) * 0.05
      const altRet = 2.0 * btcRet + noise
      btcCloses.push(btcCloses[i - 1] * (1 + btcRet / 100))
      altCloses.push(altCloses[i - 1] * (1 + altRet / 100))
    }

    const toKlines = (closes: number[]) =>
      closes
        .map((close, i) =>
          makeKline({
            ts: baseTs + i * BAR_5M,
            open: close,
            high: close,
            low: close,
            close,
          }),
        )
        .reverse()

    const betaBase = betaBaselineOf(toKlines(altCloses), toKlines(btcCloses))
    assert.ok(betaBase, 'expected correlated series to produce a beta baseline')
    assert.ok(
      betaBase.beta > 1.8 && betaBase.beta < 2.2,
      `expected beta ~2, got ${betaBase.beta}`,
    )

    // Board +1.0%, alt +2.0% -> exact 2x beta move, excess ~0 -> should NOT fire
    const normalFollow = strengthSignal(
      { pricePercent: 2.0, boardPercent: 1.0, betaBaseline: betaBase },
      en,
    )
    assert.equal(normalFollow, null)

    // Board +1.0%, alt +3.5% -> +1.5% true idiosyncratic excess -> SHOULD fire up
    const genuineOutperform = strengthSignal(
      { pricePercent: 3.5, boardPercent: 1.0, betaBaseline: betaBase },
      en,
    )
    assert.ok(genuineOutperform)
    assert.equal(genuineOutperform.direction, 'up')
  })
})

describe('cold-start seeding for 5m buffers', () => {
  it('immediately produces 5m price and OI changes after seeding historical anchors', () => {
    const instId = 'TEST-SEED-SWAP'
    const now = 1_700_000_000_000
    removeOkxSeries(instId)

    seedOkxPriceSamples(instId, [{ ts: now - 5 * 60_000, value: 100 }], now)
    recordOkxPrice(instId, 102, now)

    seedOkxOpenInterestSamples(
      instId,
      [{ ts: now - 5 * 60_000, value: 1000 }],
      now,
    )
    recordOkxOpenInterest(instId, 1030, now)

    const change = getOkxSeriesChange(instId)
    assert.ok(change)
    assert.equal(Number(change.pricePercent?.toFixed(2)), 2)
    assert.equal(Number(change.oiPercent?.toFixed(2)), 3)

    removeOkxSeries(instId)
  })
})

describe('flagStateOf priority, coupling guard, regimes, and tiering', () => {
  it('suppresses mechanically coupled volatility + spread alone', () => {
    const signals: Signal[] = [
      {
        kind: 'volatility',
        deviation: 3.5,
        direction: 'neutral',
        label: 'range',
        detail: 'range',
      },
      {
        kind: 'spread',
        deviation: null,
        direction: 'neutral',
        label: 'spread',
        detail: 'spread',
      },
    ]
    assert.equal(flagStateOf(signals, en), null)
  })

  it('ranks structural liquidation ahead of routine sigma signals and marks high tier', () => {
    const signals: Signal[] = [
      {
        kind: 'momentum',
        deviation: -4.2,
        direction: 'down',
        label: '-2%',
        detail: '5m -2%',
      },
      {
        kind: 'volume',
        deviation: 5.5,
        direction: 'neutral',
        label: '3x',
        detail: 'vol 3x',
      },
      {
        kind: 'liquidation',
        deviation: null,
        direction: 'down',
        label: 'liq',
        detail: 'liq longs',
      },
    ]
    const flag = flagStateOf(signals, en)
    assert.ok(flag)
    assert.equal(flag.tier, 'high')
    assert.equal(flag.regime, 'squeeze-cascade')
    assert.equal(flag.direction, 'down')
    assert.equal(flag.headline, en.headline.longLiquidation)
    // Inside flow family, liquidation (priority 4) must precede volume (priority 1)
    const flowKinds = flag.reasons
      .filter((r) => r.kind === 'liquidation' || r.kind === 'volume')
      .map((r) => r.kind)
    assert.deepEqual(flowKinds, ['liquidation', 'volume'])
  })

  it('elevates a standard ring to high tier when backed by high-conviction backdrop', () => {
    const signals: Signal[] = [
      {
        kind: 'momentum',
        deviation: 3.3,
        direction: 'up',
        label: '+1%',
        detail: '5m +1%',
      },
      {
        kind: 'volume',
        deviation: 3.2,
        direction: 'neutral',
        label: '2x',
        detail: 'vol 2x',
      },
    ]
    const standard = flagStateOf(signals, en, [])
    assert.ok(standard)
    assert.equal(standard.tier, 'standard')

    const amplified = flagStateOf(signals, en, [
      { kind: 'daily-coil', label: '3d coil', detail: '3d coil' },
    ])
    assert.ok(amplified)
    assert.equal(amplified.tier, 'high')
  })
})

describe('escalation cooldown and outcome tracking', () => {
  const makeFlag = (
    overrides: Partial<ReturnType<typeof flagStateOf> & {}> = {},
  ) => ({
    families: ['price', 'flow'] as Array<'price' | 'flow' | 'positioning'>,
    reasons: [
      {
        kind: 'momentum' as const,
        deviation: 3.5,
        direction: 'up' as const,
        label: '+1%',
        detail: '+1%',
      },
      {
        kind: 'volume' as const,
        deviation: 3.5,
        direction: 'neutral' as const,
        label: '2x',
        detail: '2x',
      },
    ],
    headline: 'Move',
    tier: 'standard' as const,
    regime: 'trend-thrust' as const,
    direction: 'up' as const,
    ...overrides,
  })

  it('breaks cooldown on tier upgrade or direction flip after 60s floor', () => {
    const t0 = 1_700_000_000_000
    const initial = makeFlag()
    const memory = memoryOfFlag(initial, t0)

    // Same tier & direction 5 minutes later -> suppressed
    assert.equal(
      shouldEmitAlert(memory, initial, t0 + 5 * 60_000, { wasFlagged: false }),
      false,
    )

    // Escalation within 30s -> suppressed by 60s anti-flap floor
    const upgraded = makeFlag({ tier: 'high' })
    assert.equal(
      shouldEmitAlert(memory, upgraded, t0 + 30_000, { wasFlagged: true }),
      false,
    )

    // Escalation after 2 minutes -> breaks cooldown even if card stayed flagged
    assert.equal(
      shouldEmitAlert(memory, upgraded, t0 + 2 * 60_000, { wasFlagged: true }),
      true,
    )

    // Direction reversal after 2 minutes -> breaks cooldown
    const flipped = makeFlag({ direction: 'down' })
    assert.equal(
      shouldEmitAlert(memory, flipped, t0 + 2 * 60_000, { wasFlagged: true }),
      true,
    )
  })

  it('tracks +5m/+15m outcomes and summarizes directional continuation', () => {
    const t0 = 1_700_000_000_000
    const alerts = [
      {
        id: 'a1',
        instId: 'BTC-USDT-SWAP',
        at: t0,
        direction: 'up' as const,
        triggerPrice: 100,
      },
      {
        id: 'a2',
        instId: 'ETH-USDT-SWAP',
        at: t0,
        direction: 'down' as const,
        triggerPrice: 100,
      },
      {
        id: 'a3',
        instId: 'SOL-USDT-SWAP',
        at: t0,
        direction: 'up' as const,
        triggerPrice: 100,
      },
    ]
    const prices: Record<string, number> = {
      'BTC-USDT-SWAP': 102,
      'ETH-USDT-SWAP': 97,
      'SOL-USDT-SWAP': 99,
    }
    const updates5m = evaluateAlertOutcomes(
      alerts,
      (id) => prices[id],
      t0 + 6 * 60_000,
    )
    assert.equal(updates5m.a1.m5, 2)
    assert.equal(updates5m.a2.m5, -3)

    const withM15 = alerts.map((alert) => ({
      ...alert,
      outcomes: evaluateAlertOutcomes(
        [alert],
        (id) => prices[id],
        t0 + 16 * 60_000,
      )[alert.id],
    }))
    const summary = summarizeAlertOutcomes(withM15)
    assert.ok(summary)
    assert.equal(summary.count, 3)
    // BTC (+2 up -> hit), ETH (-3 down -> hit), SOL (-1 up -> miss) => 67%
    assert.equal(summary.hitRate, 67)
    // Directional returns: +2, +3, -1 => avg +1.33%
    assert.equal(Number(summary.avgDirectionalMove.toFixed(2)), 1.33)
  })
})
