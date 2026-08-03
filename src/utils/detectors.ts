/**
 * One function per reading the board watches. Each takes what it can see and
 * either returns a signal or returns nothing, and none of them knows what the
 * others found — the rule that weighs them against each other lives in
 * `signals.ts`, so the card's ring and the alert can never disagree about what
 * they are reporting.
 *
 * Each detector also writes its own sentence. The tooltip that explains a chip
 * and the line in the alert list are the same sentence, and a stored alert has
 * to still read correctly long after the series behind it has rolled off.
 *
 * A detector formats its own numbers and hands them to the dictionary, which
 * decides where in the sentence they go. That split is what makes a language
 * that puts the direction in front of the number possible without the detector
 * knowing anything about it.
 */

import { OkxKline } from '../types/okx'
import type { Messages } from '../i18n/en'

import {
  MIN_SHORT_OI_PERCENT,
  describeSqueeze,
  squeezeRead,
} from './openInterest'
import {
  Baseline,
  Signal,
  deviationFrom,
  formatDeviation,
  formatSigmas,
  isAnomalous,
  isAnomalousChange,
} from './signals'
import {
  KlineStats,
  barRangePercent,
  klineStatsOf,
  projectedVolume,
} from './klineStats'

const formatPercent = (value: number, digits = 2) =>
  `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`

/**
 * A five-minute move under this is noise whatever its own history says. Without
 * it a coin that has not moved in three hours reports three sigma off a single
 * tick, and the quiet end of the board takes every slot in the alert list.
 */
const MIN_MOVE_PERCENT = 0.3

/**
 * How much of its usual a flow reading has to be, on top of clearing three
 * sigma. An instrument whose volume is metronomic has a sigma small enough that
 * three of them is a ten percent uptick, which is not what anyone means by a
 * surge; asking for half again as much puts a floor on it that scales with the
 * instrument instead of with the dollar.
 */
const SURGE_MULTIPLE = 1.5

/** How much of a bar has to be shadow before the bar is a rejection. */
const WICK_SHARE = 0.6

/**
 * A 24h range narrower than this makes its own high meaningless: a symbol that
 * has traded in a tenth of a percent all day prints a new high every few
 * minutes, and none of them is news.
 */
const MIN_BREAKOUT_RANGE_PERCENT = 0.5

/**
 * Distance from spot that stops being microstructure. Unlike every other
 * reading here this one is a fixed band, and it earns it: arbitrage pins a
 * perpetual to its index, so the gap has a real zero and the same number of
 * basis points means the same thing on BTC as on anything else. A per-instrument
 * baseline would also need a history of a series nothing on this board keeps.
 */
const MAX_BASIS_PERCENT = 0.15

/** In the unit the card shows funding in, so a shift reads off the same scale. */
const MIN_FUNDING_SHIFT = 1

/**
 * The five-minute move, against the spread of this instrument's own five-minute
 * moves. Measured off the live buffer rather than a candle so it lands within
 * seconds of the move instead of at the end of the bar containing it.
 */
export function momentumSignal(
  {
    pricePercent,
    baseline,
  }: {
    pricePercent?: number | null
    baseline?: Baseline | null
  },
  t: Messages,
): Signal | null {
  if (pricePercent == null) return null
  const deviation = deviationFrom(pricePercent, baseline)
  if (!isAnomalousChange(deviation, pricePercent, MIN_MOVE_PERCENT)) return null

  const move = formatPercent(pricePercent)
  return {
    kind: 'momentum',
    deviation,
    label: t.signal.momentum(move),
    detail: t.signal.momentumDetail(move, formatSigmas(deviation!, t)),
  }
}

/**
 * The bar got taller than this instrument's bars get. It says nothing about
 * direction, which is the point: a range expanding is the first thing that
 * happens when something is about to matter, and it happens before the move
 * settles on a side.
 *
 * Only ever an expansion. A bar three sigma *narrower* than usual is a quiet
 * afternoon, and the board has no use for being told about one.
 */
