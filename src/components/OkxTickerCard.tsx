import { IconButton, Stack, Typography } from '@mui/material'
import { memo } from 'react'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove'

import { useOkxRealtimeTickerStore } from '../store/useOkxRealtimeTickerStore'
import { OkxTickerFormatted } from '../types/okx'

import OkxKlineChart from './OkxKlineChart'
import TickerContainer from './TickerContainer'
import LastPrice from './LastPrice'
import OkxMarketMetrics from './OkxMarketMetrics'

function OkxTickerCard({
  instId,
  onRemove,
}: {
  instId: string
  onRemove: (instId: string) => void
}) {
  const t = useOkxRealtimeTickerStore(
    (state) => state.tickers.get(instId) || ({} as OkxTickerFormatted),
  )

  return (
    <TickerContainer
      up={+t.percent > 0}
      minWidth={236}
      borderWidth={3}
      sx={{
        '&:hover .actionBar': {
          display: 'flex',
        },
      }}
    >
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
      <LastPrice last={t.last} lastSz={t.lastSz} isUp={t.isUp} />
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontSize={16} fontWeight={500} color="text.secondary">
          {t.low24h} - {t.high24h}
        </Typography>
        <Typography fontSize={16} fontWeight={600} color={t.color}>
          {t.dif}
        </Typography>
      </Stack>

      <OkxMarketMetrics instId={t.instId} />
      <OkxKlineChart instId={t.instId} />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="end"
        gap={1}
        className="actionBar"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          p: 2,
          zIndex: 3,
          display: 'none',
          height: 60,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(2px)',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <IconButton color="error" size="small" onClick={() => onRemove(instId)}>
          <BookmarkRemoveIcon />
        </IconButton>
      </Stack>
    </TickerContainer>
  )
}

export default memo(OkxTickerCard)
