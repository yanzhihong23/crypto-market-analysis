import { Stack, Typography, Chip, Tooltip } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

import { OkxTicker } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import { compactNumberFormatter } from '../utils'

import OkxKlineChart from './OkxKlineChart'

interface Ticker extends OkxTicker {
  coin: string
  logo?: string
  dif: string
  percent: string
  vol: string
  color: string
  priceColor: string
  oiCcy: string
  fundingRate: string
  ratio: string
  // openInterest: string
}

export default function OkxTickerCard({ t }: { t: Ticker }) {
  const volCcyQuote = useTickerStore((state) => state.volCcyQuote[t.instId])

  return (
    <Stack
      direction="column"
      alignItems="center"
      gap={1.5}
      key={t.coin}
      width={236}
      sx={{
        position: 'relative',
        p: 2.5,
        zIndex: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -2,
          padding: 0.375,
          background:
            +t.percent > 0
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
      <Stack direction="row" alignItems="center" gap={1}>
        <img src={t.logo} width={32} />
        <Typography fontSize={20} fontWeight={700}>
          {t.coin}
        </Typography>
      </Stack>
      <Typography fontSize={32} fontWeight={600} color={t.priceColor}>
        {t.last}{' '}
        {t.priceColor === 'success' ? <TrendingUp /> : <TrendingDown />}
      </Typography>
      <Typography fontSize={16} fontWeight={600} color={t.color}>
        {t.dif} ({t.percent}%)
      </Typography>
      <Typography>
        {t.low24h} - {t.high24h}
      </Typography>
      <Stack direction="row" alignItems="center" gap={1} sx={{ zIndex: 2 }}>
        <Tooltip title="Volume" arrow>
          <Chip
            size="small"
            color="primary"
            label={`${compactNumberFormatter(Number(volCcyQuote)) || t.vol}`}
          />
        </Tooltip>
        <Tooltip title="L/S Ratio" arrow>
          <Chip size="small" color="secondary" label={`${t.ratio}`} />
        </Tooltip>
        <Tooltip title="Funding Rate" arrow>
          <Chip
            size="small"
            color={+t.fundingRate > 0 ? 'success' : 'error'}
            label={`${t.fundingRate}‱`}
          />
        </Tooltip>
      </Stack>
      <OkxKlineChart instId={t.instId} />
    </Stack>
  )
}
