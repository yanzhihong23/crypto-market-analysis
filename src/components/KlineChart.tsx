import { useEffect, useState } from 'react'
import { fetchBinanceKlines } from '../apis'
import format from 'date-fns/format'
import BaseAreaChart from './BaseAreaChart'
import { getPeriodPattern } from '../utils'
import { useInterval } from 'usehooks-ts'

export default function RatioTrendChart(props: {
  symbol: string
  period: string
  syncId?: string
}) {
  const [data, setData] = useState<{ openTime: string; closePrice: number }[]>(
    [],
  )

  const initData = async () => {
    if (!props.symbol) return

    const res = await fetchBinanceKlines({
      symbol: props.symbol,
      interval: props.period,
      limit: props.period === '5m' ? 288 : 96,
    })

    if (res?.length) {
      setData(
        res.map((i) => ({
          openTime: format(i[0], getPeriodPattern(props.period)),
          closePrice: +i[4],
        })),
      )
    }
  }

  useInterval(initData, 1000 * 30)

  useEffect(() => {
    initData()
  }, [props.symbol, props.period])

  return (
    <BaseAreaChart
      data={data}
      xKey="openTime"
      yKey="closePrice"
      label="Kline"
      syncId={props.syncId}
    />
  )
}
