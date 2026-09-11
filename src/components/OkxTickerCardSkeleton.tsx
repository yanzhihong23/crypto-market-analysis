import {
  Box,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemoveOutlined'
import { memo } from 'react'

import { useMessages } from '../i18n'

import TickerContainer from './TickerContainer'
import { cardActionBarSx, removeButtonSx } from './cardActionBarSx'

/** The metric chips are pills, and a rounded rectangle here reads as a button. */
const chipSx = { borderRadius: 11 } as const

/**
 * Mirrors the real card row for row, so a card still waiting on its first
 * message holds its own space and the grid does not jump when the data lands.
 * The card used to render its empty strings instead, which showed up as a blank
 * card with NaN in the metrics.
 *
 * Row for row means in the card's own order — header, price, range, chart,
 * chips — and at the card's own sizes. It is worth restating because the two
 * drifted apart once: the chips moved below the sparkline on the card and
 * stayed above it here, so a skeleton and its neighbour disagreed about what
 * the card even looks like, which is the one thing a placeholder is for.
 *
 * The symbol is known before any price is, so it is shown rather than blocked
 * out: it tells the reader which ticker they are waiting on.
 */
function OkxTickerCardSkeleton({
  symbol,
  onRemove,
}: {
  symbol: string
  onRemove?: () => void
}) {
  const t = useMessages()

  return (
    <TickerContainer pending minWidth={236}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'center', gap: 1, minWidth: 0 }}
        >
          <Skeleton variant="circular" width={24} height={24} />
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            {symbol}
          </Typography>
        </Stack>

        {/* The change, in both of the readings the card gives it. */}
        <Stack sx={{ alignItems: 'end' }}>
          <Skeleton variant="text" width={62} sx={{ fontSize: 20 }} />
          <Skeleton
            variant="text"
            width={44}
            sx={{ fontSize: 12, lineHeight: 1.2 }}
          />
        </Stack>
      </Stack>

      {/* The price and the size of the print that set it, which sit on one
          baseline at opposite ends of the card. */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Skeleton
          variant="text"
          width="55%"
          sx={{ fontSize: 32, lineHeight: 1.15 }}
        />
        <Skeleton variant="text" width={34} sx={{ fontSize: 13 }} />
      </Stack>

      <Stack
        sx={{
          gap: 0.75,
        }}
      >
        {/* The low and the high, not one bar across the card: the range is two
            numbers with a gap between them, and a single block here read as a
            headline the card does not have. */}
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <Skeleton variant="text" width={48} sx={{ fontSize: 12 }} />
          <Skeleton variant="text" width={48} sx={{ fontSize: 12 }} />
        </Stack>
        <Skeleton variant="rounded" height={3} />
        {/* The month under the day, thinner and pulled up the way the real
            track is. Every card on a board that has been open a moment carries
            it, so leaving it out is six pixels the card grows by the moment its
            data lands. */}
        <Skeleton variant="rounded" height={2} sx={{ mt: -0.25 }} />
      </Stack>

      {/* Remove is the one action this card can still answer, and the only one
          it needs: a delisted contract never sends a first message, so it sat
          here as a skeleton with no way off the board short of clearing the
          saved watchlist. The bar is where the real card's is, over the chart,
          and appears on the same hover. */}
      <Box sx={{ position: 'relative' }}>
        <Skeleton variant="rounded" height={100} />

        {onRemove && (
          <Stack direction="row" className="actionBar" sx={cardActionBarSx}>
            <Tooltip title={t.card.remove} arrow>
              <IconButton
                size="small"
                aria-label={t.card.removeAria}
                onClick={onRemove}
                sx={removeButtonSx}
              >
                <BookmarkRemoveIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {/* Four, at the chip's own height and its own pill radius, wrapping the
          way the real row does. Three rounded blocks in the wrong place is what
          the card used to put here, above the sparkline the chips had long since
          moved below. */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.75,
        }}
      >
        <Skeleton variant="rounded" width={42} height={22} sx={chipSx} />
        <Skeleton variant="rounded" width={41} height={22} sx={chipSx} />
        <Skeleton variant="rounded" width={48} height={22} sx={chipSx} />
        <Skeleton variant="rounded" width={70} height={22} sx={chipSx} />
      </Stack>
    </TickerContainer>
  )
}

export default memo(OkxTickerCardSkeleton)
