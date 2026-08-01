/**
 * Positioning readings — the long/short ratio and the funding rate — are worth
 * flagging when they leave the range they normally sit in, on either side. A
 * crowded short and a crowded long are both crowded; a fixed band would have to
 * call one of them normal.
 *
 * "Normal" is per instrument and cannot be a constant: BTC's account ratio
 * lives around 2 while a small cap can sit under 1 for weeks, so the same
 * threshold would either scream on one or never fire on the other. Each reading
 * is measured against its own recent history instead.
 */

/** Samples of history needed before a mean and a spread mean anything. */
const MIN_SAMPLES = 20

/**
 * How far from its own mean a reading sits before it earns the flag.
 *
 * Three, not the textbook two. These series trend rather than jitter around a
 * fixed level, so the latest point sits far from its window's mean far more
 * often than a normal distribution would predict: across the 347 symbols on the
 * Binance grid the median reading is already 1.2 sigma out, and two sigma
 * flagged 15% of them. Three flags the top 3%, which is what "worth a look"
 * should mean on a screen this dense.
 */
const DEVIATION_SIGMAS = 3

export interface Baseline {
  mean: number
  /** Sample standard deviation; never zero, a flat window yields no baseline. */
  sigma: number
}

/**
 * The shape of a metric's recent history. Kept as two numbers rather than the
 * series itself: it is all the flag needs, it survives being persisted, and it
 * lets a live value be measured against it without refetching anything.
 */
export function baselineOf(values: number[]): Baseline | null {
  const usable = values.filter((value) => Number.isFinite(value))
  if (usable.length < MIN_SAMPLES) return null

  const mean = usable.reduce((sum, value) => sum + value, 0) / usable.length
  const variance =
    usable.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (usable.length - 1)
  const sigma = Math.sqrt(variance)

  // A window that never moved has nothing to be unusual against, and dividing
  // by it would report every reading as infinitely far from normal.
  if (!(sigma > 0)) return null

  return { mean, sigma }
}

/** Signed distance from normal, in standard deviations. */
export function deviationFrom(value: number, baseline?: Baseline | null) {
  if (!baseline || !Number.isFinite(value)) return null
  return (value - baseline.mean) / baseline.sigma
}

/** Far enough from its own normal to be worth looking at, in either direction. */
export function isAnomalous(deviation?: number | null) {
  return (
    deviation !== null &&
    deviation !== undefined &&
    Math.abs(deviation) >= DEVIATION_SIGMAS
  )
}

/**
 * Both positioning readings out of their usual range at once. Either one alone
 * gets its chip marked; this is the bar for claiming the card's ring and for
 * being worth interrupting someone who is not looking at the page.
 *
 * Defined here rather than at either call site so the ring and the alert can
 * never disagree about what they are reporting.
 */
export function isFlagged({
  ratioDeviation,
  fundingDeviation,
}: {
  ratioDeviation?: number | null
  fundingDeviation?: number | null
}) {
  return isAnomalous(ratioDeviation) && isAnomalous(fundingDeviation)
}

/**
 * How the chip's tooltip says it, e.g. "2.4σ above its recent range". The sign
 * is the whole point — above means the crowd is longer, or paying more, than it
 * has been, and below means the opposite.
 */
export function formatDeviation(deviation: number) {
  const side = deviation > 0 ? 'above' : 'below'
  return `${Math.abs(deviation).toFixed(1)}σ ${side}`
}

export function describeDeviation(deviation: number) {
  return `${formatDeviation(deviation)} its recent range`
}
