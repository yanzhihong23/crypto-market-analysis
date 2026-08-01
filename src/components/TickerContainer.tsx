import { Box, Stack, SxProps, Theme } from '@mui/material'
import { memo, useCallback, useMemo, type CSSProperties } from 'react'

/** Above this 24h move a card earns the stronger border and fill. */
const STRONG_MOVE_PERCENT = 5

/** The amplitude rail saturates here, so 10% and 40% look the same. */
const AMPLITUDE_CEILING_PERCENT = 10

/** Card radius, and so the length the stroke spends turning the corner. */
const CORNER_RADIUS = 16

/**
 * Shortest bottom run. Anything under this would end inside the corner curve
 * and leave the turn unfinished, so it is the floor rather than zero.
 */
const MIN_AMPLITUDE_PX = CORNER_RADIUS + 8

/**
 * The rail is quantised to whole percent, so the stroke only redraws when it
 * moves a visible amount. Live prices nudge the 24h change every message, and
 * at full precision each of those was a sub-pixel step that still restarted the
 * width transition and left the browser chaining unfinished interpolations.
 */
function amplitudePercent(changePercent: number) {
  const capped = Math.min(Math.abs(changePercent), AMPLITUDE_CEILING_PERCENT)
  return Math.round(capped * (100 / AMPLITUDE_CEILING_PERCENT))
}

function TickerContainer({
  up,
  changePercent = 0,
  minWidth = 236,
  width,
  borderWidth = 3,
  pending = false,
  flagged = false,
  children,
  sx,
}: {
  up?: boolean
  changePercent?: number
  minWidth?: number
  width?: number
  /** Width of the direction stroke. */
  borderWidth?: number
  /** No data yet, so the card claims no direction. */
  pending?: boolean
  /**
   * Every positioning signal on this card is firing at once, which is rarer and
   * more worth crossing the grid for than either one alone. It takes over the
   * ring; direction still reads off the stroke and the fill, so nothing is lost
   * when a strong mover is also the one the crowd is short.
   */
  flagged?: boolean
  children: React.ReactNode
  sx?: SxProps
}) {
  const strong = !pending && Math.abs(changePercent) >= STRONG_MOVE_PERCENT
  const directionColor = pending
    ? 'surface.border'
    : up
      ? 'market.up'
      : 'market.down'
  // The tinted edge a mover earns, and the one every card shows on hover.
  const edgeColor = useCallback(
    (theme: Theme) =>
      flagged
        ? theme.vars.palette.signal.border
        : pending
          ? theme.vars.palette.surface.border
          : up
            ? theme.vars.palette.market.upBorder
            : theme.vars.palette.market.downBorder,
    [flagged, pending, up],
  )

  // Memoize the large sx object to avoid recreating on every render
  const containerSx = useMemo<SxProps<Theme>>(
    () => ({
      position: 'relative',
      overflow: 'hidden',
      // Fills its grid cell so a row of cards shares one baseline instead of
      // ending wherever its own content happens to stop.
      height: '100%',
      p: 2.5,
      zIndex: 2,
      borderRadius: `${CORNER_RADIUS}px`,
      // Direction lives in one 3px stroke plus a wash of tint. Every card used
      // to carry a full animated gradient outline, which meant no card stood
      // out; now only real movers get the stronger edge and fill.
      backgroundColor: strong
        ? up
          ? 'market.upSurface'
          : 'market.downSurface'
        : 'background.paper',
      // An inset ring rather than a border: a border would push the padding box
      // inwards, and the direction stroke below has to line up with the card's
      // own edge and radius to turn the corner without a seam.
      boxShadow: (theme: Theme) =>
        `inset 0 0 0 1px ${
          strong || flagged
            ? edgeColor(theme)
            : theme.vars.palette.surface.border
        }`,
      transition: 'box-shadow 0.2s ease-out',
      '&:hover': {
        // No transform: a scaling card overlaps its neighbours in a dense grid
        // and forces a repaint of the whole row.
        boxShadow: (theme: Theme) =>
          `${theme.vars.palette.surface.shadow}, inset 0 0 0 1px ${edgeColor(theme)}`,
        '& .actionBar': {
          display: 'flex',
        },
      },
      ...sx,
    }),
    [up, strong, flagged, edgeColor, sx],
  )

  // One stroke along the bottom edge, rising only as far as the corner curve
  // carries it. It used to run the full left edge as well, but that arm stood a
  // second coloured line beside the card's own ring and read as a heavier
  // outline rather than as a reading.
  const amplitude = amplitudePercent(changePercent)

  // The width is the 24h amplitude: the further the stroke runs from the
  // corner, the bigger the move. It used to be cut out of a full-card overlay
  // with clip-path, and that clip rect was the height of the card, so its
  // animated right edge swept a repaint boundary straight down the front of the
  // content. Sizing the element keeps it, and everything it invalidates, along
  // the bottom edge.
  //
  // It travels as a custom property on the plain `style` attribute rather than
  // through `sx`, for the same reason the price marker does: emotion caches a
  // class per distinct value, and a board of live cards works its way through
  // the whole quantised range and leaves a stylesheet behind for each step.
  const directionStrokeStyle = useMemo(
    () =>
      ({
        '--direction-stroke-width': `max(${MIN_AMPLITUDE_PX}px, ${amplitude}%)`,
      }) as CSSProperties,
    [amplitude],
  )

  const directionStrokeSx = useMemo<SxProps<Theme>>(
    () => ({
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 'var(--direction-stroke-width)',
      borderRadius: 'inherit',
      // The stroke has to end square where it stops, so only the bottom left
      // corner, the one it actually turns, keeps the card's radius.
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderBottom: `${borderWidth}px solid`,
      borderColor: directionColor,
      pointerEvents: 'none',
      zIndex: 3,
      transition: 'width 0.3s ease-in-out',
    }),
    [directionColor, borderWidth],
  )

  return (
    <Stack
      direction="column"
      gap={1.5}
      width={width}
      minWidth={minWidth}
      sx={containerSx}
    >
      {children}
      <Box style={directionStrokeStyle} sx={directionStrokeSx} />
    </Stack>
  )
}

export default memo(TickerContainer)
