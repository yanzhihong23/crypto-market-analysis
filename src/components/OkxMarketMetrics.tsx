import { Chip, Stack, Tooltip } from '@mui/material'
import { memo } from 'react'

import {
  useFundingRate,
  useRatio,
  useVolCcyQuote,
} from '../hooks/useTickerField'
import { compactNumberFormatter } from '../utils'

import { metricChipSx } from './metricChipSx'

/** Placeholder for a metric the feed has not sent yet. */
const MISSING = '-'

function OkxMarketMetrics({ instId }: { instId: string }) {
  const volCcyQuote = useVolCcyQuote(instId)
  const ratio = useRatio(instId)
  const fundingRate = useFundingRate(instId)

  // Each of these arrives on its own channel, so a card can hold two real
  // values and one gap. Formatting an absent value used to print NaN and
  // "undefined‱" straight onto the card.
  const volumeLabel = Number.isFinite(Number(volCcyQuote))
    ? compactNumberFormatter(Number(volCcyQuote))
    : MISSING
  const ratioLabel = ratio?.value ?? MISSING
  const fundingLabel = Number.isFinite(Number(fundingRate))
    ? `${+fundingRate > 0 ? '+' : ''}${fundingRate}‱`
    : MISSING

  return (
    <Stack direction="row" alignItems="center" gap={0.75} sx={{ zIndex: 2 }}>
      <Tooltip title="Quote Volume" arrow>
        <Chip
          size="small"
          aria-label="Quote volume"
          sx={metricChipSx}
          label={volumeLabel}
        />
      </Tooltip>
      <Tooltip title="L/S Ratio" arrow>
        <Chip
          size="small"
          aria-label="Long/short ratio"
          sx={metricChipSx}
          label={ratioLabel}
        />
      </Tooltip>
      <Tooltip title="Funding Rate" arrow>
        <Chip
          size="small"
          aria-label="Funding rate"
          sx={metricChipSx}
          label={fundingLabel}
        />
      </Tooltip>
    </Stack>
  )
}

export default memo(OkxMarketMetrics)
