import { Chip, Stack, Tooltip } from '@mui/material'
import { memo } from 'react'

import {
  useFundingRate,
  useRatio,
  useVolCcyQuote,
} from '../hooks/useTickerField'
import { compactNumberFormatter } from '../utils'

function OkxMarketMetrics({ instId }: { instId: string }) {
  const volCcyQuote = useVolCcyQuote(instId)
  const ratio = useRatio(instId)
  const fundingRate = useFundingRate(instId)

  return (
    <Stack direction="row" alignItems="center" gap={1} sx={{ zIndex: 2 }}>
      <Tooltip title="Quote Volume" arrow>
        <Chip
          size="small"
          color="primary"
          label={`${compactNumberFormatter(Number(volCcyQuote))}`}
        />
      </Tooltip>
      <Tooltip title="L/S Ratio" arrow>
        <Chip size="small" color="secondary" label={ratio?.value} />
      </Tooltip>
      <Tooltip title="Funding Rate" arrow>
        <Chip
          size="small"
          color={+fundingRate > 0 ? 'success' : 'error'}
          label={`${fundingRate}‱`}
        />
      </Tooltip>
    </Stack>
  )
}

export default memo(OkxMarketMetrics)
