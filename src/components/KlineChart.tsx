import { useEffect, useState } from 'react'
import { fetchBinanceKlines } from '../apis'
import format from 'date-fns/format'
import BaseAreaChart from './BaseAreaChart'
import { getPeriodPattern } from '../utils'

export default function RatioTrendChart(props: {
  symbol: string
  period: string
}) {
  const [data, setData] = useState<{ openTime: string; closePrice: number }[]>(
    []
  )

  const initData = async () => {
    if (!props.symbol) return

    const res = await fetchBinanceKlines({
      symbol: props.symbol,
      interval: props.period,
      limit: 96
    })
    if (res?.length) {
      setData(
        res.map((i) => ({
          openTime: format(i[0], getPeriodPattern(props.period)),
          closePrice: +i[4]
        }))
      )
    }
  }

  useEffect(() => {
    initData()
  }, [props])

  return (
    <BaseAreaChart
      data={data}
      xKey="openTime"
      yKey="closePrice"
      label="Kline"
    />
  )
}
