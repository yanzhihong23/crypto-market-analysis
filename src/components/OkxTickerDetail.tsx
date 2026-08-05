import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import { useId, useState } from 'react'
import { format } from 'date-fns'

import useOkxTicker from '../hooks/useOkxTicker'
import useOkxBackdrop from '../hooks/useOkxBackdrop'
import useOkxTickerDetail, {
  DETAIL_TOOLTIP_FORMAT,
  DetailWindow,
  FUNDING_TICK_FORMAT,
  type SeriesPoint,
} from '../hooks/useOkxTickerDetail'
import { compactNumberFormatter, formatNumber } from '../utils'
import { numericFont } from '../fonts'
import { useMessages } from '../i18n'
import type { Messages } from '../i18n/en'

import BaseAreaChart, { type SyncMethod } from './BaseAreaChart'
import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'
import SymbolAvatar from './SymbolAvatar'
import OkxMarketMetrics from './OkxMarketMetrics'
import TimeframeGrid from './TimeframeGrid'
import PositionTrack from './PositionTrack'

const windowOptions = (t: Messages): SegmentedOption<DetailWindow>[] => [
  { value: DetailWindow.DAY, label: t.detail.window24h },
  { value: DetailWindow.THREE_DAYS, label: t.detail.window3d },
  { value: DetailWindow.MONTH, label: t.detail.window30d },
]

/**
 * The three charts the window governs do not sample at the same rate — quarter
 * hour candles against five minute ratio rows against hourly open interest — so
 * recharts' default, which carries the cursor across by position in the array,
 * would leave each chart pointing at a different hour. The x value is the
 * timestamp itself, so the cursor can be carried across by time.
 */
const syncByTime: SyncMethod = (ticks, { activeLabel }) => {
  const target = Number(activeLabel)
  if (ticks.length < 2 || Number.isNaN(target)) return -1

  let nearest = -1
  let distance = Infinity
  ticks.forEach((tick, index) => {
    const gap = Math.abs(Number(tick.value) - target)
    if (gap < distance) {
      distance = gap
      nearest = index
    }
  })

  // A series that does not reach as far back as the one being hovered would
  // otherwise pin its cursor to whichever end is closest, hours away from the
  // moment being read. Past its own sampling step there is nothing to point at.
  const step = Math.abs(Number(ticks[1].value) - Number(ticks[0].value))
  return distance > step ? -1 : nearest
}

/**
 * What has been true of this instrument for weeks, beside what the periods are
 * doing right now.
 *
 * This started as a debug readout — `30d 50%` and a row of labels — which was
 * the right thing while nothing else drew from the layer and the wrong thing
 * once the dialog had room. Half of a range is only worth saying if the range
 * is said too, so the month's low and high are here rather than implied, and
 * each reading gets the sentence it wrote for itself instead of its chip.
 */
function BackdropPanel({ instId }: { instId: string }) {
  const backdrop = useOkxBackdrop(instId)
  const t = useMessages()

  return (
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
        {t.backdrop.title}
      </Typography>

      {backdrop.rangePosition === null ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {t.backdrop.pending}
        </Typography>
      ) : (
        <Stack sx={{ gap: 0.5 }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 1, minHeight: 22 }}
          >
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {t.backdrop.rangeLabel}
            </Typography>
            <Typography sx={{ fontSize: 13, ...numericFont }}>
              {Math.round(backdrop.rangePosition * 100)}%
            </Typography>
            <PositionTrack position={backdrop.rangePosition} />
            {backdrop.range && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  ...numericFont,
                }}
              >
                {formatNumber(backdrop.range.low, 6)} –{' '}
                {formatNumber(backdrop.range.high, 6)}
              </Typography>
            )}
          </Stack>

          {/* The sentence rather than the chip. The card has room for one of
              these at a time and shows the short form; this is the surface
              somebody opened to read them. */}
          {backdrop.readings.map((reading) => (
            <Typography
              key={reading.kind}
              sx={{ fontSize: 12, color: 'text.secondary' }}
            >
              {reading.detail}
            </Typography>
          ))}
        </Stack>
      )}
    </Box>
  )
}

