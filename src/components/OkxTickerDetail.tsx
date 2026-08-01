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
import { useState } from 'react'

import useOkxTicker from '../hooks/useOkxTicker'
import useOkxTickerDetail, {
  DetailWindow,
  type SeriesPoint,
} from '../hooks/useOkxTickerDetail'
import { compactNumberFormatter, formatNumber } from '../utils'
import { numericFont } from '../fonts'

import BaseAreaChart from './BaseAreaChart'
import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'
import SymbolAvatar from './SymbolAvatar'
import OkxMarketMetrics from './OkxMarketMetrics'

const WINDOW_OPTIONS: SegmentedOption<DetailWindow>[] = [
  { value: DetailWindow.DAY, label: '24H' },
  { value: DetailWindow.THREE_DAYS, label: '3D' },
  { value: DetailWindow.MONTH, label: '30D' },
]

function ChartSection({
  title,
  note,
  data,
  stroke,
  referenceY,
  height,
  yDataFormatter,
}: {
  title: string
  note?: string
  data: SeriesPoint[]
  stroke?: string
  referenceY?: number
  height: number
  yDataFormatter?: (value: number) => string
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
          yDataFormatter={yDataFormatter}
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
 * it is paying, how much of it is open — is here as the series it came from,
 * over one window so the four can be read against each other.
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

  const [symbol, ...rest] = instId.split('-')
  const neutral = theme.vars.palette.primary.main

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
              yDataFormatter={(value) => value.toFixed(2)}
            />
            <ChartSection
              title="Funding rate"
              note={`last ${detail.funding.length} settlements, in ‱`}
              data={detail.funding}
              stroke={neutral}
              referenceY={0}
              height={150}
              yDataFormatter={(value) => value.toFixed(1)}
            />
            <ChartSection
              title={`Open interest, in ${symbol}`}
              data={detail.openInterest}
              stroke={neutral}
              height={150}
              yDataFormatter={(value) => compactNumberFormatter(value)}
            />
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
