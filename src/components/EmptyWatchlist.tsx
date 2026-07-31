import { Stack, Typography } from '@mui/material'
import ShowChartIcon from '@mui/icons-material/ShowChart'

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
      <Typography fontSize={14} color="text.secondary">
        Add one with the button in the bottom right corner to start streaming
        prices.
      </Typography>
    </Stack>
  )
}
