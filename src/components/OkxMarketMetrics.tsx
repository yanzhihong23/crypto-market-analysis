import { Chip, Stack, Tooltip } from '@mui/material'
import { memo } from 'react'

import {
  useFundingRate,
  useRatio,
  useVolCcyQuote,
} from '../hooks/useTickerField'
import { compactNumberFormatter } from '../utils'
import { numericFont } from '../fonts'

// Third-tier data, so it stays neutral and lets the price own the colour. It
// also keeps the funding rate from being read as a price move: it used to be
// tinted with the same red/green as the 24h change while meaning something
// else. The sign carries that information instead.
const chipSx = {
  ...numericFont,
  backgroundColor: 'grey.100',
  color: 'grey.600',
}

function OkxMarketMetrics({ instId }: { instId: string }) {
  const volCcyQuote = useVolCcyQuote(instId)
  const ratio = useRatio(instId)
  const fundingRate = useFundingRate(instId)

  const signedFundingRate = +fundingRate > 0 ? `+${fundingRate}` : fundingRate

  return (
    <Stack direction="row" alignItems="center" gap={0.75} sx={{ zIndex: 2 }}>
      <Tooltip title="Quote Volume" arrow>
        <Chip
          size="small"
          aria-label="Quote volume"
          sx={chipSx}
          label={`${compactNumberFormatter(Number(volCcyQuote))}`}
        />
      </Tooltip>
      <Tooltip title="L/S Ratio" arrow>
        <Chip
          size="small"
          aria-label="Long/short ratio"
          sx={chipSx}
          label={ratio?.value}
        />
      </Tooltip>
      <Tooltip title="Funding Rate" arrow>
        <Chip
          size="small"
          aria-label="Funding rate"
          sx={chipSx}
          label={`${signedFundingRate}‱`}
        />
      </Tooltip>
    </Stack>
  )
}

export default memo(OkxMarketMetrics)
