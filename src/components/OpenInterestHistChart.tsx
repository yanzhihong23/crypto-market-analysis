import { useEffect, useState } from 'react'
import { fetchBinanceOpenInterestHist } from '../apis'
import format from 'date-fns/format'
import BaseAreaChart from './BaseAreaChart'
import { compactNumberFormatter, getPeriodPattern } from '../utils'

export default function RatioTrendChart(props: {
  symbol: string
  period: string
}) {
  const [data, setData] = useState<{ time: string; sumOpenInterest: number }[]>(
    []
  )

  const initData = async () => {
    if (!props.symbol) return

    const res = await fetchBinanceOpenInterestHist({
      symbol: props.symbol,
      period: props.period,
      limit: 96
    })
    if (res?.length) {
      setData(
        res.map((i) => ({
          sumOpenInterest: +i.sumOpenInterest,
          time: format(+i.timestamp, getPeriodPattern(props.period))
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
      xKey="time"
      yKey="sumOpenInterest"
      yDataFormatter={compactNumberFormatter}
      label="Open Interest Hist"
    />
  )
}