export function volatilitySignal(
  {
    stats,
  }: {
    stats?: KlineStats | null
  },
  t: Messages,
): Signal | null {
  if (!stats?.closed || !stats.range) return null

  const range = barRangePercent(stats.closed)
  if (range === null) return null

  const deviation = deviationFrom(range, stats.range)
  if (!isAnomalous(deviation) || deviation! < 0) return null
  if (range < stats.range.mean * SURGE_MULTIPLE) return null

  const rangeLabel = `${range.toFixed(2)}%`
  return {
    kind: 'volatility',
    deviation,
    label: t.signal.volatility(rangeLabel),
    detail: t.signal.volatilityDetail(rangeLabel, formatSigmas(deviation!, t)),
  }
}

/**
 * At the edge of the day's range. No baseline and no sigma: this is a fact about
 * where the price is, not a distance from anywhere, and dressing it up as one
 * would invent a number.
 */
export function breakoutSignal(
  {
    last,
    high24h,
    low24h,
  }: {
    last: number
    high24h: number
    low24h: number
  },
  t: Messages,
): Signal | null {
  if (!(last > 0) || !(high24h > 0) || !(low24h > 0)) return null
  if (((high24h - low24h) / last) * 100 < MIN_BREAKOUT_RANGE_PERCENT)
    return null

  if (last >= high24h) {
    return {
      kind: 'breakout',
      deviation: null,
      label: t.signal.breakoutHigh,
      detail: t.signal.breakoutHighDetail,
    }
  }
  if (last <= low24h) {
    return {
      kind: 'breakout',
      deviation: null,
      label: t.signal.breakoutLow,
      detail: t.signal.breakoutLowDetail,
    }
  }
  return null
}

/**
 * A bar that went somewhere and came back. The shadow is where the price was
 * rejected, so a long one on an otherwise ordinary bar is the counter-evidence
 * to the breakout above it — which is why it is worth carrying even though it
 * never claims a ring on its own.
 */
export function rejectionSignal(
  {
    stats,
  }: {
    stats?: KlineStats | null
  },
  t: Messages,
): Signal | null {
  if (!stats?.closed || !stats.range) return null

  const bar = stats.closed
  const [, openPx, highPx, lowPx, closePx] = bar.map(Number)
  const range = highPx - lowPx
  if (!(range > 0)) return null

  // A wick on a bar that went nowhere is not a rejection of anything.
  const rangePercent = barRangePercent(bar)
  if (rangePercent === null || rangePercent < stats.range.mean) return null

  const body = Math.max(openPx, closePx)
  const upper = (highPx - body) / range
  const lower = (Math.min(openPx, closePx) - lowPx) / range

  if (upper >= WICK_SHARE) {
    return {
      kind: 'rejection',
      deviation: null,
      label: t.signal.upperWick,
      detail: t.signal.upperWickDetail(Math.round(upper * 100)),
    }
  }
  if (lower >= WICK_SHARE) {
    return {
      kind: 'rejection',
      deviation: null,
      label: t.signal.lowerWick,
      detail: t.signal.lowerWickDetail(Math.round(lower * 100)),
    }
  }
  return null
}

/**
 * What the symbol did that the board did not. Subtracting the median move takes
 * the market out of the number, which is the difference between "everything is
 * up two percent" and "this one is". Measured in the same sigma the momentum is,
 * because the excess is a return and that is the spread returns have here.
 */
export function strengthSignal(
  {
    pricePercent,
    boardPercent,
    baseline,
  }: {
    pricePercent?: number | null
    boardPercent?: number | null
    baseline?: Baseline | null
  },
  t: Messages,
): Signal | null {
  if (pricePercent == null || boardPercent == null || !baseline) return null

  const excess = pricePercent - boardPercent
  // Against zero rather than the baseline's mean: an excess return has a
  // meaningful zero of its own, and the mean of this instrument's returns is not
  // the mean of its returns net of the board's.
  const deviation = excess / baseline.sigma
  if (!isAnomalousChange(deviation, excess, MIN_MOVE_PERCENT)) return null

  const excessLabel = formatPercent(excess)
  return {
    kind: 'strength',
    deviation,
    label: t.signal.strength(excessLabel),
    detail: t.signal.strengthDetail(excessLabel, formatSigmas(deviation, t)),
  }
}