function ChartSection({
  title,
  note,
  data,
  stroke,
  referenceY,
  height,
  syncId,
  volumeKey,
  valueName,
  xDataFormatter,
  xTooltipFormatter,
  yDataFormatter,
  tooltipFormatter,
  volumeFormatter,
}: {
  title: string
  note?: string
  data: SeriesPoint[]
  stroke?: string
  referenceY?: number
  height: number
  /** Passed by the charts that share the window, and so share a cursor. */
  syncId?: string
  volumeKey?: string
  valueName?: string
  xDataFormatter: (value: number) => string
  xTooltipFormatter?: (value: number) => string
  yDataFormatter?: (value: number) => string
  tooltipFormatter?: (value: number) => string
  volumeFormatter?: (value: number) => string
}) {
  const t = useMessages()

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1, mb: 0.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{title}</Typography>
        {note && (
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {note}
          </Typography>
        )}
      </Stack>
      {data.length ? (
        <BaseAreaChart
          data={data}
          xKey="time"
          yKey="value"
          volumeKey={volumeKey}
          valueName={valueName}
          height={height}
          stroke={stroke}
          referenceY={referenceY}
          syncId={syncId}
          syncMethod={syncByTime}
          xDataFormatter={xDataFormatter}
          xTooltipFormatter={xTooltipFormatter}
          yDataFormatter={yDataFormatter}
          tooltipFormatter={tooltipFormatter}
          volumeFormatter={volumeFormatter}
        />
      ) : (
        <Typography
          sx={{
            fontSize: 13,
            color: 'text.secondary',
            py: 4,
            textAlign: 'center',
          }}
        >
          {t.detail.empty}
        </Typography>
      )}
    </Box>
  )
}

/**
 * The card is a glance; this is the look that follows it. Every reading the
 * card compresses to a single number — the price, the crowd's positioning, what
 * it is paying, how much of it is open — is here as the series it came from.
 *
 * Price, positioning and open interest run over the chosen window and share a
 * cursor, so a move in one can be read against the others at the same moment.
 * Funding answers to the exchange's settlement schedule instead, so it sits
 * last, below the three the window governs and out of their company.
 */
