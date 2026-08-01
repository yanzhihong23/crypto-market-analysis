import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import {
  getLastFeedMessage,
  useConnectionStore,
} from '../store/useConnectionStore'
import { numericFont } from '../fonts'

/** Past this, the feed is up but has stopped saying anything. */
const STALE_AFTER_MS = 10_000

/**
 * On a trading screen, whether the numbers are current is part of the data. The
 * socket reconnects quietly, so without this the page can sit on stale prices
 * that look exactly like live ones.
 *
 * The dot is deliberately not red or green: those two mean price direction
 * everywhere else on the page.
 */
export default function FeedStatus() {
  const status = useConnectionStore((state) => state.status)
  const [staleFor, setStaleFor] = useState(0)

  useEffect(() => {
    if (status !== 'live') {
      setStaleFor(0)
      return
    }
    const tick = () => {
      const last = getLastFeedMessage()
      setStaleFor(last ? Date.now() - last : 0)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [status])

  // Nothing is subscribed on this page, so there is nothing to report.
  if (status === 'idle') return null

  const stale = status === 'live' && staleFor > STALE_AFTER_MS
  const healthy = status === 'live' && !stale

  const label = {
    connecting: 'Connecting',
    reconnecting: 'Reconnecting',
    live: stale ? `Stale ${Math.round(staleFor / 1000)}s` : 'Live',
  }[status]

  return (
    <Tooltip
      title={
        healthy
          ? 'Receiving live updates'
          : 'The price feed is not currently up to date'
      }
      arrow
    >
      <Stack
        direction="row"
        role="status"
        aria-live="polite"
        sx={{
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: healthy ? 'primary.main' : 'secondary.main',
          }}
        />
        <Typography
          sx={[
            {
              fontSize: 13,
              color: 'text.secondary',
            },
            stale && numericFont,
          ]}
        >
          {label}
        </Typography>
      </Stack>
    </Tooltip>
  )
}
