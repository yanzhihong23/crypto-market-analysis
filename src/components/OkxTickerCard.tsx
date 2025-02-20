import { Stack, Typography, Chip } from '@mui/material'

import { OkxTicker } from '../types/okx'

interface Ticker extends OkxTicker {
  coin: string
  logo: string
  dif: string
  percent: string
  vol: string
  color: string
  oiCcy: string
  fundingRate: string
  ratio: string
  // openInterest: string
}

export default function OkxTickerCard({ t }: { t: Ticker }) {
  return (
    <Stack
      direction="column"
      alignItems="center"
      gap={1.5}
      key={t.coin}
      width={200}
      sx={{
        position: 'relative',
        p: 2.5,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -2,
          padding: 0.5,
          background:
            +t.percent > 0
              ? // ? 'linear-gradient(45deg, #25a750, #2dcc5f, #25a750, #2dcc5f)' // 基于 #25a750 的绿色系
                // : 'linear-gradient(45deg, #ca3f64, #e54870, #ca3f64, #e54870)', // 基于 #ca3f64 的红色系
                'linear-gradient(45deg, #25a750, #40e575, #25a750, #40e575)' // 更亮的绿色对比
              : 'linear-gradient(45deg, #ca3f64, #ff5c84, #ca3f64, #ff5c84)', // 更亮的红色对比
          backgroundSize: '200% 200%',
          animation: 'gradient 2s ease infinite',
          borderRadius: 2,
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
        <img src={t.logo} width={32} />
        <Typography fontSize={18} fontWeight={600}>
          {t.coin}
        </Typography>
      </Stack>
      <Typography fontSize={32} fontWeight={500} color={t.color}>
        {t.last}
      </Typography>
      <Typography fontSize={16} fontWeight={600} color={t.color}>
        {t.dif} ({t.percent}%)
      </Typography>
      <Typography>
        {t.low24h} - {t.high24h}
      </Typography>
      <Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          <Chip size="small" label={`${t.vol}`} />
          <Chip size="small" color="secondary" label={`${t.ratio}`} />
          <Chip
            size="small"
            color={+t.fundingRate > 0 ? 'success' : 'error'}
            label={`${t.fundingRate}‱`}
          />
        </Stack>
      </Typography>
    </Stack>
  )
}
