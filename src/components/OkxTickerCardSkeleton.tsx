import { Skeleton, Stack, Typography } from '@mui/material'
import { memo } from 'react'

import TickerContainer from './TickerContainer'

/**
 * Mirrors the real card row for row, so a card still waiting on its first
 * message holds its own space and the grid does not jump when the data lands.
 * The card used to render its empty strings instead, which showed up as a blank
 * card with NaN in the metrics.
 *
 * The symbol is known before any price is, so it is shown rather than blocked
 * out: it tells the reader which ticker they are waiting on.
 */
function OkxTickerCardSkeleton({ symbol }: { symbol: string }) {
  return (
    <TickerContainer pending minWidth={236}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1,
        }}
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
        <Skeleton variant="text" width={62} sx={{ fontSize: 20, ml: 'auto' }} />
      </Stack>

      <Skeleton variant="text" width="65%" sx={{ fontSize: 32 }} />

      <Stack
        sx={{
          gap: 0.75,
        }}
      >
        <Skeleton variant="text" width="100%" sx={{ fontSize: 12 }} />
        <Skeleton variant="rounded" height={3} />
      </Stack>

      <Stack
        direction="row"
        sx={{
          gap: 0.75,
        }}
      >
        <Skeleton variant="rounded" width={46} height={22} />
        <Skeleton variant="rounded" width={38} height={22} />
        <Skeleton variant="rounded" width={46} height={22} />
      </Stack>

      <Skeleton variant="rounded" height={100} />
    </TickerContainer>
  )
}

export default memo(OkxTickerCardSkeleton)
