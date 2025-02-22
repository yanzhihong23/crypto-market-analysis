import { useMemo } from 'react'

import { useTickerStore } from '../store/useTickerStore'

import TinyAreaChart from './TinyAreaChart'

export default function OkxKlineChart({ instId }: { instId: string }) {
  const klineData = useTickerStore((state) => state.klineData)

  const data = useMemo(() => {
    const list = klineData[instId]?.reverse()
    const result = []
    for (let i = 0; i < list.length; i++) {
      if (i === 0) {
        // 开盘价
        result.push({ c: list[i][1], ts: list[i][0] })
      } else {
        // 收盘价
        result.push({ c: list[i][4], ts: list[i][0] })
      }
    }

    return result
  }, [klineData, instId])

  return (
    <TinyAreaChart data={data} xKey="ts" yKey="c" width={'100%'} height={80} />
  )
}
