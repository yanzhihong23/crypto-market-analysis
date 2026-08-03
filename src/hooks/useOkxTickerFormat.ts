import { useCallback } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import { OkxTicker, OkxTickerFormatted } from '../types/okx'
import { formatNumber } from '../utils'
import { useCompactNumber } from '../i18n'

export default function useOkxTickerFormat() {
  const instruments = useTickerStore((state) => state.instruments)
  const openTime = useTickerStore((state) => state.openTime)
  const compact = useCompactNumber()

  const formatTicker = useCallback(
    ({ ticker }: { ticker: OkxTicker }): OkxTickerFormatted => {
      const instrument = instruments.find(
        (instrument) => instrument.instId === ticker.instId,
      )
      const open = Number(ticker[openTime])
      const change = +ticker.last - open
      const percent = ((change / open) * 100).toFixed(2)
      const vol = compact(+ticker.volCcy24h * +ticker.last)
      let dif = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 6,
      }).format(change)
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
    [instruments, openTime, compact],
  )

  return { formatTicker }
}
