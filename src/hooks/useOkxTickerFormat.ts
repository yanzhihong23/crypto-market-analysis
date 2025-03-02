import { useCallback } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import { OkxTicker, OkxTickerFormatted } from '../types/okx'
import { compactNumberFormatter, formatNumber } from '../utils'

export default function useOkxTickerFormat() {
  const instruments = useTickerStore((state) => state.instruments)
  const openTime = useTickerStore((state) => state.openTime)

  const formatTicker = useCallback(
    ({ ticker }: { ticker: OkxTicker }): OkxTickerFormatted => {
      const instrument = instruments.find(
        (instrument) => instrument.instId === ticker.instId,
      )
      const open = Number(ticker[openTime])
      const coin = ticker.instId.split('-')[0]
      const change = +ticker.last - open
      const percent = ((change / open) * 100).toFixed(2)
      const vol = compactNumberFormatter(+ticker.volCcy24h * +ticker.last)
      const logo = `https://static.okx.com/cdn/oksupport/asset/currency/icon/${coin.toLowerCase()}.png?x-oss-process=image/format,webp`
      let dif = new Intl.NumberFormat().format(change)
      if (change > 0) dif = '+' + dif

      const color = +ticker.last > +open ? 'success' : 'error'
      const lastSz = formatNumber(+ticker.lastSz * +(instrument?.ctVal || 1), 4)

      return {
        coin,
        logo,
        dif,
        percent,
        vol,
        color,
        ...ticker,
        lastSz: lastSz.toString(),
      }
    },
    [instruments, openTime],
  )

  return { formatTicker }
}
