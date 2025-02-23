import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns/format'
import { useInterval } from 'usehooks-ts'

import { fetchBinanceOpenInterestHist } from '../apis'
import { compactNumberFormatter, getPeriodPattern } from '../utils'

import BaseAreaChart from './BaseAreaChart'

export default function RatioTrendChart(props: {
  symbol: string
  period: string
  syncId?: string
}) {
  const [data, setData] = useState<{ time: string; sumOpenInterest: number }[]>(
    [],
  )

  const initData = useCallback(async () => {
    if (!props.symbol) return

    const res = await fetchBinanceOpenInterestHist({
      symbol: props.symbol,
      period: props.period,
      limit: props.period === '5m' ? 288 : 96,
    })
    if (res?.length) {
      setData(
        res.map((i) => ({
          sumOpenInterest: +i.sumOpenInterest,
          time: format(+i.timestamp, getPeriodPattern(props.period)),
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
      yKey="sumOpenInterest"
      yDataFormatter={(val: number) => compactNumberFormatter(val, 1)}
      label="Open Interest Hist"
      syncId={props.syncId}
    />
  )
}
