import { Box, Tooltip } from '@mui/material'

import { Signal, SignalKind, signalFamily } from '../utils/signals'
import { numericFont } from '../fonts'

/**
 * Which price reading speaks for the card when several are firing. The move
 * itself first, because it is the one with a number anybody wants; where that
 * move has got to second; and the shape of the bar last, since a range or a wick
 * is context for a move rather than news on its own.
 *
 * The coil is last of all, and it is the reason this badge is worth having on a
 * quiet card: it is the only reading here that can be alone, so most of the time
 * it appears the rest of this list is empty. When it is not — when a two-hour
 * wind-up has just been broken by a five-minute move — the move is the news and
 * the coil is why it is worth reading, which is what the tooltip is for.
 */
const LEAD_ORDER: SignalKind[] = [
  'momentum',
  // Ahead of the day's breakout, and never beside it — the longer range stands
  // the shorter one down when both would fire. A month's high is the bigger
  // fact, and on the badge there is room for exactly one.
  'range-break',
  'breakout',
  'strength',
  'volatility',
  'rejection',
  'compression',
]

const leadRank = (kind: SignalKind) => {
  const rank = LEAD_ORDER.indexOf(kind)
  return rank === -1 ? LEAD_ORDER.length : rank
}

/**
 * Over the sparkline rather than in the chip row. The four chips already fill
 * the card at its narrowest, so a fifth would wrap the row on every card on the
 * board to carry something that is absent from almost all of them — whereas the
 * chart has room, is the thing this is about, and costs no layout at all.
 *
 * Above the card's hover bar, which is anchored to the other side of the chart
 * but can still reach this corner: at the narrowest card width the buttons leave
 * around 58px and this badge wants 72, more once the label is a comparison
 * against the board. Whatever they end up sharing, the reading wins it — the bar
 * would otherwise take the pointer for a stretch of a badge that still looked
 * hoverable through its blur, and the tooltip would not open. The buttons are
 * centred on a 100px chart and this sits at its top, so nothing is ever covered
 * going the other way.
 */
const pulseSx = {
  ...numericFont,
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 4,
  px: 0.75,
  py: 0.125,
  borderRadius: '6px',
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1.6,
  whiteSpace: 'nowrap',
  backgroundColor: 'signal.surface',
  color: 'signal.main',
} as const

/**
 * What the price just did, when it did something unusual for this instrument.
 *
 * Nothing renders while the price is behaving, which is most of the time on most
 * cards — the badge appearing is the signal, and a permanent slot holding a dash
 * would be one more thing to read past on every card that has nothing to say.
 *
 * Not memoised, unlike the rest of the card's parts: the signal set is rebuilt
 * on each of the card's renders by design, so a shallow compare here would only
 * ever confirm that the prop is new.
 */
export default function SignalPulse({ signals }: { signals: Signal[] }) {
  const price = signals
    .filter((signal) => signalFamily(signal.kind) === 'price')
    .sort((a, b) => leadRank(a.kind) - leadRank(b.kind))

  if (!price.length) return null

  return (
    <Tooltip title={price.map((signal) => signal.detail).join(' · ')} arrow>
      <Box sx={pulseSx}>{price[0].label}</Box>
    </Tooltip>
  )
}
