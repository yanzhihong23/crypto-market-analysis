import { Box, Grid2 as Grid } from '@mui/material'
import { useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { SortBy } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import OkxTickerCard from '../components/OkxTickerCard'
import useOkxKlinesUpdater from '../hooks/useOkxKlinesUpdater'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'
import ActionBar from '../components/ActionBar'
import { useOkxTickers } from '../hooks/useOkxTickers'
import useOkxInstrumentsUpdater from '../hooks/useOkxInstrumentsUpdater'
import { useOkxRealtimeTickerStore } from '../store/useOkxRealtimeTickerStore'

export default function OkxPerpetual() {
  const sortBy = useTickerStore((state) => state.sortBy)
  const instIds = useTickerStore((state) => state.instIds)
  const setInstIds = useTickerStore((state) => state.setInstIds)
  const volCcyQuote = useTickerStore((state) => state.volCcyQuote)
  const ratio = useTickerStore((state) => state.ratio)
  const percentValues = useOkxRealtimeTickerStore(
    useShallow((state) =>
      sortBy === SortBy.PERCENT
        ? instIds.map((id) => state.percent.get(id) ?? 0)
        : null,
    ),
  )

  // update instruments
  useOkxInstrumentsUpdater()
  // update kline data
  const { updateKlinesByInstId } = useOkxKlinesUpdater()
  // update ratio data
  const { updateRatioByInstId } = useOkxRatioUpdater()

  const { add, remove } = useOkxTickers()

  const sortedInstIds = useMemo(() => {
    return [...instIds].sort((a, b) => {
      if (sortBy === SortBy.VOLUME) return +volCcyQuote[b] - +volCcyQuote[a]
      if (sortBy === SortBy.PERCENT) {
        const indexA = instIds.indexOf(a)
        const indexB = instIds.indexOf(b)
        return (percentValues?.[indexB] ?? 0) - (percentValues?.[indexA] ?? 0)
      }
      if (sortBy === SortBy.RATIO) return +ratio[b].value - +ratio[a].value
      return instIds.indexOf(a) - instIds.indexOf(b)
    })
  }, [instIds, percentValues, ratio, sortBy, volCcyQuote])

  const handleAdd = useCallback(
    (instId: string) => {
      add(instId)
      updateKlinesByInstId(instId)
      updateRatioByInstId(instId)
    },
    [add, updateKlinesByInstId, updateRatioByInstId],
  )

  const handleRemove = useCallback(
    (instId: string) => {
      remove(instId)
      setInstIds(instIds.filter((i) => i !== instId))
    },
    [instIds, remove, setInstIds],
  )

  return (
    <Box>
      <Grid container spacing={2}>
        {sortedInstIds.map((instId) => (
          <Grid
            key={instId}
            size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2, xxl: 1.5 }}
          >
            <OkxTickerCard instId={instId} onRemove={handleRemove} />
          </Grid>
        ))}
      </Grid>
      <ActionBar onAdd={handleAdd} onRemove={remove} />
    </Box>
  )
}
