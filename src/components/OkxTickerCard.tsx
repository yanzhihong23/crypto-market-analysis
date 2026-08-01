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
import PriceRange from './PriceRange'
import OkxMarketMetrics from './OkxMarketMetrics'
import OkxLogoSymbol from './OkxLogoSymbol'
import OkxTickerCardSkeleton from './OkxTickerCardSkeleton'

function OkxTickerCard({ instId }: { instId: string }) {
  const t = useOkxTicker(instId)

  // The placeholder ticker carries empty strings until the first message for
  // this instrument arrives, which may never happen for a delisted symbol.
  const ready = t.last !== ''
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
      // The blur alone separates the button from the sparkline behind it; the
      // white wash that used to sit here inverted badly in the dark scheme.
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

  if (!ready) {
    return <OkxTickerCardSkeleton symbol={instId.split('-')[0]} />
  }

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

        {/* Both readings of the same 24h change, so they sit together. */}
        <Stack alignItems="end">
          <Typography
            fontSize={20}
            fontWeight={600}
            color={t.color}
            sx={numericFont}
          >
            {+t.percent > 0 ? '+' : ''}
            {t.percent}%
          </Typography>
          <Typography
            fontSize={12}
            color={t.color}
            lineHeight={1.2}
            sx={numericFont}
          >
            {t.dif}
          </Typography>
        </Stack>
      </Stack>
      <LastPrice last={t.last} lastSz={t.lastSz} up={t.isUp} />
      <PriceRange low={t.low24h} high={t.high24h} last={t.last} up={up} />

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
