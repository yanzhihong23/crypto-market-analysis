import { memo, useId } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  YAxis,
  XAxis,
} from 'recharts'

function BaseAreaChart({
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
  const theme = useTheme()
  // Unique per instance: with a fixed id, every chart on the page resolves to
  // the first one's <defs>. Colons are stripped for the url() reference.
  const gradientId = `area-${useId().replace(/:/g, '')}`

  // Where the series starts, which is the level the stroke's colour is measured
  // against. Without it the sparkline shows the shape of the session but not
  // how much of it is above water.
  const open = data?.length ? Number(data[0][yKey]) : NaN

  // Derived during render. Holding this in state meant the first paint of every
  // chart was green regardless of direction, until the effect caught up.
  const isUp = !data?.length || Number(data[data.length - 1][yKey]) >= open

  const color = isUp
    ? theme.palette.market.upChart
    : theme.palette.market.downChart

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xKey} hide />
        <YAxis type="number" domain={['auto', 'auto']} hide />
        {/* Declared before the area so the stroke crosses over it rather than
            being cut by it. Neutral, because the colour on this chart already
            means direction and this line is what direction is measured from. */}
        {Number.isFinite(open) && (
          <ReferenceLine
            y={open}
            stroke={theme.palette.surface.marker}
            strokeDasharray="3 3"
          />
        )}
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={1.5}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default memo(BaseAreaChart)
