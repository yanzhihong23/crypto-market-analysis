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
import useOkxTickerDetail, {
  DetailWindow,
  FUNDING_TICK_FORMAT,
  type SeriesPoint,
} from '../hooks/useOkxTickerDetail'
import { compactNumberFormatter, formatNumber } from '../utils'
import { numericFont } from '../fonts'

import BaseAreaChart, { type SyncMethod } from './BaseAreaChart'
import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'
import SymbolAvatar from './SymbolAvatar'
import OkxMarketMetrics from './OkxMarketMetrics'

const WINDOW_OPTIONS: SegmentedOption<DetailWindow>[] = [
  { value: DetailWindow.DAY, label: '24H' },
  { value: DetailWindow.THREE_DAYS, label: '3D' },
  { value: DetailWindow.MONTH, label: '30D' },
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

function ChartSection({
  title,
  note,
  data,
  stroke,
  referenceY,
  height,
  syncId,
  xDataFormatter,
  yDataFormatter,
  tooltipFormatter,
}: {
  title: string
  note?: string
  data: SeriesPoint[]
  stroke?: string
  referenceY?: number
  height: number
  /** Passed by the charts that share the window, and so share a cursor. */
  syncId?: string
  xDataFormatter: (value: number) => string
  yDataFormatter?: (value: number) => string
  tooltipFormatter?: (value: number) => string
}) {
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
          height={height}
          stroke={stroke}
          referenceY={referenceY}
          syncId={syncId}
          syncMethod={syncByTime}
          xDataFormatter={xDataFormatter}
          yDataFormatter={yDataFormatter}
          tooltipFormatter={tooltipFormatter}
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
          The exchange has no history for this one
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
  // Per dialog: two of these open at once would otherwise hand each other a
  // cursor for a symbol the other is not showing.
  const windowSyncId = useId()

  const [symbol, ...rest] = instId.split('-')
  const neutral = theme.vars.palette.primary.main
  const formatWindowTime = (value: number) => format(value, detail.tickFormat)

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
          aria-label="Close"
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
          label="Window"
          value={detailWindow}
          options={WINDOW_OPTIONS}
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
            Could not reach the exchange for this symbol's history
          </Typography>
        ) : (
          <Stack sx={{ gap: 2.5 }}>
            <ChartSection
              title="Price"
              data={detail.price}
              height={220}
              syncId={windowSyncId}
              xDataFormatter={formatWindowTime}
              yDataFormatter={(value) => formatNumber(value, 6)}
            />
            {/* Everything below is a positioning reading, and none of them is a
                price move, so none of them takes the price's red and green. */}
            <ChartSection
              title="Long/short account ratio"
              note="1 is an even crowd"
              data={detail.ratio}
              stroke={neutral}
              referenceY={1}
              height={150}
              syncId={windowSyncId}
              xDataFormatter={formatWindowTime}
              yDataFormatter={(value) => value.toFixed(2)}
            />
            <ChartSection
              title={`Open interest, in ${symbol}`}
              data={detail.openInterest}
              stroke={neutral}
              height={150}
              syncId={windowSyncId}
              xDataFormatter={formatWindowTime}
              yDataFormatter={(value) => compactNumberFormatter(value)}
              tooltipFormatter={(value) => formatNumber(value)}
            />
            {/* Last, and on its own: settlements are the exchange's schedule,
                not the window, so this one covers a different stretch of time
                from the three above and cannot share their cursor. */}
            <ChartSection
              title="Funding rate"
              note={`last ${detail.funding.length} settlements, in ‱`}
              data={detail.funding}
              stroke={neutral}
              referenceY={0}
              height={150}
              xDataFormatter={(value) => format(value, FUNDING_TICK_FORMAT)}
              yDataFormatter={(value) => value.toFixed(1)}
            />
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
