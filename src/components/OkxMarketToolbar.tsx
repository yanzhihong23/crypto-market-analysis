import { Stack } from '@mui/material'

import { OpenTime, SortBy } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'

import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'

// Gainers and losers are separate segments rather than one Change segment with
// a direction: the sort ran descending only, so the worst movers of the day
// were the one thing the board could not be asked for.
const SORT_OPTIONS: SegmentedOption<SortBy>[] = [
  { value: SortBy.DEFAULT, label: 'Default' },
  { value: SortBy.GAINERS, label: 'Gainers' },
  { value: SortBy.LOSERS, label: 'Losers' },
  { value: SortBy.VOLUME, label: 'Volume' },
  { value: SortBy.RATIO, label: 'L/S' },
]

const OPEN_TIME_OPTIONS: SegmentedOption<OpenTime>[] = [
  { value: OpenTime.OPEN24H, label: '24H' },
  { value: OpenTime.UTC0, label: 'UTC+0' },
  { value: OpenTime.UTC8, label: 'UTC+8' },
]

export default function OkxMarketToolbar() {
  const openTime = useTickerStore((state) => state.openTime)
  const sortBy = useTickerStore((state) => state.sortBy)
  const setOpenTime = useTickerStore((state) => state.setOpenTime)
  const setSortBy = useTickerStore((state) => state.setSortBy)

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={3}
      flexWrap="wrap"
      sx={{ mb: 2.5 }}
    >
      <SegmentedToggle
        label="Sort by"
        value={sortBy}
        options={SORT_OPTIONS}
        onChange={setSortBy}
      />
      <SegmentedToggle
        label="Open"
        value={openTime}
        options={OPEN_TIME_OPTIONS}
        onChange={setOpenTime}
      />
    </Stack>
  )
}
