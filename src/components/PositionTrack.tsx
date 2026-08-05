import { Box } from '@mui/material'

const MARKER_WIDTH = 3

/**
 * Where a price sits between two extremes, as a track with a marker.
 *
 * By now this is the board's word for "where in a range": the card draws the
 * day and the month with it, and the dialog draws each period's own range and
 * the month again. A surface that answered the same question in a different
 * shape would be a second word for it.
 *
 * Never coloured by direction. Red and green here mean the market moved, and a
 * position inside a range is not a movement — the neutral marker is the point
 * rather than a shortage of colour.
 */
export default function PositionTrack({
  position,
  width = 44,
}: {
  /** 0 to 1; anything outside is clamped to the ends of the track. */
  position: number
  width?: number
}) {
  const ratio = Math.min(Math.max(position, 0), 1)

  return (
    <Box
      role="presentation"
      sx={{
        position: 'relative',
        width,
        height: 2,
        borderRadius: 1,
        backgroundColor: 'surface.subtle',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -1,
          // Nudged back by its own width at the far end, so a marker at the top
          // of the range stays inside the track it belongs to.
          left: `calc(${ratio * 100}% - ${ratio * MARKER_WIDTH}px)`,
          width: MARKER_WIDTH,
          height: 4,
          borderRadius: 1,
          backgroundColor: 'surface.marker',
        }}
      />
    </Box>
  )
}
