import { Box, Grid2 as Grid } from '@mui/material'
import { useMemo } from 'react'

import { SortBy } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import OkxTickerCard from '../components/OkxTickerCard'
import useOkxKlinesUpdater from '../hooks/useOkxKlinesUpdater'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'
import ActionBar from '../components/ActionBar'
import { useOkxTickers } from '../hooks/useOkxTickers'
import useOkxInstrumentsUpdater from '../hooks/useOkxInstrumentsUpdater'

export default function OkxPerpetual() {
  const sortBy = useTickerStore((state) => state.sortBy)

  // update instruments
  useOkxInstrumentsUpdater()
  // update kline data
  const { updateKlinesByInstId } = useOkxKlinesUpdater()
  // update ratio data
  const { updateRatioByInstId } = useOkxRatioUpdater()

  const { tickers, add, remove } = useOkxTickers()

  const sortedTickers = useMemo(() => {
    return tickers.sort((a, b) => {
      if (sortBy === SortBy.VOLUME) return +b.volCcyQuote - +a.volCcyQuote
      if (sortBy === SortBy.PERCENT) return +b.percent - +a.percent
      if (sortBy === SortBy.RATIO) return +b.ratio - +a.ratio
      return tickers.indexOf(a) - tickers.indexOf(b)
    })
  }, [tickers, sortBy])

  return (
    <Box>
      <Grid container spacing={2}>
        {sortedTickers.map((t) => (
          <Grid
            key={t.instId}
            size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2, xxl: 1.5, xxxl: 1.333 }}
          >
            <OkxTickerCard t={t} />
          </Grid>
        ))}
      </Grid>
      <ActionBar
        onAdd={(instId) => {
          add(instId)
          updateKlinesByInstId(instId)
          updateRatioByInstId(instId)
        }}
        onRemove={remove}
      />
    </Box>
  )
}
