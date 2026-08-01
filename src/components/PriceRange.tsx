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
  open,
  reference,
  up,
}: {
  low: string
  high: string
  last: string
  /**
   * Where the session opened. Given one, the track fills between it and the
   * live price, and that fill is the change: which way it points is the
   * direction, how much of the range it covers is the size.
   */
  open?: string
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
  const openPosition = positionOf(open)

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

  // The run between the open and the live price, in the same coordinates as the
  // markers so its far end lands under the one it reaches. A flat session
  // leaves it one marker wide rather than nothing, which is the honest reading:
  // the price is where it opened.
  const changeOffset = (from: number, to: number) => {
    const start = Math.min(from, to)
    const span = Math.abs(to - from)
    return {
      '--change-left': `calc(${start * 100}% - ${start * MARKER_WIDTH}px)`,
      '--change-width': `calc(${span * 100}% - ${
        span * MARKER_WIDTH - MARKER_WIDTH
      }px)`,
    } as CSSProperties
  }

  return (
    <Stack
      sx={{
        gap: 0.75,
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={[
            {
              fontSize: 12,
              color: 'text.secondary',
            },
            ...(Array.isArray(numericFont) ? numericFont : [numericFont]),
          ]}
        >
          {low}
        </Typography>
        <Typography
          sx={[
            {
              fontSize: 12,
              color: 'text.secondary',
            },
            ...(Array.isArray(numericFont) ? numericFont : [numericFont]),
          ]}
        >
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
        {openPosition !== null && position !== null && (
          <Tooltip title={`Open ${open}`} arrow>
            <Box
              style={changeOffset(openPosition, position)}
              sx={{
                position: 'absolute',
                top: 0,
                left: 'var(--change-left)',
                width: 'var(--change-width)',
                height: '100%',
                borderRadius: 'inherit',
                backgroundColor: up ? 'market.up' : 'market.down',
                transition: 'left 0.3s ease-out, width 0.3s ease-out',
              }}
            />
          </Tooltip>
        )}
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
                // The same ring the live marker carries, for the same reason it
                // needs one more than it used to: this mark spends most of its
                // life inside the coloured run now, and a neutral grey on a
                // saturated up/down fill was the one thing on the track you had
                // to hunt for. Against the ring it reads as a notch cut into
                // the run, which is also what it means — the traded average
                // splits the session's travel in two.
                boxShadow: (theme) =>
                  `0 0 0 1.5px ${theme.vars.palette.background.paper}`,
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
