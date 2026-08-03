import { numericFont } from '../fonts'

/**
 * Third-tier data, so it stays neutral and lets the price own the colour. It
 * also keeps the funding rate from being read as a price move: it used to be
 * tinted with the same red/green as the 24h change while meaning something
 * else. The sign carries that information instead.
 */
export const metricChipSx = {
  ...numericFont,
  backgroundColor: 'surface.subtle',
  color: 'text.secondary',
  // Two pixels a side off the default, which is what buys the fourth chip a
  // place on the same line at the width most of the grid runs at. The row still
  // wraps on a narrow card rather than clipping.
  '& .MuiChip-label': { paddingLeft: 0.75, paddingRight: 0.75 },
}

/**
 * The same chip once its reading has left the range that instrument normally
 * keeps it in, whichever side it left on. Amber keeps it out of the price
 * red/green — none of these readings has a direction in the sense the price
 * does — and the weight bump is what makes it findable while scanning a grid
 * rather than only once you are already looking at the card.
 */
export const signalChipSx = {
  ...metricChipSx,
  backgroundColor: 'signal.surface',
  color: 'signal.main',
  fontWeight: 600,
}