export default function OkxTickerDetail({
  instId,
  open,
  onClose,
}: {
  instId: string
  open: boolean
  onClose: () => void
}) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [detailWindow, setDetailWindow] = useState(DetailWindow.DAY)
  const ticker = useOkxTicker(instId)
  // Nothing is fetched until the dialog is open, so a board of thirty cards
  // does not carry thirty sets of history it will never show.
  const detail = useOkxTickerDetail(instId, detailWindow, open)
  const t = useMessages()
  // Per dialog: two of these open at once would otherwise hand each other a
  // cursor for a symbol the other is not showing.
  const windowSyncId = useId()

  const [symbol, ...rest] = instId.split('-')
  const neutral = theme.vars.palette.primary.main
  const formatWindowTime = (value: number) => format(value, detail.tickFormat)
  const formatTooltipTime = (value: number) =>
    format(value, DETAIL_TOOLTIP_FORMAT)
  // A tooltip reads one figure rather than a scale, so it can afford the unit
  // the axis has to leave to the heading.
  const inCoin = (value: string) => `${value} ${symbol}`

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      slotProps={{
        paper: {
          sx: {
            border: `1px solid ${theme.vars.palette.surface.border}`,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 2, px: 3, pt: 2.5, pb: 1.5 }}
      >
        <SymbolAvatar instId={instId} size={28} />
        <Stack sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
            {symbol}
          </Typography>
          <Typography
            sx={{ fontSize: 12, color: 'text.secondary', ...numericFont }}
          >
            {rest.join('-')}
          </Typography>
        </Stack>

        {/* The live price stays on the dialog: the charts are history, and
            without it the price you are looking at is the one from whenever the
            candles were fetched. */}
        <Stack sx={{ alignItems: 'end', ml: 'auto' }}>
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 600,
              color: ticker.color,
              ...numericFont,
            }}
          >
            {ticker.last}
          </Typography>
          <Typography
            sx={{ fontSize: 13, color: ticker.color, ...numericFont }}
          >
            {+ticker.percent > 0 ? '+' : ''}
            {ticker.percent}% {ticker.dif}
          </Typography>
        </Stack>

        <IconButton
          aria-label={t.common.close}
          onClick={onClose}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          px: 3,
          pb: 1.5,
        }}
      >
        <OkxMarketMetrics instId={instId} />
        <SegmentedToggle
          label={t.detail.window}
          value={detailWindow}
          options={windowOptions(t)}
          onChange={setDetailWindow}
        />
      </Stack>

      <DialogContent sx={{ px: 3, pb: 3, pt: 0 }}>
        {detail.loading && !detail.price.length ? (
          <Stack sx={{ alignItems: 'center', py: 10 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : detail.failed ? (
          <Typography
            sx={{
              fontSize: 13,
              color: 'text.secondary',
              py: 10,
              textAlign: 'center',
            }}
          >
            {t.detail.failed}
          </Typography>
        ) : (
          <Stack sx={{ gap: 2.5 }}>
            {/* Above the charts, and neither governed by the window selector:
                the periods and the month are the frame a chart is read inside,
                so they come before it, and changing which stretch the charts
                cover does not change what the hour has been doing.

                Side by side on anything wide enough, because each is a short
                column and one of them alone left the other half of the row
                empty. Stacked below that, where two columns would be four
                characters each. */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={{ gap: { xs: 2, sm: 4 }, alignItems: 'flex-start' }}
            >
              <Box sx={{ flex: '0 1 auto', minWidth: 0 }}>
                <TimeframeGrid instId={instId} open={open} />
              </Box>
              <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                <BackdropPanel instId={instId} />
              </Box>
            </Stack>
            <ChartSection
              title={t.detail.price}
              note={t.detail.priceNote}
              data={detail.price}
              height={220}
              syncId={windowSyncId}
              volumeKey="volume"
              xDataFormatter={formatWindowTime}
              xTooltipFormatter={formatTooltipTime}
              yDataFormatter={(value) => formatNumber(value, 6)}
              volumeFormatter={(value) => inCoin(compactNumberFormatter(value))}
            />
            {/* Everything below is a positioning reading, and none of them is a
                price move, so none of them takes the price's red and green. */}
            <ChartSection
              title={t.detail.ratio}
              note={t.detail.ratioNote}
              data={detail.ratio}
              stroke={neutral}
              referenceY={1}
              height={150}
              syncId={windowSyncId}
              valueName={t.chart.ratio}
              xDataFormatter={formatWindowTime}
              xTooltipFormatter={formatTooltipTime}
              yDataFormatter={(value) => value.toFixed(2)}
            />
            <ChartSection
              title={t.detail.openInterest(symbol)}
              data={detail.openInterest}
              stroke={neutral}
              height={150}
              syncId={windowSyncId}
              valueName={t.chart.openInterest}
              xDataFormatter={formatWindowTime}
              xTooltipFormatter={formatTooltipTime}
              yDataFormatter={(value) => compactNumberFormatter(value)}
              tooltipFormatter={(value) => inCoin(formatNumber(value))}
            />
            {/* Last, and on its own: settlements are the exchange's schedule,
                not the window, so this one covers a different stretch of time
                from the three above and cannot share their cursor. */}
            <ChartSection
              title={t.detail.funding}
              note={t.detail.fundingNote(detail.funding.length)}
              data={detail.funding}
              stroke={neutral}
              referenceY={0}
              height={150}
              valueName={t.chart.funding}
              xDataFormatter={(value) => format(value, FUNDING_TICK_FORMAT)}
              yDataFormatter={(value) => value.toFixed(1)}
              // Signed, like the rate on the card: which side is paying is most
              // of what a funding reading says, and around zero the sign is the
              // only thing that carries it.
              tooltipFormatter={(value) =>
                `${value > 0 ? '+' : ''}${value.toFixed(2)}‱`
              }
            />
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
