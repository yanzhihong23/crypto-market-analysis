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

/**
 * A stable empty list for the sorts that do not read the live percent, so the
 * subscription is not torn down and rebuilt on every render.
 */
const NO_INST_IDS: string[] = []

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
  const pinnedInstIds = useTickerStore((state) => state.pinnedInstIds)
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
  const byChange = sortBy === SortBy.GAINERS || sortBy === SortBy.LOSERS
  const percentValues = useOkxTickerPercents(byChange ? instIds : NO_INST_IDS)

  const sortedInstIds = useMemo(() => {
    // Scored up front: the comparator used to call indexOf on every comparison,
    // which walked the whole watchlist to place each pair.
    const score = new Map<string, number>()
    instIds.forEach((instId, index) => {
      score.set(
        instId,
        sortValues ? +(sortValues[index] ?? 0) : (percentValues[index] ?? 0),
      )
    })

    const ordered = [...instIds]
    if (sortBy === SortBy.LOSERS) {
      ordered.sort((a, b) => (score.get(a) ?? 0) - (score.get(b) ?? 0))
    } else if (sortBy !== SortBy.DEFAULT) {
      // Default is the order the tickers were added in, so it sorts by nothing.
      ordered.sort((a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0))
    }

    // Pinned symbols take the front, keeping the order they hold under the
    // current sort so that pinning one does not reshuffle the others.
    const pinned = new Set(pinnedInstIds)
    return [
      ...ordered.filter((instId) => pinned.has(instId)),
      ...ordered.filter((instId) => !pinned.has(instId)),
    ]
  }, [instIds, percentValues, pinnedInstIds, sortBy, sortValues])

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
      {/* Ordered past every card so it holds the end of the grid. It used to be
          a floating button pinned to the corner of the viewport, which sat on
          top of the last row once the cards filled the page. */}
      <Box sx={{ order: instIds.length, minWidth: 0, height: '100%' }}>
        <AddTickerButton />
      </Box>
    </Box>
  )
})

export default function OkxPerpetual() {
  return (
    <Box>
      <OkxDataSync />
      <OkxMarketToolbar />
      <OkxTickerGrid />
    </Box>
  )
}
