import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { memo, useMemo, useCallback, useState, type MouseEvent } from 'react'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemoveOutlined'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'

import useOkxTicker from '../hooks/useOkxTicker'
import {
  useFundingBaseline,
  useFundingRate,
  useRatio,
} from '../hooks/useTickerField'
import { deviationFrom, isFlagged } from '../utils/signals'
import { useTickerStore } from '../store/useTickerStore'
import { removeOkxTicker } from '../store/okxRealtimeTicker'
import { okxTickerActions } from '../okx/okxTickerActions'
import { numericFont } from '../fonts'

import OkxKlineChart from './OkxKlineChart'
import TickerContainer from './TickerContainer'
import LastPrice from './LastPrice'
import PriceRange from './PriceRange'
import OkxMarketMetrics from './OkxMarketMetrics'
import OkxLogoSymbol from './OkxLogoSymbol'
import OkxTickerCardSkeleton from './OkxTickerCardSkeleton'
import OkxTickerDetail from './OkxTickerDetail'

/**
 * Over the sparkline rather than pinned to the card's bottom edge, which is
 * where the chips now sit. The chart is the one thing on the card that can
 * afford to be covered: it is the shape of the session, and the buttons are only
 * up while a cursor is on the card.
 */
const actionBarSx = {
  position: 'absolute',
  inset: 0,
  px: 2,
  zIndex: 3,
  display: 'none',
  alignItems: 'center',
  justifyContent: 'end',
  gap: 1,
  // The blur alone separates the button from the sparkline behind it; the white
  // wash that used to sit here inverted badly in the dark scheme.
  backdropFilter: 'blur(2px)',
} as const

/**
 * Its own component so that it renders when the pin changes and not otherwise.
 * Inline on the card it was rebuilt on every ticker message — three tooltips,
 * three buttons and a popper each, for chrome that is hidden until a cursor
 * arrives and says nothing about the price. It was the single largest share of
 * the board's render work.
 */
const CardActions = memo(function CardActions({
  pinned,
  onOpenDetail,
  onTogglePin,
  onRemove,
}: {
  pinned: boolean
  onOpenDetail: () => void
  onTogglePin: () => void
  onRemove: () => void
}) {
  // The action bar sits on top of the card, so a click on any of its buttons
  // would otherwise reach the card's own double-click handler as well.
  const stopDoubleClick = useCallback((event: MouseEvent) => {
    event.stopPropagation()
  }, [])

  return (
    <Stack
      direction="row"
      className="actionBar"
      sx={actionBarSx}
      onDoubleClick={stopDoubleClick}
    >
      <Tooltip title="Open charts" arrow>
        <IconButton
          size="small"
          aria-label="Open charts"
          onClick={onOpenDetail}
          sx={{ color: 'text.secondary' }}
        >
          <QueryStatsIcon />
        </IconButton>
      </Tooltip>
      {/* The pin is reachable by double-clicking the card, which nothing on the
          card announces; this is where that gesture is discoverable. */}
      <Tooltip title={pinned ? 'Unpin' : 'Pin to front'} arrow>
        <IconButton
          size="small"
          aria-label={pinned ? 'Unpin ticker' : 'Pin ticker to front'}
          onClick={onTogglePin}
          sx={{ color: pinned ? 'primary.main' : 'text.secondary' }}
        >
          {pinned ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </Tooltip>
      {/* Neutral until it is pointed at. The theme's destructive red is the same
          hex as its price-down red, so carrying it permanently put a third red
          on a card that is already coloured by direction; on hover it is
          unambiguous, because nothing else on the card responds to a cursor
          sitting on it. */}
      <Tooltip title="Remove from watchlist" arrow>
        <IconButton
          size="small"
          aria-label="Remove ticker from watchlist"
          onClick={onRemove}
          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
        >
          <BookmarkRemoveIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  )
})

function OkxTickerCard({ instId }: { instId: string }) {
  const t = useOkxTicker(instId)
  const ratio = useRatio(instId)
  const fundingRate = useFundingRate(instId)
  const fundingBaseline = useFundingBaseline(instId)
  const pinned = useTickerStore((state) => state.pinnedInstIds.includes(instId))
  // Opening the detail is deliberately a button rather than a click on the
  // card: the card already answers a double-click by pinning, and a single
  // click that opened a dialog would fire on the way to every one of those.
  const [detailOpen, setDetailOpen] = useState(false)

  // The chips carry either reading on its own; the card only claims the ring
  // when both have left their usual range, which is the case worth crossing the
  // grid for.
  const flagged = isFlagged({
    ratioDeviation: ratio?.deviation,
    fundingDeviation: deviationFrom(Number(fundingRate), fundingBaseline),
  })

  // The placeholder ticker carries empty strings until the first message for
  // this instrument arrives, which may never happen for a delisted symbol.
  const ready = t.last !== ''
  const up = useMemo(() => +t.percent > 0, [t.percent])
  const changePercent = useMemo(() => +(+t.percent).toFixed(2), [t.percent])

  const handleRemove = useCallback(() => {
    void okxTickerActions.remove(instId)
    removeOkxTicker(instId)
    useTickerStore.getState().removeInstId(instId)
  }, [instId])

  const handleTogglePin = useCallback(() => {
    useTickerStore.getState().togglePinned(instId)
  }, [instId])

  const handleOpenDetail = useCallback(() => setDetailOpen(true), [])
  const handleCloseDetail = useCallback(() => setDetailOpen(false), [])

  if (!ready) {
    return <OkxTickerCardSkeleton symbol={instId.split('-')[0]} />
  }

  return (
    <TickerContainer
      up={up}
      changePercent={changePercent}
      minWidth={236}
      flagged={flagged}
      onDoubleClick={handleTogglePin}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 2,
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'center', gap: 0.75, minWidth: 0 }}
        >
          <OkxLogoSymbol instId={instId} />
          {pinned && <StarIcon sx={{ fontSize: 14, color: 'primary.main' }} />}
        </Stack>

        {/* Both readings of the same 24h change, so they sit together. */}
        <Stack sx={{ alignItems: 'end' }}>
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 600,
              color: t.color,
              ...numericFont,
            }}
          >
            {+t.percent > 0 ? '+' : ''}
            {t.percent}%
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: t.color,
              lineHeight: 1.2,
              ...numericFont,
            }}
          >
            {t.dif}
          </Typography>
        </Stack>
      </Stack>
      <LastPrice last={t.last} lastSz={t.lastSz} up={t.isUp} />
      <PriceRange
        low={t.low24h}
        high={t.high24h}
        last={t.last}
        open={t.open}
        up={up}
      />

      {/* The action bar is positioned against the chart, so the chart owns the
          containing block rather than the card. */}
      <Box sx={{ position: 'relative' }}>
        <OkxKlineChart instId={instId} />

        <CardActions
          pinned={pinned}
          onOpenDetail={handleOpenDetail}
          onTogglePin={handleTogglePin}
          onRemove={handleRemove}
        />
      </Box>

      <OkxMarketMetrics instId={instId} />

      {/* Mounted only once it has been asked for, so the board does not carry a
          dialog and its four series for every card on it. */}
      {detailOpen && (
        <OkxTickerDetail
          instId={instId}
          open={detailOpen}
          onClose={handleCloseDetail}
        />
      )}
    </TickerContainer>
  )
}

export default memo(OkxTickerCard)