/**
 * More changing hands than usually does. This is the confirmation the price
 * readings need: a move on no volume is a thin book being walked, and it comes
 * back as easily as it went.
 */
export function volumeSignal(
  {
    stats,
    now = Date.now(),
  }: {
    stats?: KlineStats | null
    now?: number
  },
  t: Messages,
): Signal | null {
  if (!stats?.volume) return null

  // The forming bar where it is far enough along to extrapolate, so a surge is
  // visible inside the fifteen minutes it happens in; the bar that just closed
  // otherwise, which is late but still within the window that matters.
  const projected = projectedVolume(stats, now)
  const volume = projected ?? Number(stats.closed?.[7])
  if (!Number.isFinite(volume) || !(stats.volume.mean > 0)) return null

  const deviation = deviationFrom(volume, stats.volume)
  if (!isAnomalous(deviation) || deviation! < 0) return null

  const multiple = volume / stats.volume.mean
  if (multiple < SURGE_MULTIPLE) return null

  const multipleLabel = multiple.toFixed(1)
  return {
    kind: 'volume',
    deviation,
    label: t.signal.volume(multipleLabel),
    detail: t.signal.volumeDetail(multipleLabel, formatSigmas(deviation!, t)),
  }
}

/**
 * Open interest moving unusually fast, and which side it says is being taken
 * out. The quadrant is in the detail rather than in a second signal because it
 * is not a separate observation — it is this one read together with the price.
 */
export function openInterestSignal(
  {
    oiPercent,
    pricePercent,
    baseline,
  }: {
    oiPercent?: number | null
    pricePercent?: number | null
    baseline?: Baseline | null
  },
  t: Messages,
): Signal | null {
  if (oiPercent == null) return null

  const deviation = deviationFrom(oiPercent, baseline)
  if (!isAnomalousChange(deviation, oiPercent, MIN_SHORT_OI_PERCENT))
    return null

  const read =
    pricePercent == null ? null : squeezeRead(pricePercent, oiPercent)
  const change = formatPercent(oiPercent)
  const detail = t.signal.openInterestDetail(
    change,
    formatSigmas(deviation!, t),
  )

  return {
    kind: 'open-interest',
    deviation,
    label: t.signal.openInterest(change),
    detail: read ? `${detail} · ${describeSqueeze(read, t)}` : detail,
  }
}

/** The long/short account ratio, whose deviation is computed where it is polled. */
export function ratioSignal(
  {
    deviation,
  }: {
    deviation?: number | null
  },
  t: Messages,
): Signal | null {
  if (!isAnomalous(deviation)) return null
  return {
    kind: 'ratio',
    deviation: deviation!,
    label: t.signal.ratio(formatSigmas(deviation!, t)),
    detail: t.signal.ratioDetail(formatDeviation(deviation!, t)),
  }
}

export function fundingSignal(
  {
    rate,
    baseline,
  }: {
    rate?: string | number | null
    baseline?: Baseline | null
  },
  t: Messages,
): Signal | null {
  const deviation = deviationFrom(Number(rate), baseline)
  if (!isAnomalous(deviation)) return null
  return {
    kind: 'funding',
    deviation,
    label: t.signal.funding(formatSigmas(deviation!, t)),
    detail: t.signal.fundingDetail(formatDeviation(deviation!, t)),
  }
}

/**
 * How far the live rate has moved since it was last charged, against how far it
 * usually moves between settlements. The level and the change are different
 * questions: a rate that has sat at its high all month is a crowded trade, and a
 * rate that has just tripled is a crowd arriving.
 */
export function fundingShiftSignal(
  {
    rate,
    previous,
    baseline,
  }: {
    rate?: string | number | null
    previous?: string | number | null
    baseline?: Baseline | null
  },
  t: Messages,
): Signal | null {
  const current = Number(rate)
  const last = Number(previous)
  if (!Number.isFinite(current) || !Number.isFinite(last)) return null

  const shift = current - last
  const deviation = deviationFrom(shift, baseline)
  if (!isAnomalousChange(deviation, shift, MIN_FUNDING_SHIFT)) return null

  const moved = `${shift > 0 ? '+' : ''}${shift.toFixed(1)}‱`
  return {
    kind: 'funding-shift',
    deviation,
    label: t.signal.fundingShift(moved),
    detail: t.signal.fundingShiftDetail(moved),
  }
}

