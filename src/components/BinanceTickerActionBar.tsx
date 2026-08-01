import { Stack } from '@mui/material'

import { SortBy } from '../types/binance'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'

import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'

const SORT_OPTIONS: SegmentedOption<SortBy>[] = [
  { value: SortBy.VOLUME, label: 'Volume' },
  { value: SortBy.PERCENT, label: 'Change' },
]

/**
 * Sort used to live inside a collapsed floating menu, so the active choice was
 * invisible until you opened it. It sits above the grid now.
 */
export default function BinanceTickerActionBar() {
  const sortBy = useBinanceTickerStore((state) => state.sortBy)
  const setSortBy = useBinanceTickerStore((state) => state.setSortBy)

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 3,
        flexWrap: 'wrap',
        mb: 2.5,
      }}
    >
      <SegmentedToggle
        label="Sort by"
        value={sortBy}
        options={SORT_OPTIONS}
        onChange={setSortBy}
      />
    </Stack>
  )
}
