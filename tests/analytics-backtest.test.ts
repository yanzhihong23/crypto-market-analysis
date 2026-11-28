import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { en } from '../src/i18n/en'
import type { OkxKline } from '../src/types/okx'
import {
  buildAnalyticsReport,
  computeOutcomesFromKlines,
  samplesToCsv,
  type SignalSample,
} from '../src/utils/signalAnalytics'
import { runBacktest } from '../src/utils/signalBacktest'
import {
  clearJournal,
  getAllJournalSamples,
  putJournalSamples,
  updateJournalOutcomes,
} from '../src/store/signalJournalDb'

const BAR_5M = 5 * 60 * 1000

function make5m(
  openTs: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volQuote = 1000,
): OkxKline {
  return [
    String(openTs),
    String(open),
    String(high),
    String(low),
    String(close),
    '10',
    '10',
    String(volQuote),
    '1',
  ]
}

describe('signalAnalytics MFE/MAE and multi-dimensional report', () => {
  it('computes exact ret, MFE and MAE for up and down signals and skips incomplete horizons', () => {
    const t0 = 1_700_000_000_000
    // Three 5m bars covering [t0, t0 + 15m]:
    // bar1: dips to 98 (-2%), closes 101
    // bar2: spikes to 105 (+5%), closes 103
    // bar3: closes 102 (+2%)
    const klines: OkxKline[] = [
      make5m(t0, 100, 101.5, 98, 101),
      make5m(t0 + BAR_5M, 101, 105, 100.5, 103),
      make5m(t0 + 2 * BAR_5M, 103, 103.5, 101.5, 102),
    ]

    const upOutcomes = computeOutcomesFromKlines(
      { at: t0, triggerPrice: 100, direction: 'up' },
      klines,
      t0 + 20 * 60_000,
    )
    assert.deepEqual(upOutcomes.m5, { ret: 1, mfe: 1.5, mae: 2 })
    assert.deepEqual(upOutcomes.m15, { ret: 2, mfe: 5, mae: 2 })
    // Only 15m of bars exist -> h1 and h4 must stay undefined
    assert.equal(upOutcomes.h1, undefined)
    assert.equal(upOutcomes.h4, undefined)

    // Same price path for a bearish ('down') signal flips MFE and MAE
    const downOutcomes = computeOutcomesFromKlines(
      { at: t0, triggerPrice: 100, direction: 'down' },
      klines,
      t0 + 20 * 60_000,
    )
    assert.deepEqual(downOutcomes.m15, { ret: 2, mfe: 2, mae: 5 })
  })

  it('aggregates tier lift, regimes, backdrop, session, distribution, and CSV export', () => {
    const asiaTs = Date.UTC(2026, 0, 10, 3, 0)
    const usTs = Date.UTC(2026, 0, 11, 18, 0)
    const samples: SignalSample[] = [
      {
        id: 's1',
        instId: 'BTC-USDT-SWAP',
        at: asiaTs,
        headline: 'Confirmed breakout',
        tier: 'high',
        regime: 'confirmed-breakout',
        direction: 'up',
        families: ['price', 'flow'],
        kinds: ['range-break', 'volume'],
        backdropKinds: ['daily-coil'],
        reasons: [],
        triggerPrice: 100,
        source: 'live',
        outcomes: { m15: { ret: 2.0, mfe: 3.0, mae: 0.5 } },
      },
      {
        id: 's2',
        instId: 'ETH-USDT-SWAP',
        at: usTs,
        headline: 'Trend thrust',
        tier: 'standard',
        regime: 'trend-thrust',
        direction: 'down',
        families: ['price', 'flow'],
        kinds: ['momentum', 'volume'],
        backdropKinds: [],
        reasons: [],
        triggerPrice: 200,
        source: 'backtest',
        outcomes: { m15: { ret: 1.0, mfe: 0.5, mae: 1.5 } },
      },
    ]

    const report = buildAnalyticsReport(samples, 'm15')
    assert.equal(report.overall.total, 2)
    assert.equal(report.overall.continuationRate, 50)
    // Directional returns: +2.0 (up hit) and -1.0 (down miss) -> avg +0.5%
    assert.equal(report.overall.avgDirectionalRet, 0.5)
    assert.equal(report.byTier.high.continuationRate, 100)
    assert.equal(report.byTier.standard.continuationRate, 0)
    assert.equal(report.byBackdrop.length, 2)
    assert.equal(report.bySession.length, 2)

    const csv = samplesToCsv(samples)
    assert.ok(csv.startsWith('id,time_utc,instId,'))
    assert.ok(csv.includes('BTC-USDT-SWAP'))
    assert.ok(csv.includes('daily-coil'))
  })
})

