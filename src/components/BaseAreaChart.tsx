import { useEffect, useState } from 'react'
import { AreaChart, Area, Tooltip, XAxis, YAxis, Label } from 'recharts'

export default function BaseAreaChart({
  data,
  xKey,
  yKey,
  label,
  yDataFormatter
}: {
  data: { [key: string]: number | string }[]
  xKey: string
  yKey: string
  label: string
  yDataFormatter?: (val: number) => string
  width?: number
  height?: number
}) {
  const [isUp, setIsUp] = useState(true)

  useEffect(() => {
    if (!data?.length) return
    setIsUp(Number(data[data.length - 1][yKey]) > Number(data[0][yKey]))
  }, [data])

  return (
    <AreaChart
      width={800}
      height={300}
      data={data}
      margin={{ top: 10, right: 0, left: 10, bottom: 30 }}
    >
      <defs>
        <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#E04A59" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#E04A59" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <XAxis dataKey={xKey}>
        <Label value={label} offset={10} position="bottom" />
      </XAxis>
      <YAxis
        type="number"
        domain={['auto', 'auto']}
        tickFormatter={yDataFormatter}
      />
      <Tooltip
        wrapperStyle={{ border: 'none' }}
        contentStyle={{
          border: 'none',
          background: 'rgba(255, 255, 255, .8)'
        }}
      />
      <Area
        type="monotone"
        dataKey={yKey}
        stroke={isUp ? '#82ca9d' : '#E04A59'}
        fillOpacity={1}
        fill={isUp ? 'url(#colorUp)' : 'url(#colorDown)'}
      />
    </AreaChart>
  )
}
