import { Box, Stack, SxProps, Theme } from '@mui/material'
import { memo, useMemo } from 'react'

/** Above this 24h move a card earns the stronger border and fill. */
const STRONG_MOVE_PERCENT = 5

/** The amplitude rail saturates here, so 10% and 40% look the same. */
const AMPLITUDE_CEILING_PERCENT = 10

function TickerContainer({
  up,
  changePercent = 0,
  minWidth = 236,
  width,
  borderWidth = 3,
  pending = false,
  children,
  sx,
}: {
  up?: boolean
  changePercent?: number
  minWidth?: number
  width?: number
  /** Width of the left direction bar. */
  borderWidth?: number
  /** No data yet, so the card claims no direction. */
  pending?: boolean
  children: React.ReactNode
  sx?: SxProps
}) {
  const strong = !pending && Math.abs(changePercent) >= STRONG_MOVE_PERCENT
  const directionColor = pending
    ? 'surface.border'
    : up
      ? 'market.up'
      : 'market.down'

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
      borderRadius: 1,
      // Direction lives in one 3px bar plus a wash of tint. Every card used to
      // carry a full animated gradient outline, which meant no card stood out;
      // now only real movers get the stronger border and fill.
      backgroundColor: strong
        ? up
          ? 'market.upSurface'
          : 'market.downSurface'
        : 'background.paper',
      border: '1px solid',
      borderColor: strong
        ? up
          ? 'market.upBorder'
          : 'market.downBorder'
        : 'surface.border',
      borderLeft: `${borderWidth}px solid`,
      borderLeftColor: directionColor,
      transition: 'box-shadow 0.2s ease-out, border-color 0.2s ease-out',
      '&:hover': {
        // No transform: a scaling card overlaps its neighbours in a dense grid
        // and forces a repaint of the whole row.
        boxShadow: (theme) => theme.vars.palette.surface.shadow,
        borderColor: pending
          ? 'surface.border'
          : up
            ? 'market.upBorder'
            : 'market.downBorder',
        borderLeftColor: directionColor,
        '& .actionBar': {
          display: 'flex',
        },
      },
      ...sx,
    }),
    [up, strong, pending, directionColor, borderWidth, sx],
  )

  // Sits on the bottom edge rather than behind the symbol, where it used to cut
  // into the contrast of the text it overlapped. The track is what makes it
  // read as a gauge of the move rather than a stray mark in the corner.
  const amplitudeBarSx = useMemo<SxProps<Theme>>(
    () => ({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: 'surface.subtle',
      zIndex: 1,
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        right: 'auto',
        width: pending
          ? 0
          : `${
              Math.min(Math.abs(changePercent), AMPLITUDE_CEILING_PERCENT) *
              (100 / AMPLITUDE_CEILING_PERCENT)
            }%`,
        backgroundColor: directionColor,
        opacity: 0.55,
        transition: 'width 0.3s ease-in-out',
      },
    }),
    [changePercent, pending, directionColor],
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
      <Box sx={amplitudeBarSx} />
    </Stack>
  )
}

export default memo(TickerContainer)
