import { useEffect, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, YAxis, XAxis } from 'recharts'

export default function BaseAreaChart({
  data,
  xKey,
  yKey,
  width = '99%',
  height = 300,
}: {
  data: { [key: string]: number | string }[]
  xKey: string
  yKey: string
  label?: string
  width?: string | number
  height?: string | number
}) {
  const [isUp, setIsUp] = useState(true)

  useEffect(() => {
    if (!data?.length) return
    setIsUp(Number(data[data.length - 1][yKey]) > Number(data[0][yKey]))
  }, [data, yKey])

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
        <XAxis dataKey={xKey} hide />
        <YAxis type="number" domain={['auto', 'auto']} hide />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={isUp ? '#82ca9d' : '#E04A59'}
          fillOpacity={1}
          fill={isUp ? 'url(#colorUp)' : 'url(#colorDown)'}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
