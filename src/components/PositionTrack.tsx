import { Box } from '@mui/material'

const MARKER_WIDTH = 3
const TRACK_HEIGHT = 3
const MARKER_HEIGHT = 7

/**
 * Where a price sits between two extremes, as a track with a marker.
 *
 * By now this is the board's word for "where in a range": the dialog draws each
 * period's own range with it and the month's underneath them. A surface that
 * answered the same question in a different shape would be a second word for
 * it.
 *
 * The midpoint is drawn because a marker on its own says where the price is
 * without saying whether that is high or low — readable on one track, and not
 * on five stacked in a column, where the eye starts comparing the markers to
 * each other instead of each to its own range. One hairline gives every row the
 * same thing to be measured against.
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
        height: TRACK_HEIGHT,
        borderRadius: 1,
        backgroundColor: 'surface.subtle',
        flexShrink: 0,
      }}
    >
      {/* Taller than the track it crosses, so it reads as a tick rather than as
          a patch of the track in a slightly different grey. */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: -1,
          width: '1px',
          height: TRACK_HEIGHT + 2,
          backgroundColor: 'surface.border',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: -(MARKER_HEIGHT - TRACK_HEIGHT) / 2,
          // Nudged back by its own width at the far end, so a marker at the top
          // of the range stays inside the track it belongs to.
          left: `calc(${ratio * 100}% - ${ratio * MARKER_WIDTH}px)`,
          width: MARKER_WIDTH,
          height: MARKER_HEIGHT,
          borderRadius: 1,
          backgroundColor: 'surface.marker',
        }}
      />
    </Box>
  )
}
