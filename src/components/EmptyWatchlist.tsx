import { Stack, Typography } from '@mui/material'
import ShowChartIcon from '@mui/icons-material/ShowChart'

import AddTickerButton from './AddTickerButton'

/**
 * Removing the last ticker used to leave a blank page with no indication that
 * anything was still working.
 */
export default function EmptyWatchlist() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      gap={1}
      sx={{
        py: 12,
        px: 3,
        borderRadius: 1,
        border: '1px dashed',
        borderColor: 'surface.border',
        textAlign: 'center',
      }}
    >
      <ShowChartIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
      <Typography fontSize={16} fontWeight={600}>
        No tickers yet
      </Typography>
      <Typography fontSize={14} color="text.secondary" mb={1}>
        Add a perpetual to start streaming prices.
      </Typography>
      <AddTickerButton variant="standalone" />
    </Stack>
  )
}
