import { IconButton, Stack, Typography } from '@mui/material'
import { memo, useMemo, useCallback } from 'react'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove'

import useOkxTicker from '../hooks/useOkxTicker'
import { useTickerStore } from '../store/useTickerStore'
import { removeOkxTicker } from '../store/okxRealtimeTicker'
import { okxTickerActions } from '../okx/okxTickerActions'
import { numericFont } from '../fonts'

import OkxKlineChart from './OkxKlineChart'
import TickerContainer from './TickerContainer'
import LastPrice from './LastPrice'
import OkxMarketMetrics from './OkxMarketMetrics'
import OkxLogoSymbol from './OkxLogoSymbol'

function OkxTickerCard({ instId }: { instId: string }) {
  const t = useOkxTicker(instId)

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

  const handleRemove = useCallback(() => {
    void okxTickerActions.remove(instId)
    removeOkxTicker(instId)
    const { instIds, setInstIds } = useTickerStore.getState()
    setInstIds(instIds.filter((i) => i !== instId))
  }, [instId])

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
          fontSize={20}
          fontWeight={600}
          color={t.color}
          align="right"
          sx={numericFont}
        >
          {+t.percent > 0 ? '+' : ''}
          {t.percent}%
        </Typography>
      </Stack>
      <LastPrice last={t.last} lastSz={t.lastSz} up={up} />
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontSize={13} color="text.secondary" sx={numericFont}>
          {t.low24h} - {t.high24h}
        </Typography>
        <Typography fontSize={13} color={t.color} sx={numericFont}>
          {t.dif}
        </Typography>
      </Stack>

      <OkxMarketMetrics instId={instId} />
      <OkxKlineChart instId={instId} />

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
