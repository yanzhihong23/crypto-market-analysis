import { useEffect, useState } from 'react'
import { fetchBinanceRatio, Ratio } from '../apis'
import format from 'date-fns/format'
import BaseAreaChart from './BaseAreaChart'
import { getPeriodPattern } from '../utils'

export default function RatioTrendChart(props: {
  symbol: string
  period: string
  syncId?: string
}) {
  const [data, setData] = useState<Ratio[]>([])

  const initData = async () => {
    if (!props.symbol) return

    const res = await fetchBinanceRatio({ ...props, limit: 96 })
    if (res?.length) {
      setData(
        res.map((i) => ({
          ...i,
          ratio: +i.longShortRatio,
          time: format(i.timestamp, getPeriodPattern(props.period))
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
      yKey="ratio"
      label="Long Short Account Ratio"
      syncId={props.syncId}
    />
  )
}
