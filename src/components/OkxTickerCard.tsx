import { IconButton, Stack, Typography } from '@mui/material'
import { memo, useMemo, useCallback } from 'react'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove'

import { useOkxRealtimeTickerStore } from '../store/useOkxRealtimeTickerStore'
import { OkxTickerFormatted } from '../types/okx'

import OkxKlineChart from './OkxKlineChart'
import TickerContainer from './TickerContainer'
import LastPrice from './LastPrice'
import OkxMarketMetrics from './OkxMarketMetrics'
import OkxLogoSymbol from './OkxLogoSymbol'

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

  const up = useMemo(() => +t.percent > 0, [t.percent])
  const changePercent = useMemo(() => +(+t.percent).toFixed(2), [t.percent])

  // memoized style object
  const actionBarSx = useMemo(
    () => ({
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
    }),
    [],
  )

  // memoized callback function
  const handleRemove = useCallback(() => onRemove(instId), [instId, onRemove])

  return (
    <TickerContainer
      up={up}
      changePercent={changePercent}
      minWidth={236}
      borderWidth={3}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        zIndex={2}
      >
        <OkxLogoSymbol instId={instId} />

        <Typography
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
        sx={actionBarSx}
      >
        <IconButton color="error" size="small" onClick={handleRemove}>
          <BookmarkRemoveIcon />
        </IconButton>
      </Stack>
    </TickerContainer>
  )
}

export default memo(OkxTickerCard)
