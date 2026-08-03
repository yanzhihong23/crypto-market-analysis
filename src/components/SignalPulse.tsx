import { Box, Tooltip } from '@mui/material'

import { Signal, SignalKind, signalFamily } from '../utils/signals'
import { numericFont } from '../fonts'

/**
 * Which price reading speaks for the card when several are firing. The move
 * itself first, because it is the one with a number anybody wants; where that
 * move has got to second; and the shape of the bar last, since a range or a wick
 * is context for a move rather than news on its own.
 */
const LEAD_ORDER: SignalKind[] = [
  'momentum',
  'breakout',
  'strength',
  'volatility',
  'rejection',
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
 * Under the hover bar rather than over it: that bar is only blurred, so this
 * stays readable through it, and the buttons stay clickable.
 */
const pulseSx = {
  ...numericFont,
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 2,
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