/**
 * What the contract is trading at relative to the spot index it settles
 * against. A premium is leverage queuing up on the long side and a discount is
 * the same on the short side; either way it is the one reading here that is
 * about the contract rather than about the asset.
 */
export function basisSignal(
  {
    last,
    indexPrice,
  }: {
    last: number
    indexPrice?: number
  },
  t: Messages,
): Signal | null {
  if (!(last > 0) || !indexPrice || !(indexPrice > 0)) return null

  const basis = ((last - indexPrice) / indexPrice) * 100
  if (Math.abs(basis) < MAX_BASIS_PERCENT) return null

  const basisLabel = formatPercent(basis, 2)
  return {
    kind: 'basis',
    deviation: null,
    label: t.signal.basis(basisLabel),
    detail: t.signal.basisDetail(basisLabel, basis > 0),
  }
}

/**
 * Everything one instrument can be seen through at one moment. Flat and plain on
 * purpose: whoever assembles it — a card rendering, or the pass that walks the
 * whole board looking for something to announce — hands over the same shape, so
 * the ring and the alert are one computation rather than two that have to agree.
 */
export interface SignalInput {
  last: number
  high24h: number
  low24h: number
  /** Session candles, already held for the sparkline. */
  klines?: OkxKline[]
  /** Five-minute move off the live buffer, in percent. */
  pricePercent?: number | null
  /** Five-minute open interest move, in percent. */
  oiPercent?: number | null
  /** The middle of the board's five-minute moves, to net the market out. */
  boardPercent?: number | null
  momentumBaseline?: Baseline | null
  oiChangeBaseline?: Baseline | null
  /** Already a deviation: the ratio arrives with its own history. */
  ratioDeviation?: number | null
  fundingRate?: string
  fundingBaseline?: Baseline | null
  fundingShiftBaseline?: Baseline | null
  fundingPrev?: string
  /** Spot index the contract settles against. */
  indexPrice?: number
  now?: number
}

/**
 * Every reading that is currently out of range, in the order they are worth
 * reading in. Nothing here weighs them — `flagStateOf` does that — so a caller
 * that only wants to colour one chip can look for one kind and ignore the rest.
 */
export function collectSignals(input: SignalInput, t: Messages): Signal[] {
  const stats = klineStatsOf(input.klines)

  return [
    momentumSignal(
      {
        pricePercent: input.pricePercent,
        baseline: input.momentumBaseline,
      },
      t,
    ),
    volatilitySignal({ stats }, t),
    breakoutSignal(
      {
        last: input.last,
        high24h: input.high24h,
        low24h: input.low24h,
      },
      t,
    ),
    rejectionSignal({ stats }, t),
    strengthSignal(
      {
        pricePercent: input.pricePercent,
        boardPercent: input.boardPercent,
        baseline: input.momentumBaseline,
      },
      t,
    ),
    volumeSignal({ stats, now: input.now }, t),
    openInterestSignal(
      {
        oiPercent: input.oiPercent,
        pricePercent: input.pricePercent,
        baseline: input.oiChangeBaseline,
      },
      t,
    ),
    ratioSignal({ deviation: input.ratioDeviation }, t),
    fundingSignal(
      {
        rate: input.fundingRate,
        baseline: input.fundingBaseline,
      },
      t,
    ),
    fundingShiftSignal(
      {
        rate: input.fundingRate,
        previous: input.fundingPrev,
        baseline: input.fundingShiftBaseline,
      },
      t,
    ),
    basisSignal({ last: input.last, indexPrice: input.indexPrice }, t),
  ].filter((signal): signal is Signal => signal !== null)
}

/** The one that owns a chip, when it is firing. */
export function signalOf(signals: Signal[], kind: Signal['kind']) {
  return signals.find((signal) => signal.kind === kind)
}
