import { Box, Stack, SxProps, Theme } from '@mui/material'
import { memo, useMemo } from 'react'

function TickerContainer({
  up,
  changePercent = 0,
  minWidth = 236,
  width,
  borderWidth = 2,
  children,
  sx,
}: {
  up?: boolean
  changePercent?: number
  minWidth?: number
  width?: number
  borderWidth?: number
  children: React.ReactNode
  sx?: SxProps
}) {
  // Memoize the large sx object to avoid recreating on every render
  const containerSx = useMemo<SxProps<Theme>>(
    () => ({
      position: 'relative',
      p: 2.5,
      zIndex: 2,
      '&:hover': {
        transform: 'scale(1.02)',
        '& .actionBar': {
          display: 'flex',
        },
        '&::before': {
          animation: 'gradient 2s ease-in-out infinite',
        },
      },
      transition: 'transform 0.2s ease-in-out',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: -2,
        padding: borderWidth / 8,
        background: up
          ? 'linear-gradient(45deg, rgba(37, 167, 80, 0.2), rgba(37, 167, 80, 0.8), rgba(37, 167, 80, 0.2), rgba(37, 167, 80, 0.8))'
          : 'linear-gradient(45deg, rgba(202, 63, 100, 0.2), rgba(202, 63, 100, 0.8), rgba(202, 63, 100, 0.2), rgba(202, 63, 100, 0.8))',
        backgroundSize: '300% 300%',
        // animation: 'gradient 2s ease-in-out infinite',
        borderRadius: 1,
        WebkitMask:
          'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        zIndex: 1,
      },
      '@keyframes gradient': {
        '0%': {
          backgroundPosition: '0% 50%',
        },
        '50%': {
          backgroundPosition: '100% 50%',
        },
        '100%': {
          backgroundPosition: '0% 50%',
        },
      },
      ...sx,
    }),
    [up, borderWidth, sx], // Only recreate when these dependencies change
  )

  // Memoize the progress bar sx
  const progressBarSx = useMemo<SxProps<Theme>>(
    () => ({
      position: 'absolute',
      top: 16,
      left: borderWidth / 8,
      height: 42,
      width: `${Math.min(Math.abs(changePercent), 10) * 10}%`,
      background: up ? '#82ca9d' : '#E04A59',
      opacity: 0.4,
      transition: 'width 0.3s ease-in-out, opacity 0.3s ease-in-out',
      zIndex: 1,
    }),
    [changePercent, up, borderWidth],
  )

  return (
    <Stack
      direction="column"
      gap={1.5}
      width={width}
      minWidth={minWidth}
      sx={containerSx}
    >
      <Box sx={progressBarSx} />
      {children}
    </Stack>
  )
}

export default memo(TickerContainer)
