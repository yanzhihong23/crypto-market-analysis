import { Box } from '@mui/material'
import { memo, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { SortBy } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import OkxTickerCard from '../components/OkxTickerCard'
import AddTickerButton from '../components/AddTickerButton'
import OkxDataSync from '../components/OkxDataSync'
import OkxMarketToolbar from '../components/OkxMarketToolbar'
import EmptyWatchlist from '../components/EmptyWatchlist'
import useOkxTickerPercents from '../hooks/useOkxTickerPercents'

const OkxTickerGridItem = memo(function OkxTickerGridItem({
  instId,
  sortIndex,
}: {
  instId: string
  sortIndex: number
}) {
  return (
    <Box
      sx={{
        // Grid auto-placement follows order-modified document order, so the
        // cards can be re-sorted visually while their DOM order stays fixed
        // and the subscribed cards are never torn down and remounted.
        order: sortIndex,
        minWidth: 0,
        height: '100%',
        contain: 'layout',
      }}
    >
      <OkxTickerCard instId={instId} />
    </Box>
  )
})

const OkxTickerGrid = memo(function OkxTickerGrid() {
  const sortBy = useTickerStore((state) => state.sortBy)
  const instIds = useTickerStore((state) => state.instIds)
  const sortValues = useTickerStore(
    useShallow((state) => {
      if (sortBy === SortBy.VOLUME) {
        return instIds.map((id) => state.volCcyQuote[id] ?? '0')
      }
      if (sortBy === SortBy.RATIO) {
        return instIds.map((id) => state.ratio[id]?.value ?? '0')
      }
      return null
    }),
  )
  const percentValues = useOkxTickerPercents(
    sortBy === SortBy.PERCENT ? instIds : [],
  )

  const sortedInstIds = useMemo(() => {
    return [...instIds].sort((a, b) => {
      if (sortBy === SortBy.VOLUME) {
        const indexA = instIds.indexOf(a)
        const indexB = instIds.indexOf(b)
        return +(sortValues?.[indexB] ?? 0) - +(sortValues?.[indexA] ?? 0)
      }
      if (sortBy === SortBy.PERCENT) {
        const indexA = instIds.indexOf(a)
        const indexB = instIds.indexOf(b)
        return (percentValues[indexB] ?? 0) - (percentValues[indexA] ?? 0)
      }
      if (sortBy === SortBy.RATIO) {
        const indexA = instIds.indexOf(a)
        const indexB = instIds.indexOf(b)
        return +(sortValues?.[indexB] ?? 0) - +(sortValues?.[indexA] ?? 0)
      }
      return instIds.indexOf(a) - instIds.indexOf(b)
    })
  }, [instIds, percentValues, sortBy, sortValues])

  const sortIndexByInstId = useMemo(() => {
    const map = new Map<string, number>()
    sortedInstIds.forEach((id, index) => map.set(id, index))
    return map
  }, [sortedInstIds])

  if (!instIds.length) {
    return <EmptyWatchlist />
  }

  return (
    <Box
      sx={{
        display: 'grid',
        // Column count follows the available width instead of six hardcoded
        // breakpoints, which used to stretch cards past 400px on wide screens.
        gridTemplateColumns: 'repeat(auto-fill, minmax(236px, 1fr))',
        gap: 2,
      }}
    >
      {instIds.map((instId) => (
        <OkxTickerGridItem
          key={instId}
          instId={instId}
          sortIndex={sortIndexByInstId.get(instId) ?? 0}
        />
      ))}
    </Box>
  )
})

export default function OkxPerpetual() {
  return (
    <Box>
      <OkxDataSync />
      <OkxMarketToolbar />
      <OkxTickerGrid />
      <AddTickerButton />
    </Box>
  )
}
