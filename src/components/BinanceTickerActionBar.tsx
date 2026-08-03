import { Stack } from '@mui/material'

import { SortBy } from '../types/binance'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'
import { useMessages } from '../i18n'
import type { Messages } from '../i18n/en'

import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'

const sortOptions = (t: Messages): SegmentedOption<SortBy>[] => [
  { value: SortBy.VOLUME, label: t.binance.sortVolume },
  { value: SortBy.PERCENT, label: t.binance.sortChange },
]

/**
 * Sort used to live inside a collapsed floating menu, so the active choice was
 * invisible until you opened it. It sits above the grid now.
 */
export default function BinanceTickerActionBar() {
  const sortBy = useBinanceTickerStore((state) => state.sortBy)
  const setSortBy = useBinanceTickerStore((state) => state.setSortBy)
  const t = useMessages()

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
        label={t.toolbar.sortBy}
        value={sortBy}
        options={sortOptions(t)}
        onChange={setSortBy}
      />
    </Stack>
  )
}
