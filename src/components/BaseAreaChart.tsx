import { useEffect, useId, useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  ResponsiveContainer,
  AreaChart,
  ComposedChart,
  Area,
  Bar,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  Label,
} from 'recharts'
import type { LabelProps, TickItem } from 'recharts'

/**
 * Recharts does not export the type; this is the shape of the callback form,
 * narrowed to the one field of the source chart's state a caller here needs.
 */
export type SyncMethod = (
  ticks: ReadonlyArray<TickItem>,
  data: { activeLabel: string | number | undefined },
) => number

export default function BaseAreaChart({
  data,
  xKey,
  yKey,
  volumeKey,
  label,
  syncId,
  syncMethod,
  xDataFormatter,
  yDataFormatter,
  tooltipFormatter,
  volumeFormatter,
  stroke,
  referenceY,
  width = '99%',
  height = 300,
}: {
  data: { [key: string]: number | string }[]
  xKey: string
  yKey: string
  /** When set, volume rides under the series as bars on a hidden axis. */
  volumeKey?: string
  label?: string
  /** For an x value that is not already what the axis should read, e.g. a raw
   * timestamp. It labels the tooltip too, so the two never disagree. */
  xDataFormatter?: (val: number) => string
  yDataFormatter?: (val: number) => string
  /**
   * How the tooltip reads a value, when the axis's own reading is too coarse
   * for a single figure — a compact scale says `31.2k` whether open interest
   * moved by a hundred contracts or not at all. Defaults to the axis's.
   */
  tooltipFormatter?: (val: number) => string
  /** How the tooltip reads volume when `volumeKey` is set. */
  volumeFormatter?: (val: number) => string
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
  /** How a synced chart finds the point the cursor is on. Defaults to the
   * position in the array, which only holds when the series line up row for
   * row. */
  syncMethod?: SyncMethod
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
  const volumeColor = theme.vars.palette.surface.marker
  const valueFormatter = tooltipFormatter ?? yDataFormatter
  // Axes are chrome, not data. At the inherited size a sub-cent price needs
  // more than a fifth of a small chart's width just to print its own scale.
  const tickStyle = { fill: axisColor, fontSize: 11 }

  // Concrete numbers only: a domain callback that recharts re-invokes on every
  // layout pass was enough to hang the renderer when the price chart hosted
  // volume bars (Chrome error code 5 / OOM).
  const volumeDomain = useMemo((): [number, number] | undefined => {
    if (!volumeKey || !data.length) return undefined
    let peak = 0
    for (const row of data) {
      const n = Number(row[volumeKey])
      if (Number.isFinite(n) && n > peak) peak = n
    }
    return [0, (peak || 1) * 4]
  }, [data, volumeKey])

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

  const Chart = volumeKey ? ComposedChart : AreaChart

  return (
    <ResponsiveContainer width={width} height={height}>
      <Chart
        data={data}
        syncId={syncId}
        syncMethod={syncMethod}
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
        <XAxis
          dataKey={xKey}
          stroke={axisColor}
          tick={tickStyle}
          tickFormatter={xDataFormatter}
        >
          <Label value={label} offset={10} position="bottom" fill={axisColor} />
        </XAxis>
        <YAxis
          yAxisId={volumeKey ? 'value' : undefined}
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
        {/* Hidden scale: bars sit in the bottom quarter so they never crowd the
            price stroke. Four times the peak keeps that ratio without a second
            visible axis. */}
        {volumeKey && volumeDomain && (
          <YAxis
            yAxisId="volume"
            orientation="right"
            domain={volumeDomain}
            allowDataOverflow
            hide
          />
        )}
        <Tooltip
          labelFormatter={
            xDataFormatter
              ? (label) => xDataFormatter(Number(label))
              : undefined
          }
          // Left to itself the tooltip prints the number as it came off the
          // wire, and a figure the exchange computed in floating point reads
          // as `31872.945100000143`.
          formatter={
            volumeKey
              ? (value, name) => {
                  const n = Number(value)
                  if (name === volumeKey) {
                    return [volumeFormatter ? volumeFormatter(n) : n, 'Vol']
                  }
                  return [valueFormatter ? valueFormatter(n) : n, 'Price']
                }
              : valueFormatter
                ? (value) => valueFormatter(Number(value))
                : undefined
          }
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
            yAxisId={volumeKey ? 'value' : undefined}
            y={referenceY}
            stroke={theme.vars.palette.surface.marker}
            strokeDasharray="3 3"
          />
        )}
        {volumeKey && (
          <Bar
            yAxisId="volume"
            dataKey={volumeKey}
            fill={volumeColor}
            fillOpacity={0.55}
            isAnimationActive={false}
            maxBarSize={8}
          />
        )}
        <Area
          yAxisId={volumeKey ? 'value' : undefined}
          type="monotone"
          dataKey={yKey}
          stroke={color}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          label={renderLabel}
          isAnimationActive={!volumeKey}
        />
      </Chart>
    </ResponsiveContainer>
  )
}
