import { useMemo } from 'react'

import { useTickerStore } from '../store/useTickerStore'

import TinyAreaChart from './TinyAreaChart'

export default function OkxKlineChart({ instId }: { instId: string }) {
  const klineData = useTickerStore((state) => state.klineData)

  const data = useMemo(() => {
    return (
      klineData[instId]?.map((i) => ({ c: i[4], ts: i[0] })).reverse() || []
    )
  }, [klineData, instId])

  return (
    <TinyAreaChart data={data} xKey="ts" yKey="c" width={'100%'} height={80} />
  )
}
