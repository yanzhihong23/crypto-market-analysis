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
  Coil,
  KlineStats,
  barRangePercent,
  klineStatsOf,
  projectedVolume,
} from './klineStats'

const formatPercent = (value: number, digits = 2) =>
  `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`

/**
 * Two significant figures rather than a fixed decimal place, because a spread
 * spans three orders of magnitude across one board: BTC quotes a sixtieth of a
 * basis point and a thin small cap quotes several. One decimal prints the whole
 * liquid end of the board as `0.0bp`, and four decimals carry three meaningless
 * digits on the thin end.
 */
const formatBps = (bps: number) => `${Number(bps.toPrecision(2))}bp`

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
 * How lopsided the market orders have to be before the tilt is worth naming,
 * whatever this instrument's own history says about it. A signed share of 0.15
 * is a 57/43 split — below that the side that "won" the bar won it by a margin
 * nobody would trade on, and an instrument whose flow is habitually balanced has
 * a sigma small enough to call one.
 */
const MIN_TAKER_IMBALANCE = 0.15

/**
 * How much of an instrument's open interest has to be closed out from under its
 * holders inside five minutes before the forcing is the story.
 *
 * A fixed band, and it earns one the way the basis does: liquidated contracts
 * over open contracts is already per instrument, has a real zero, and means the
 * same thing on BTC as on a small cap. There is also nothing to build a baseline
 * from — most five-minute windows on most instruments contain no liquidation at
 * all, so a sigma taken over them is a sigma of zeros and the first contract
 * closed out would read as infinitely unusual.
 *
 * Twenty-three hours of BTC, ETH, SOL, XRP, DOGE and SUI — 127 instrument-hours,
 * in a market quiet enough that three minutes of the whole exchange went by
 * without a single one — puts a window this size at one per symbol per fourteen
 * hours. The busiest window in that stretch was 0.22%. In the conditions this
 * reading is actually for it will fire on half the board at once, which is the
 * point of it.
 */
const MIN_LIQUIDATED_SHARE = 0.05

/**
 * How far down its own session a stretch has to sit before it is a coil. The
 * bottom tenth, which is a looser bar than the three sigmas everything else is
 * held to and has to be: this is a percentile of a series that always has a
 * bottom tenth, so unlike the sigma tests it flags roughly a tenth of the board
 * at all times rather than nothing on a calm afternoon. That is the right shape
 * for the one reading here that is a state rather than an event — "which of
 * these is quietest right now" always has an answer, and is the question.
 */
const COIL_PERCENTILE = 0.9

/**
 * And how much tighter than its usual, so that a day with no range to speak of
 * does not report its quietest two hours as news. A fifth below the middle
 * stretch is the materiality half of the test — the percentile says where in the
 * day this sits, and this says the day had somewhere to sit.
 */
const MAX_COIL_SHARE = 0.8

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
 * The last couple of hours trading in less room than this instrument has taken
 * all session. The one reading on this board that fires before something happens
 * rather than while it is happening — a range winds in ahead of the move that
 * unwinds it, and that is the whole of its usefulness.
 *
 * It is the mirror of the expansion above, and it is a separate function rather
 * than a sign flip on that one because the two are not the same measurement
 * upside down. An expansion is one bar against the spread of bars, and it can be
 * read the moment the bar closes. A compression is not visible in any one bar —
 * a single narrow bar inside a busy afternoon is nothing — so it has to be a
 * stretch of them, measured against every other stretch of the same length.
 *
 * Never rings on its own, and `signals.ts` is where that is arranged rather than
 * here: a coil is by construction a card with nothing else going on, so a rule
 * that let it ring would ring the quietest tenth of the board at all times. What
 * it is for is the badge, and for riding along in the reasons when the coil
 * finally breaks — a two-hour wind-up under a five-minute move is the pair worth
 * having, and both are true at once for exactly as long as that is interesting.
 */
