import { memo, useMemo } from 'react'

import { useKlineData } from '../hooks/useTickerField'

import TinyAreaChart from './TinyAreaChart'

function OkxKlineChart({ instId }: { instId: string }) {
  const instKlineData = useKlineData(instId)

  const data = useMemo(() => {
    if (!instKlineData) return []

    const list = [...instKlineData].reverse()
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
  }, [instKlineData])

  return (
    <TinyAreaChart data={data} xKey="ts" yKey="c" width={'100%'} height={100} />
  )
}

export default memo(OkxKlineChart)
