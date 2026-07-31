import { useEffect, useId, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  Label,
} from 'recharts'

export default function BaseAreaChart({
  data,
  xKey,
  yKey,
  label,
  syncId,
  yDataFormatter,
  width = '99%',
  height = 300,
}: {
  data: { [key: string]: number | string }[]
  xKey: string
  yKey: string
  label?: string
  yDataFormatter?: (val: number) => string
  width?: string | number
  height?: string | number
  syncId?: string
}) {
  const [isUp, setIsUp] = useState(true)
  const theme = useTheme()
  // Unique per instance: a fixed id makes every chart on the page resolve to
  // the first one's <defs>.
  const gradientId = `area-${useId().replace(/:/g, '')}`
  const color = isUp
    ? theme.palette.market.upChart
    : theme.palette.market.downChart

  const renderLabel = ({
    index,
    value,
    x,
    y,
  }: {
    value: number
    index: number
    x: number
    y: number
  }) => {
    if (index === data.length - 1) {
      return (
        <text x={x} y={y} dx={-66} dy={-10} fill={color}>
          {yDataFormatter ? yDataFormatter(value) : value}
        </text>
      )
    }
  }

  useEffect(() => {
    if (!data?.length) return
    setIsUp(Number(data[data.length - 1][yKey]) > Number(data[0][yKey]))
  }, [data, yKey])

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart
        data={data}
        syncId={syncId}
        margin={{ top: 10, right: 10, left: 5, bottom: 30 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
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
            background: 'rgba(255, 255, 255, .8)',
          }}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          label={renderLabel}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
