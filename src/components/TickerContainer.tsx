import { Stack } from '@mui/material'

export default function TickerContainer({
  up,
  minWidth = 236,
  width,
  borderWidth = 2,
  children,
}: {
  up?: boolean
  minWidth?: number
  width?: number
  borderWidth?: number
  children: React.ReactNode
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
            ? 'linear-gradient(45deg, #25a750, rgba(37, 167, 80, 0.3), #25a750, rgba(37, 167, 80, 0.3))' // 绿色到透明
            : 'linear-gradient(45deg, #ca3f64, rgba(202, 63, 100, 0.3), #ca3f64, rgba(202, 63, 100, 0.3))', // 红色到透明
          backgroundSize: '200% 200%',
          animation: 'gradient 2s ease infinite',
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
      }}
    >
      {children}
    </Stack>
  )
}
