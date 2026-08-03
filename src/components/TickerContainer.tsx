import { Stack, SxProps, Theme } from '@mui/material'
import { memo, useCallback, useMemo } from 'react'

/** Above this 24h move a card earns the stronger border and fill. */
const STRONG_MOVE_PERCENT = 5

/** Card radius. */
const CORNER_RADIUS = 16

function TickerContainer({
  up,
  changePercent = 0,
  minWidth = 236,
  width,
  pending = false,
  flagged = false,
  onDoubleClick,
  children,
  sx,
}: {
  up?: boolean
  /** Only decides whether this is a strong mover; the size of the move is
   * drawn on the range track, between the open and the live price. */
  changePercent?: number
  minWidth?: number
  width?: number
  /** No data yet, so the card claims no direction. */
  pending?: boolean
  /**
   * Two different kinds of reading on this card are out of range at once — what
   * the price did and whether anything was behind it, say — which is rarer and
   * more worth crossing the grid for than any one of them alone. It takes over
   * the ring; direction still reads off the stroke and the fill, so nothing is
   * lost when a strong mover is also the one the crowd is short.
   */
  flagged?: boolean
  /** Toggles the pin. Double-click rather than a control, so the card front
   * stays given over to the readings. */
  onDoubleClick?: () => void
  children: React.ReactNode
  sx?: SxProps
}) {
  const strong = !pending && Math.abs(changePercent) >= STRONG_MOVE_PERCENT
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
      // Double-clicking to pin would otherwise select whichever price sat under
      // the cursor, and on a card that redraws every tick that selection is
      // never worth keeping.
      userSelect: 'none',
      // At the card's own scale direction is a wash of tint and nothing more:
      // the reading itself is on the range track. Every card used to carry a
      // full animated gradient outline, which meant no card stood out; now only
      // real movers get the stronger edge and fill.
      backgroundColor: strong
        ? up
          ? 'market.upSurface'
          : 'market.downSurface'
        : 'background.paper',
      // An inset ring rather than a border, so the ring sits on the card's own
      // edge instead of pushing the padding box inwards.
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

  return (
    <Stack
      direction="column"
      onDoubleClick={onDoubleClick}
      sx={[
        {
          gap: 1.5,
          width: width,
          minWidth: minWidth,
        },
        ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
      ]}
    >
      {children}
    </Stack>
  )
}

export default memo(TickerContainer)
