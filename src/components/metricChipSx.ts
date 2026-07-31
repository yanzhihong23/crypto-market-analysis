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
