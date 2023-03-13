/**
 * @interface FullTicker
 * @member {string} e - Event Type
 * @member {string} E - Event Time
 * @member {string} s - Symbol
 * @member {string} p - 24h Price Change
 * @member {string} P - 24h Price Change Percent
 * @member {string} w - Weighted Price
 * @member {string} c - Current Price
 * @member {string} Q - Current Price quantity
 * @member {string} o - 24h Open Price
 * @member {string} h - 24h High Price
 * @member {string} l - 24h Low Price
 * @member {string} v - Total Trades Base Asset Volume
 * @member {string} q - Total Trades Quote Asset Volumn
 */

export interface FullTicker {
  e: string
  E: string
  s: string
  p: string
  P: string
  w: string
  c: string
  Q: string
  o: string
  h: string
  l: string
  v: string
  q: string
}
