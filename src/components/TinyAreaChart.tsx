import { memo, useId, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  ResponsiveContainer,
  AreaChart,
  ComposedChart,
  Area,
  Bar,
  ReferenceLine,
  YAxis,
  XAxis,
} from 'recharts'

function BaseAreaChart({
  data,
  xKey,
  yKey,
  volumeKey,
  width = '99%',
  height = 300,
}: {
  data: { [key: string]: number | string }[]
  xKey: string
  yKey: string
  /**
   * When set, volume rides under the series as a background histogram: no axis,
   * no tooltip, no scale. At this size a bar cannot be read as a figure — the
   * card carries the day's total as a chip for that — so this is only here to
   * say which stretch of the session the trading happened in.
   */
  volumeKey?: string
  label?: string
  width?: number | `${number}%`
  height?: number | `${number}%`
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
    ? theme.vars.palette.market.upChart
    : theme.vars.palette.market.downChart

  // Concrete numbers only: a domain callback that recharts re-invokes on every
  // layout pass was enough to hang the renderer when the detail chart hosted
  // volume bars, and this one runs once per card on the board.
  const volumeDomain = useMemo((): [number, number] | undefined => {
    if (!volumeKey || !data.length) return undefined
    let peak = 0
    for (const row of data) {
      const n = Number(row[volumeKey])
      if (Number.isFinite(n) && n > peak) peak = n
    }
    return [0, (peak || 1) * 4]
  }, [data, volumeKey])

  // Recharts wants every axis and every series to agree on ids the moment a
  // second axis exists, and to leave them all undefined when it does not.
  const valueAxis = volumeKey ? 'value' : undefined
  const Chart = volumeKey ? ComposedChart : AreaChart

  return (
    <ResponsiveContainer width={width} height={height}>
      <Chart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xKey} hide />
        <YAxis
          yAxisId={valueAxis}
          type="number"
          domain={['auto', 'auto']}
          hide
        />
        {/* Four times the peak parks the tallest bar a quarter of the way up,
            which is as far as it can go before it starts reading as the chart
            rather than as its background. */}
        {volumeKey && volumeDomain && (
          <YAxis
            yAxisId="volume"
            orientation="right"
            domain={volumeDomain}
            allowDataOverflow
            hide
          />
        )}
        {/* Declared before the area so the stroke crosses over it rather than
            being cut by it. Neutral, because the colour on this chart already
            means direction and this line is what direction is measured from. */}
        {Number.isFinite(open) && (
          <ReferenceLine
            yAxisId={valueAxis}
            y={open}
            stroke={theme.vars.palette.surface.marker}
            strokeDasharray="3 3"
          />
        )}
        {/* Under the area, and neutral: the bars are texture, and the one
            colour on this chart already means the direction of the price. */}
        {volumeKey && (
          <Bar
            yAxisId="volume"
            dataKey={volumeKey}
            fill={theme.vars.palette.text.secondary}
            fillOpacity={0.25}
            isAnimationActive={false}
          />
        )}
        {/* Off, like the bars behind it. Recharts starts its animation from a
            state update inside the render it is mounted in, and every card on
            the board re-renders together whenever a symbol is added or removed
            — thirty of those in one pass is more nested updates than React
            allows, and the whole board came down with error #185. It bought
            nothing either: the line is redrawn every minute by the candle poll,
            so the sweep was running over a shape that had barely moved. */}
        <Area
          yAxisId={valueAxis}
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={1.5}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          activeDot={false}
          isAnimationActive={false}
        />
      </Chart>
    </ResponsiveContainer>
  )
}

export default memo(BaseAreaChart)
