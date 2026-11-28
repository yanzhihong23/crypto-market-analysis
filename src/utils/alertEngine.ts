import type {
  FlagState,
  FlagTier,
  SignalDirection,
  SignalKind,
} from './signals'

export const DEFAULT_COOLDOWN_MS = 1000 * 60 * 30

/** Short anti-flap floor even when an escalation would break cooldown. */
export const DEFAULT_ESCALATION_FLOOR_MS = 1000 * 60

const CRITICAL_KINDS = new Set<SignalKind>(['liquidation', 'range-break'])

export interface AlertMemory {
  at: number
  tier: FlagTier
  familiesCount: number
  direction: SignalDirection
  criticalKinds: SignalKind[]
}

export function memoryOfFlag(flag: FlagState, at: number): AlertMemory {
  return {
    at,
    tier: flag.tier,
    familiesCount: flag.families.length,
    direction: flag.direction,
    criticalKinds: flag.reasons
      .map((reason) => reason.kind)
      .filter((kind) => CRITICAL_KINDS.has(kind)),
  }
}

/**
 * Decides whether a currently ringing flag should emit an alert, allowing
 * genuine escalations (tier upgrade, 3-family convergence, newly fired
 * liquidation/range-break, or direction reversal) to break through the 30m
 * per-symbol cooldown instead of being silently swallowed.
 */
export function shouldEmitAlert(
  previous: AlertMemory | undefined,
  flag: FlagState,
  now: number,
  {
    wasFlagged,
    cooldownMs = DEFAULT_COOLDOWN_MS,
    escalationFloorMs = DEFAULT_ESCALATION_FLOOR_MS,
  }: {
    wasFlagged: boolean
    cooldownMs?: number
    escalationFloorMs?: number
  },
): boolean {
  if (!previous) return !wasFlagged

  const elapsed = now - previous.at
  if (elapsed >= cooldownMs) {
    return !wasFlagged
  }

  // Inside cooldown: never double-ping within the anti-flap floor.
  if (elapsed < escalationFloorMs) return false

  const tierUpgraded = previous.tier !== 'high' && flag.tier === 'high'
  const familiesExpanded = flag.families.length > previous.familiesCount
  const directionFlipped =
    previous.direction !== 'neutral' &&
    flag.direction !== 'neutral' &&
    previous.direction !== flag.direction
  const prevCritical = new Set(previous.criticalKinds)
  const newCriticalEvent = flag.reasons.some(
    (reason) =>
      CRITICAL_KINDS.has(reason.kind) && !prevCritical.has(reason.kind),
  )

  return (
    tierUpgraded || familiesExpanded || directionFlipped || newCriticalEvent
  )
}

export interface AlertOutcomes {
  /** Percent price change measured ~5 minutes after the alert fired. */
  m5?: number
  /** Percent price change measured ~15 minutes after the alert fired. */
  m15?: number
  /** Percent price change measured ~1 hour after the alert fired. */
  h1?: number
}

export interface TrackableAlert {
  id: string
  instId: string
  at: number
  direction?: SignalDirection
  triggerPrice?: number
  outcomes?: AlertOutcomes
}

const OUTCOME_HORIZONS: Array<{
  key: keyof AlertOutcomes
  delayMs: number
  maxAgeMs: number
}> = [
  { key: 'm5', delayMs: 5 * 60 * 1000, maxAgeMs: 12 * 60 * 1000 },
  { key: 'm15', delayMs: 15 * 60 * 1000, maxAgeMs: 30 * 60 * 1000 },
  { key: 'h1', delayMs: 60 * 60 * 1000, maxAgeMs: 95 * 60 * 1000 },
]

/**
 * Computes any newly matured 5m / 15m / 1h realized returns for recent alerts.
 * Bounded by `maxAgeMs` per horizon so reopening a tab hours later does not
 * stamp a stale multi-hour move as a 5-minute outcome.
 */
export function evaluateAlertOutcomes(
  alerts: TrackableAlert[],
  getPrice: (instId: string) => number | null | undefined,
  now = Date.now(),
): Record<string, AlertOutcomes> {
  const updates: Record<string, AlertOutcomes> = {}

  for (const alert of alerts) {
    if (!alert.triggerPrice || !(alert.triggerPrice > 0)) continue
    const age = now - alert.at
    if (age < OUTCOME_HORIZONS[0].delayMs) continue

    const live = getPrice(alert.instId)
    if (!live || !(live > 0)) continue

    let next: AlertOutcomes | null = null
    for (const horizon of OUTCOME_HORIZONS) {
      if (alert.outcomes?.[horizon.key] !== undefined) continue
      if (age < horizon.delayMs || age > horizon.maxAgeMs) continue
      const move = ((live - alert.triggerPrice) / alert.triggerPrice) * 100
      if (!Number.isFinite(move)) continue
      next = {
        ...(next ?? alert.outcomes),
        [horizon.key]: Number(move.toFixed(2)),
      }
    }

    if (next) updates[alert.id] = next
  }

  return updates
}

export interface OutcomeSummary {
  count: number
  /** Percentage (0-100) of directional alerts that continued in their direction at 15m. */
  hitRate: number
  /** Mean directional return at 15m, in percent (+ means follow-through). */
  avgDirectionalMove: number
}

const MIN_SUMMARY_SAMPLE = 3

/**
 * Summarises realized 15m directional follow-through across tracked alerts so
 * the user can see live signal effectiveness directly in the alert drawer.
 */
export function summarizeAlertOutcomes(
  alerts: TrackableAlert[],
): OutcomeSummary | null {
  const samples: number[] = []
  for (const alert of alerts) {
    const move = alert.outcomes?.m15
    if (move === undefined || !Number.isFinite(move)) continue
    if (!alert.direction || alert.direction === 'neutral') continue
    samples.push(alert.direction === 'down' ? -move : move)
  }

  if (samples.length < MIN_SUMMARY_SAMPLE) return null

  const hits = samples.filter((value) => value > 0).length
  const avg = samples.reduce((sum, value) => sum + value, 0) / samples.length
  return {
    count: samples.length,
    hitRate: Math.round((hits / samples.length) * 100),
    avgDirectionalMove: avg,
  }
}
