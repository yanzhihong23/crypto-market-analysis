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
}

/**
 * The same chip once its reading crosses into short-crowded territory: a L/S
 * ratio below 1, or a funding rate below zero. Amber keeps it out of the price
 * red/green, and the weight bump is what makes it findable while scanning a
 * grid rather than only once you are already looking at the card.
 */
export const signalChipSx = {
  ...metricChipSx,
  backgroundColor: 'signal.surface',
  color: 'signal.main',
  fontWeight: 600,
}
