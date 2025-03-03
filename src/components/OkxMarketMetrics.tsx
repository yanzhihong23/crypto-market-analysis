import { Chip, Stack, Tooltip } from '@mui/material'
import { memo } from 'react'

import { compactNumberFormatter } from '../utils'
import { useTickerStore } from '../store/useTickerStore'

function OkxMarketMetrics({ instId }: { instId: string }) {
  const volCcyQuote = useTickerStore((state) => state.volCcyQuote[instId])
  const ratio = useTickerStore((state) => state.ratio[instId])
  const fundingRate = useTickerStore((state) => state.fundingRate[instId])

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
