import { Stack, Box } from '@mui/material'
import { useMemo } from 'react'

import { SortBy } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import OkxTickerCard from '../components/OkxTickerCard'
import useOkxKlinesUpdater from '../hooks/useOkxKlinesUpdater'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'
import ActionBar from '../components/ActionBar'
import { useOkxTickers } from '../hooks/useOkxTickers'

export default function OkxPerpetual() {
  const sortBy = useTickerStore((state) => state.sortBy)

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
      <Stack direction="row" gap={2} flexWrap="wrap">
        {sortedTickers.map((t) => (
          <OkxTickerCard key={t.instId} t={t} />
        ))}
      </Stack>
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
