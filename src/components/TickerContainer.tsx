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
  children,
  sx,
}: {
  up?: boolean
  changePercent?: number
  minWidth?: number
  width?: number
  /** Width of the left direction bar. */
  borderWidth?: number
  children: React.ReactNode
  sx?: SxProps
}) {
  const strong = Math.abs(changePercent) >= STRONG_MOVE_PERCENT

  // Memoize the large sx object to avoid recreating on every render
  const containerSx = useMemo<SxProps<Theme>>(
    () => ({
      position: 'relative',
      overflow: 'hidden',
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
        : '#fff',
      border: '1px solid',
      borderColor: strong
        ? up
          ? 'market.upBorder'
          : 'market.downBorder'
        : 'grey.200',
      borderLeft: `${borderWidth}px solid`,
      borderLeftColor: up ? 'market.up' : 'market.down',
      transition: 'box-shadow 0.2s ease-out, border-color 0.2s ease-out',
      '&:hover': {
        // No transform: a scaling card overlaps its neighbours in a dense grid
        // and forces a repaint of the whole row.
        boxShadow: '0 4px 12px -2px rgba(16, 24, 40, 0.10)',
        borderColor: up ? 'market.upBorder' : 'market.downBorder',
        borderLeftColor: up ? 'market.up' : 'market.down',
        '& .actionBar': {
          display: 'flex',
        },
      },
      ...sx,
    }),
    [up, strong, borderWidth, sx],
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
      backgroundColor: 'grey.100',
      zIndex: 1,
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        right: 'auto',
        width: `${
          Math.min(Math.abs(changePercent), AMPLITUDE_CEILING_PERCENT) *
          (100 / AMPLITUDE_CEILING_PERCENT)
        }%`,
        backgroundColor: up ? 'market.up' : 'market.down',
        opacity: 0.55,
        transition: 'width 0.3s ease-in-out',
      },
    }),
    [changePercent, up],
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
