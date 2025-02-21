import { useTickerStore } from '../store/useTickerStore'
import { OkxTicker, OkxTickerFormatted, OpenTime } from '../types/okx'
import { compactNumberFormatter } from '../utils'

export default function useOkxTickerFormat() {
  const volCcyQuote = useTickerStore((state) => state.volCcyQuote)
  const ratio = useTickerStore((state) => state.ratio)

  const formatTicker = ({
    ticker,
    oldTicker,
    openTime,
  }: {
    ticker: OkxTicker
    oldTicker: OkxTickerFormatted
    openTime: OpenTime
  }): OkxTickerFormatted => {
    const open = Number(ticker[openTime])
    const coin = ticker.instId.split('-')[0]
    const change = +ticker.last - open
    const percent = ((change / open) * 100).toFixed(2)
    const vol = compactNumberFormatter(+ticker.volCcy24h * +ticker.last)
    const logo = `https://static.okx.com/cdn/oksupport/asset/currency/icon/${coin.toLowerCase()}.png?x-oss-process=image/format,webp`
    let dif = new Intl.NumberFormat().format(change)
    if (change > 0) dif = '+' + dif

    const color = +ticker.last > +open ? 'success' : 'error'
    const priceColor = +ticker.last > +oldTicker.last ? 'success' : 'error'

    return {
      coin,
      logo,
      dif,
      percent,
      vol,
      color,
      priceColor,
      oiCcy: oldTicker?.oiCcy,
      fundingRate: oldTicker?.fundingRate,
      ratio: ratio[ticker.instId],
      volCcyQuote: volCcyQuote[ticker.instId],
      ...ticker,
    }
  }

  return { formatTicker }
}
