import { Stack, Typography, Chip, Tooltip } from '@mui/material'
import { memo } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import { compactNumberFormatter } from '../utils'
import { useOkxRealtimeTickerStore } from '../store/useOkxRealtimeTickerStore'

import OkxKlineChart from './OkxKlineChart'
import TickerContainer from './TickerContainer'

function OkxTickerCard({ instId }: { instId: string }) {
  const volCcyQuote = useTickerStore((state) => state.volCcyQuote[instId])
  const ratio = useTickerStore((state) => state.ratio[instId])
  const fundingRate = useTickerStore((state) => state.fundingRate[instId])
  const t = useOkxRealtimeTickerStore((state) => state.tickers[instId] || {})

  return (
    <TickerContainer up={+t.percent > 0} minWidth={236} borderWidth={3}>
      <Stack direction="row" alignItems="center" gap={1}>
        <img src={t.logo} width={32} />
        <Typography fontSize={20} fontWeight={700}>
          {t.coin}
        </Typography>
        <Typography
          flex={1}
          fontSize={22}
          fontWeight={600}
          color={t.color}
          align="right"
        >
          {+t.percent > 0 ? '+' : ''}
          {t.percent}%
        </Typography>
      </Stack>
      <Typography
        fontSize={36}
        fontWeight={600}
        color={t.isUp ? 'success' : 'error'}
        sx={{
          textShadow: () =>
            t.isUp
              ? `0 0 2px rgba(37, 167, 80, 0.3),
                 1px 1px 2px rgba(37, 167, 80, 0.2),
                 -1px -1px 2px rgba(255, 255, 255, 0.1)` // 绿色立体效果
              : `0 0 2px rgba(202, 63, 100, 0.3),
                 1px 1px 2px rgba(202, 63, 100, 0.2),
                 -1px -1px 2px rgba(255, 255, 255, 0.1)`, // 红色立体效果
        }}
      >
        {t.last}{' '}
        <Typography
          fontSize={16}
          fontWeight={500}
          component="span"
          color="text.secondary"
          sx={{ textShadow: 'none' }}
        >
          {t.lastSz}
        </Typography>
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontSize={16} fontWeight={500} color="text.secondary">
          {t.low24h} - {t.high24h}
        </Typography>
        <Typography fontSize={16} fontWeight={600} color={t.color}>
          {t.dif}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} sx={{ zIndex: 2 }}>
        <Tooltip title="Quote Volume" arrow>
          <Chip
            size="small"
            color="primary"
            label={`${compactNumberFormatter(Number(volCcyQuote)) || t.vol}`}
          />
        </Tooltip>
        <Tooltip title="L/S Ratio" arrow>
          <Chip size="small" color="secondary" label={ratio?.value} />
        </Tooltip>
        <Tooltip title="Funding Rate" arrow>
          <Chip
            size="small"
            color={+fundingRate > 0 ? 'success' : 'error'}
            label={`${fundingRate}‱`}
          />
        </Tooltip>
      </Stack>
      <OkxKlineChart instId={t.instId} />
    </TickerContainer>
  )
}

export default memo(OkxTickerCard)
