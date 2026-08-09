import { FormControlLabel, Stack, Switch, Tooltip } from '@mui/material'

import { OpenTime, SortBy } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import { useMessages } from '../i18n'
import type { Messages } from '../i18n/en'

import SegmentedToggle, { SegmentedOption } from './SegmentedToggle'

// Built per language rather than held as a constant, so the segments are named
// in whichever one is on. Gainers and losers are separate segments rather than
// one Change segment with a direction: the sort ran descending only, so the
// worst movers of the day were the one thing the board could not be asked for.
const sortOptions = (t: Messages): SegmentedOption<SortBy>[] => [
  { value: SortBy.DEFAULT, label: t.toolbar.sortDefault },
  { value: SortBy.GAINERS, label: t.toolbar.sortGainers },
  { value: SortBy.LOSERS, label: t.toolbar.sortLosers },
  { value: SortBy.VOLUME, label: t.toolbar.sortVolume },
  { value: SortBy.RATIO, label: t.toolbar.sortRatio },
]

const openTimeOptions = (t: Messages): SegmentedOption<OpenTime>[] => [
  { value: OpenTime.OPEN24H, label: t.toolbar.open24h },
  { value: OpenTime.UTC0, label: t.toolbar.openUtc0 },
  { value: OpenTime.UTC8, label: t.toolbar.openUtc8 },
]

export default function OkxMarketToolbar() {
  const openTime = useTickerStore((state) => state.openTime)
  const sortBy = useTickerStore((state) => state.sortBy)
  const klineVolume = useTickerStore((state) => state.klineVolume)
  const setOpenTime = useTickerStore((state) => state.setOpenTime)
  const setSortBy = useTickerStore((state) => state.setSortBy)
  const setKlineVolume = useTickerStore((state) => state.setKlineVolume)
  const t = useMessages()

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        // Tighter once the two controls stack: 24px between them read as two
        // unrelated blocks rather than one settings row.
        gap: { xs: 2, sm: 3 },
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
      <SegmentedToggle
        label={t.toolbar.openTime}
        value={openTime}
        options={openTimeOptions(t)}
        onChange={setOpenTime}
      />
      {/* A switch rather than a third segmented track: the other two each pick
          one of several readings of the board, and this one only says whether a
          layer is drawn. The label goes after the control so it lines up with
          the labels to its left, which sit before their tracks. */}
      <Tooltip title={t.toolbar.klineVolumeHint} arrow>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={klineVolume}
              onChange={(event) => setKlineVolume(event.target.checked)}
            />
          }
          label={t.toolbar.klineVolume}
          sx={{
            ml: 0,
            mr: 0,
            '& .MuiFormControlLabel-label': {
              // The switch's own padding is all that separates it from its
              // label otherwise, and the two read as one glyph.
              ml: 0.5,
              fontSize: 13,
              color: 'text.secondary',
            },
          }}
        />
      </Tooltip>
    </Stack>
  )
}