describe('causal offline backtester', () => {
  it('triggers on a genuine breakout + volume surge without look-ahead and records future outcomes', () => {
    const startTs = Date.UTC(2026, 0, 1, 0, 0)
    // Build 420 five-minute bars (35 hours): quiet oscillation, then a sharp breakout + volume spike at bar 380,
    // followed by +3% continuation over the next 3 bars (15m).
    const klines5m: OkxKline[] = []
    for (let i = 0; i < 420; i++) {
      const ts = startTs + i * BAR_5M
      if (i < 380) {
        const base = 100 + Math.sin(i * 0.4) * 0.4
        const vol = 1000 + (i % 5) * 40
        klines5m.push(make5m(ts, base, base + 0.15, base - 0.15, base, vol))
      } else if (i === 380) {
        // Sudden +2.5% 5m jump with 12x quote volume
        klines5m.push(make5m(ts, 100.2, 103.0, 100.2, 102.8, 12000))
      } else {
        // Post-signal drift higher to ~105.5
        const step = Math.min(i - 380, 10)
        const px = 102.8 + step * 0.4
        klines5m.push(make5m(ts, px - 0.1, px + 0.3, px - 0.2, px, 1500))
      }
    }

    const fromTs = startTs + 360 * BAR_5M
    const samples = runBacktest([{ instId: 'SOL-USDT-SWAP', klines5m }], en, {
      fromTs,
    })

    assert.ok(samples.length >= 1, 'expected at least one backtest sample')
    const hit = samples.find(
      (s) => s.at === startTs + 381 * BAR_5M && s.direction === 'up',
    )
    assert.ok(hit, 'expected alert right at the close of spike bar 380')
    assert.ok(hit.outcomes?.m15, 'expected +15m outcome to be computed')
    assert.ok(
      hit.outcomes!.m15!.ret > 0.5,
      `expected positive 15m follow-through, got ${hit.outcomes!.m15!.ret}`,
    )
    assert.ok(hit.outcomes!.m15!.mfe >= hit.outcomes!.m15!.ret)
  })
})

describe('signalJournalDb fallback persistence', () => {
  it('stores, updates outcomes, filters clear by source, and retrieves newest-first', async () => {
    await clearJournal()
    const base: Omit<SignalSample, 'id' | 'at' | 'source'> = {
      instId: 'BTC-USDT-SWAP',
      headline: 'Move',
      tier: 'high',
      regime: 'confirmed-breakout',
      direction: 'up',
      families: ['price', 'flow'],
      kinds: ['momentum', 'volume'],
      backdropKinds: [],
      reasons: [],
      triggerPrice: 50000,
    }
    await putJournalSamples([
      { ...base, id: 'live-1', at: 1000, source: 'live' },
      { ...base, id: 'bt-1', at: 2000, source: 'backtest' },
    ])

    await updateJournalOutcomes({
      'live-1': { m15: { ret: 1.5, mfe: 2.1, mae: 0.3 } },
    })

    const all = await getAllJournalSamples()
    assert.equal(all.length, 2)
    assert.equal(all[0].id, 'bt-1')
    assert.deepEqual(all[1].outcomes?.m15, { ret: 1.5, mfe: 2.1, mae: 0.3 })

    await clearJournal('backtest')
    const remaining = await getAllJournalSamples()
    assert.equal(remaining.length, 1)
    assert.equal(remaining[0].id, 'live-1')

    await clearJournal()
  })
})