export function compressionSignal(
  {
    coil,
  }: {
    coil?: Coil | null
  },
  t: Messages,
): Signal | null {
  if (!coil) return null
  if (coil.quieterThan < COIL_PERCENTILE) return null

  const share = coil.recent / coil.typical
  if (share > MAX_COIL_SHARE) return null

  const shareLabel = share.toFixed(1)
  return {
    kind: 'compression',
    // A percentile, not a distance, and the reasons list sorts on distances.
    deviation: null,
    label: t.signal.compression(shareLabel),
    detail: t.signal.compressionDetail(
      shareLabel,
      Math.round(coil.quieterThan * 100),
    ),
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
 * Which side was crossing the spread, when one side of it was doing far more of
 * the crossing than usually does.
 *
 * This is the reading the volume one has always been missing. A bar three times
 * its usual size says the same thing whoever was behind it, and the board's only
 * way of guessing was to look at what the price did next — which is the question,
 * not the answer. Two-thirds of a bar's market orders landing on one side is the
 * answer, and it is measured rather than inferred.
 *
 * Symmetric around zero on purpose: the imbalance has a real zero of its own —
 * an even fight — so the baseline it is held against describes how lopsided this
 * instrument's flow usually gets in either direction.
 */
export function takerFlowSignal(
  {
    imbalance,
    deviation,
  }: {
    imbalance?: number | null
    deviation?: number | null
  },
  t: Messages,
): Signal | null {
  if (imbalance == null || !Number.isFinite(imbalance)) return null
  if (!isAnomalousChange(deviation, imbalance, MIN_TAKER_IMBALANCE)) return null

  // Back to the share of the side that won it, which is the way anybody who
  // trades reads this: 0.44 either way is 72% of the flow on one side.
  const share = `${Math.round(((1 + Math.abs(imbalance)) / 2) * 100)}%`
  return {
    kind: 'taker',
    deviation: deviation!,
    label: t.signal.taker(share, imbalance > 0),
    detail: t.signal.takerDetail(
      share,
      imbalance > 0,
      formatSigmas(deviation!, t),
    ),
  }
}

/**
 * Positions closed out by the exchange rather than by the people holding them.
 *
 * The reading the squeeze quadrant has been guessing at. That one infers forcing
 * from the price and the open interest pointing opposite ways, which is a fair
 * inference and still an inference — open interest falls when people take profit
 * too. This is the exchange naming the positions and the side, and it is the
 * difference between "this looks like longs getting out" and "these longs did
 * not get out, they were taken out".
 *
 * Measured against open interest so the number travels: five hundred contracts
 * is a rounding error on BTC and the whole book on a small cap.
 */
export function liquidationSignal(
  {
    liquidation,
    openInterest,
  }: {
    liquidation?: { long: number; short: number } | null
    openInterest?: number | null
  },
  t: Messages,
): Signal | null {
  if (!liquidation || !openInterest || !(openInterest > 0)) return null

  const total = liquidation.long + liquidation.short
  const share = (total / openInterest) * 100
  if (share < MIN_LIQUIDATED_SHARE) return null

  // Which side was carried out, not which side was bigger by a hair: the pair is
  // reported as one event and the dominant side is what it is about.
  const longs = liquidation.long >= liquidation.short
  const shareLabel = `${share.toFixed(2)}%`
  return {
    kind: 'liquidation',
    // No sigma: this is a share of a known quantity, not a distance from a
    // history nothing here keeps.
    deviation: null,
    label: t.signal.liquidation(shareLabel, longs),
    detail: t.signal.liquidationDetail(shareLabel, longs),
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

/**
 * The money and the show of hands standing further apart than they usually do.
 *
 * The ratio above says what everybody holds. This says whether the accounts
 * holding the most agree with them — the crowd figure counts heads and the elite
 * figure weighs size, so the two parting is people with something at stake
 * taking the other side rather than one crowd described twice.
 *
 * No floor on the gap itself, unlike the readings that measure a change. The gap
 * has a level of its own that is nothing like zero and differs by an order of
 * magnitude across the board, so a floor in its units would mean a different
 * thing on every instrument; and the series earns the sigma test honestly —
 * across eight hours of BTC, ETH, SUI and DOGE nothing came within a fifth of
 * three sigma, so three of them is already the rare event it is meant to be.
 */
export function divergenceSignal(
  {
    deviation,
  }: {
    deviation?: number | null
  },
  t: Messages,
): Signal | null {
  if (!isAnomalous(deviation)) return null
  return {
    kind: 'divergence',
    deviation: deviation!,
    // Above means the elite side is the longer of the two against its own
    // normal, which is the direction anybody reading this wants first.
    label: t.signal.divergence(formatSigmas(deviation!, t), deviation! > 0),
    detail: t.signal.divergenceDetail(
      formatSigmas(deviation!, t),
      deviation! > 0,
    ),
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
 * The book charging far more than it usually does to cross it.
 *
 * Every other reading here reports something that has happened. This one reports
 * the condition it would happen into: a spread that has tripled is market makers
 * standing back, and it is why the next ordinary-sized order prints a candle
 * instead of a tick. It is also the earliest of them — the quotes widen while
 * the price is still where it was.
 *
 * Only ever a widening, on the same grounds the bar range is. A book quoting
 * tighter than usual is a good afternoon to trade in and not news.
 */
export function spreadSignal(
  {
    bps,
    baseline,
  }: {
    bps?: number | null
    baseline?: Baseline | null
  },
  t: Messages,
): Signal | null {
  if (bps == null || !baseline) return null

  const deviation = deviationFrom(bps, baseline)
  if (!isAnomalous(deviation) || deviation! < 0) return null

  // The floor the volume surge carries, and here it is the test doing the work
  // rather than a backstop to the one above. A liquid book quotes exactly one
  // tick for hours at a stretch, so almost all of its measured spread is the mid
  // drifting under a fixed gap — over seventeen minutes of BTC the sigma came
  // out at a hundred-thousandth of the mean. Three of a sigma that small is met
  // by anything at all; being half again as wide as this book usually quotes is
  // the part that means the makers have stepped back.
  const multiple = bps / baseline.mean
  if (multiple < SURGE_MULTIPLE) return null

  const spread = formatBps(bps)
  return {
    kind: 'spread',
    // No sigma, for the same reason a breakout carries none: on a series that
    // sits on one value most of the time the count is a number in the hundreds
    // that describes the yardstick rather than the event. The multiple is what
    // a tick-quantised reading can honestly say about itself, and it is the same
    // thing the volume surge says.
    deviation: null,
    label: t.signal.spread(spread),
    detail: t.signal.spreadDetail(spread, multiple.toFixed(1)),
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
  /** Contracts closed out by the exchange in the last five minutes, by side. */
  liquidation?: { long: number; short: number } | null
  /** Open contracts, which is what the above is only meaningful against. */
  openInterest?: number | null
  /** The middle of the board's five-minute moves, to net the market out. */
  boardPercent?: number | null
  momentumBaseline?: Baseline | null
  /**
   * How quiet the last two hours have been. Off the uncut candles the momentum
   * baseline is taken over rather than off `klines`, which are cut to the
   * session and too few of them to answer this for half of every day.
   */
  coil?: Coil | null
  oiChangeBaseline?: Baseline | null
  /** Already a deviation: the ratio arrives with its own history. */
  ratioDeviation?: number | null
  /** The same, for the gap between the elite and crowd ratios. */
  divergenceDeviation?: number | null
  /** Signed share of the bar's market orders, +1 all buying, -1 all selling. */
  takerImbalance?: number | null
  /** Also already a deviation: the split is polled with its own history. */
  takerDeviation?: number | null
  /** Best ask over best bid as a share of the mid, in basis points. */
  spreadBps?: number | null
  spreadBaseline?: Baseline | null
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
    compressionSignal({ coil: input.coil }, t),
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
    takerFlowSignal(
      {
        imbalance: input.takerImbalance,
        deviation: input.takerDeviation,
      },
      t,
    ),
    liquidationSignal(
      {
        liquidation: input.liquidation,
        openInterest: input.openInterest,
      },
      t,
    ),
    openInterestSignal(
      {
        oiPercent: input.oiPercent,
        pricePercent: input.pricePercent,
        baseline: input.oiChangeBaseline,
      },
      t,
    ),
    ratioSignal({ deviation: input.ratioDeviation }, t),
    divergenceSignal({ deviation: input.divergenceDeviation }, t),
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
    spreadSignal({ bps: input.spreadBps, baseline: input.spreadBaseline }, t),
  ].filter((signal): signal is Signal => signal !== null)
}

/** The one that owns a chip, when it is firing. */
export function signalOf(signals: Signal[], kind: Signal['kind']) {
  return signals.find((signal) => signal.kind === kind)
}
