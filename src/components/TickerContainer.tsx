import { Box, Stack, SxProps } from '@mui/material'

export default function TickerContainer({
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
  return (
    <Stack
      direction="column"
      gap={1.5}
      width={width}
      minWidth={minWidth}
      sx={{
        position: 'relative',
        p: 2.5,
        zIndex: 2,
        '&:hover': {
          transform: 'scale(1.02)',
        },
        transition: 'transform 0.2s ease-in-out',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -2,
          padding: borderWidth / 8,
          background: up
            ? 'linear-gradient(45deg, rgba(37, 167, 80, 0.2), rgba(37, 167, 80, 0.8), rgba(37, 167, 80, 0.2), rgba(37, 167, 80, 0.8))' // 从半透明到深绿色
            : 'linear-gradient(45deg, rgba(202, 63, 100, 0.2), rgba(202, 63, 100, 0.8), rgba(202, 63, 100, 0.2), rgba(202, 63, 100, 0.8))', // 从半透明到深红色
          backgroundSize: '300% 300%',
          animation: 'gradient 2s ease-in-out infinite',
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
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: borderWidth / 8,
          height: 42,
          width: `${Math.min(Math.abs(changePercent), 10) * 10}%`,
          background: up ? '#82ca9d' : '#E04A59',
          opacity: 0.4,
          transition: 'all 0.3s ease-in-out',
          zIndex: 1,
        }}
      />
      {children}
    </Stack>
  )
}
