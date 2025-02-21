import { Avatar, Stack, Typography } from '@mui/material'

import { FullTicker } from '../types'
import { compactNumberFormatter } from '../utils'

export default function BinanceTickerCard({ t }: { t: FullTicker }) {
  return (
    <Stack
      direction="column"
      alignItems="center"
      gap={1}
      key={t.s}
      width={240}
      sx={{
        position: 'relative',
        px: 1,
        py: 2.5,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -2,
          padding: 0.25,
          background:
            +t.p > 0
              ? 'linear-gradient(45deg, #25a750, #40e575, #25a750, #40e575)' // 更亮的绿色对比
              : 'linear-gradient(45deg, #ca3f64, #ff5c84, #ca3f64, #ff5c84)', // 更亮的红色对比
          backgroundSize: '200% 200%',
          animation: 'gradient 2s ease infinite',
          borderRadius: 1,
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
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
      <Stack direction="row" alignItems="center" gap={1}>
        <Avatar
          src={`/logos/${t.s}.png`}
          sx={{ width: 32, height: 32 }}
          alt={t.s.charAt(0)}
        >
          {t.s.charAt(0)}
        </Avatar>
        <Typography fontSize={20} fontWeight={500}>
          {t.s.replace('USDT', '')}
        </Typography>
      </Stack>
      <Typography fontSize={24}>{+t.c}</Typography>
      <Typography
        fontSize={18}
        fontWeight="bold"
        color={+t.p > 0 ? 'success' : 'error'}
      >
        {+t.p > 0 ? `+${+t.p}` : +t.p}({+t.P > 0 ? `+${+t.P}` : +t.P}%)
      </Typography>
      <Typography>
        {+t.l} -{' '}
        <Typography color="orange" component="span">
          {+t.w}
        </Typography>{' '}
        - {+t.h}
      </Typography>
      <Typography color="gray">{compactNumberFormatter(+t.q)}</Typography>
    </Stack>
  )
}
