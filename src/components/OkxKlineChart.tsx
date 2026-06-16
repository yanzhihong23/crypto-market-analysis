import { memo, useMemo, useRef } from 'react'

import { useKlineData } from '../hooks/useTickerField'
import type { OkxKline } from '../types/okx'

import TinyAreaChart from './TinyAreaChart'

function OkxKlineChart({ instId }: { instId: string }) {
  const instKlineData = useKlineData(instId)
  const lastGoodKlinesRef = useRef<OkxKline[]>([])

  const data = useMemo(() => {
    if (Array.isArray(instKlineData)) {
      lastGoodKlinesRef.current = instKlineData
    }

    const source = Array.isArray(instKlineData)
      ? instKlineData
      : lastGoodKlinesRef.current

    if (!source.length) return []

    const list = source.slice().reverse()
    const result: Array<{ c: string; ts: string }> = []
    for (let i = 0; i < list.length; i++) {
      const row = list[i]
      if (!Array.isArray(row) || row.length < 5) continue

      if (i === 0) {
        // 开盘价
        result.push({ c: row[1], ts: row[0] })
      } else {
        // 收盘价
        result.push({ c: row[4], ts: row[0] })
      }
    }

    return result
  }, [instKlineData])

  return (
    <TinyAreaChart data={data} xKey="ts" yKey="c" width={'100%'} height={100} />
  )
}

export default memo(OkxKlineChart)
