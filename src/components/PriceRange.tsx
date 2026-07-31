import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { memo, useCallback, type CSSProperties } from 'react'

import { numericFont } from '../fonts'

const MARKER_WIDTH = 3

/**
 * The 24h range used to be plain text, which left the reader to work out where
 * the current price sat inside it. The track answers that at a glance: hard
 * left means the price is pinned to the low, hard right means it is at the high.
 */
function PriceRange({
  low,
  high,
  last,
  reference,
  up,
}: {
  low: string
  high: string
  last: string
  /** Optional secondary value, such as a 24h weighted average. */
  reference?: string
  up?: boolean
}) {
  const positionOf = useCallback(
    (value: string | undefined) => {
      const lo = Number(low)
      const hi = Number(high)
      const cur = Number(value)
      if (
        value === undefined ||
        !Number.isFinite(lo) ||
        !Number.isFinite(hi) ||
        !Number.isFinite(cur)
      ) {
        return null
      }
      // A flat 24h leaves nowhere meaningful to put the marker.
      if (hi <= lo) return 0.5
      return Math.min(Math.max((cur - lo) / (hi - lo), 0), 1)
    },
    [low, high],
  )

  const position = positionOf(last)
  const referencePosition = positionOf(reference)

  // Nudged back by its own width at the far end so a marker stays inside the
  // track when the price is sitting on the high.
  //
  // This rides in on a custom property set through the plain `style` attribute
  // rather than through `sx`: the price changes on every ticker message, and
  // emotion mints a class per distinct value, so an `sx` offset would grow the
  // document a stylesheet at a time for as long as the board stays open.
  const offset = (ratio: number) =>
    ({
      '--marker-left': `calc(${ratio * 100}% - ${ratio * MARKER_WIDTH}px)`,
    }) as CSSProperties

  return (
    <Stack gap={0.75}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
      >
        <Typography fontSize={12} color="text.secondary" sx={numericFont}>
          {low}
        </Typography>
        <Typography fontSize={12} color="text.secondary" sx={numericFont}>
          {high}
        </Typography>
      </Stack>
      <Box
        role="presentation"
        sx={{
          position: 'relative',
          height: 3,
          borderRadius: 1.5,
          backgroundColor: 'surface.subtle',
        }}
      >
        {referencePosition !== null && (
          <Tooltip title={`Weighted average ${reference}`} arrow>
            <Box
              style={offset(referencePosition)}
              sx={{
                position: 'absolute',
                top: -1,
                left: 'var(--marker-left)',
                width: MARKER_WIDTH,
                height: 5,
                borderRadius: 1,
                backgroundColor: 'surface.marker',
              }}
            />
          </Tooltip>
        )}
        {position !== null && (
          <Box
            style={offset(position)}
            sx={{
              position: 'absolute',
              top: -2,
              left: 'var(--marker-left)',
              width: MARKER_WIDTH,
              height: 7,
              borderRadius: 1,
              backgroundColor: up ? 'market.up' : 'market.down',
              // Separates the marker from the track behind it at this size.
              boxShadow: (theme) =>
                `0 0 0 1.5px ${theme.vars.palette.background.paper}`,
              transition: 'left 0.3s ease-out',
            }}
          />
        )}
      </Box>
    </Stack>
  )
}

export default memo(PriceRange)
