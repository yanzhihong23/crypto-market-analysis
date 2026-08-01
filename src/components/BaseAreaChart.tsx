import { useEffect, useId, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  Label,
} from 'recharts'
import type { LabelProps } from 'recharts'

export default function BaseAreaChart({
  data,
  xKey,
  yKey,
  label,
  syncId,
  yDataFormatter,
  stroke,
  referenceY,
  width = '99%',
  height = 300,
}: {
  data: { [key: string]: number | string }[]
  xKey: string
  yKey: string
  label?: string
  yDataFormatter?: (val: number) => string
  /**
   * Overrides the red/green the series would otherwise take from its own
   * direction. Anything that is not a price has to pass one: on this palette
   * red and green mean the market moved, and a rising long/short ratio is not
   * the market moving.
   */
  stroke?: string
  /** A level the series is read against, e.g. zero for a funding rate. */
  referenceY?: number
  width?: number | `${number}%`
  height?: number | `${number}%`
  syncId?: string
}) {
  const [isUp, setIsUp] = useState(true)
  const theme = useTheme()
  // Unique per instance: a fixed id makes every chart on the page resolve to
  // the first one's <defs>.
  const gradientId = `area-${useId().replace(/:/g, '')}`
  const color =
    stroke ??
    (isUp
      ? theme.vars.palette.market.upChart
      : theme.vars.palette.market.downChart)
  const axisColor = theme.vars.palette.text.secondary
  // Axes are chrome, not data. At the inherited size a sub-cent price needs
  // more than a fifth of a small chart's width just to print its own scale.
  const tickStyle = { fill: axisColor, fontSize: 11 }

  const renderLabel = ({
    index,
    value,
    x,
    y,
  }: LabelProps & { index?: number }) => {
    if (index === data.length - 1) {
      return (
        <text x={x} y={y} dx={-66} dy={-10} fill={color}>
          {yDataFormatter ? yDataFormatter(Number(value)) : value}
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
        {/* Recharts defaults its axes to a fixed grey that all but disappears
            against the dark scheme's background. */}
        <XAxis dataKey={xKey} stroke={axisColor} tick={tickStyle}>
          <Label value={label} offset={10} position="bottom" fill={axisColor} />
        </XAxis>
        <YAxis
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={yDataFormatter}
          stroke={axisColor}
          tick={tickStyle}
          // Wider than the 60px default, which cut the leading digit off any
          // tick as long as a sub-cent price: `0.002175` is eight characters
          // and every small cap on the board quotes at that scale.
          width={76}
        />
        <Tooltip
          wrapperStyle={{ border: 'none' }}
          contentStyle={{
            border: `1px solid ${theme.vars.palette.surface.border}`,
            borderRadius: 8,
            background: theme.vars.palette.background.paper,
            color: theme.vars.palette.text.primary,
          }}
        />
        {/* Declared before the area so the stroke crosses over it. */}
        {referenceY !== undefined && (
          <ReferenceLine
            y={referenceY}
            stroke={theme.vars.palette.surface.marker}
            strokeDasharray="3 3"
          />
        )}
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
