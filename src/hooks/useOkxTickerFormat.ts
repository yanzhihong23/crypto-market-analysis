import { useCallback, useMemo } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import { OkxTicker, OkxTickerFormatted } from '../types/okx'
import { compactNumberFormatter, formatNumber } from '../utils'

/**
 * Built once rather than per message: this runs on every ticker the feed
 * delivers, and constructing a formatter is what costs — see `utils`.
 */
const difFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
})

export default function useOkxTickerFormat() {
  const instruments = useTickerStore((state) => state.instruments)
  const openTime = useTickerStore((state) => state.openTime)

  // A lookup rather than a scan: this is asked once per message, against a
  // list of every swap on the exchange.
  const instrumentsById = useMemo(
    () =>
      new Map(instruments.map((instrument) => [instrument.instId, instrument])),
    [instruments],
  )

  const formatTicker = useCallback(
    ({ ticker }: { ticker: OkxTicker }): OkxTickerFormatted => {
      const instrument = instrumentsById.get(ticker.instId)
      const open = Number(ticker[openTime])
      const change = +ticker.last - open
      const percent = ((change / open) * 100).toFixed(2)
      const vol = compactNumberFormatter(+ticker.volCcy24h * +ticker.last)
      let dif = difFormatter.format(change)
      if (change > 0) dif = '+' + dif

      const color = +ticker.last > +open ? 'market.up' : 'market.down'
      const lastSz = formatNumber(+ticker.lastSz * +(instrument?.ctVal || 1), 4)

      return {
        dif,
        percent,
        vol,
        color,
        ...ticker,
        open: ticker[openTime],
        lastSz: lastSz.toString(),
      }
    },
    [instrumentsById, openTime],
  )

  return { formatTicker }
}
