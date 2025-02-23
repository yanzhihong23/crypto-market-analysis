import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns/format'
import { useInterval } from 'usehooks-ts'

import { fetchBinanceRatio, Ratio } from '../apis'
import { getPeriodPattern } from '../utils'

import BaseAreaChart from './BaseAreaChart'

export default function RatioTrendChart(props: {
  symbol: string
  period: string
  syncId?: string
}) {
  const [data, setData] = useState<Ratio[]>([])

  const initData = useCallback(async () => {
    if (!props.symbol) return

    const res = await fetchBinanceRatio({
      ...props,
      limit: props.period === '5m' ? 288 : 96,
    })
    if (res?.length) {
      setData(
        res.map((i) => ({
          ...i,
          ratio: +i.longShortRatio,
          time: format(i.timestamp, getPeriodPattern(props.period)),
        })),
      )
    }
  }, [props])

  useInterval(initData, 1000 * 5 * 60)

  useEffect(() => {
    initData()
  }, [initData])

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
