import { Stack, Typography } from '@mui/material'
import ShowChartIcon from '@mui/icons-material/ShowChart'

import { useMessages } from '../i18n'

import AddTickerButton from './AddTickerButton'

/**
 * Removing the last ticker used to leave a blank page with no indication that
 * anything was still working.
 */
export default function EmptyWatchlist() {
  const t = useMessages()

  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        py: 12,
        px: 3,
        borderRadius: 1,
        border: '1px dashed',
        borderColor: 'surface.border',
        textAlign: 'center',
      }}
    >
      <ShowChartIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {t.watchlist.emptyTitle}
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          color: 'text.secondary',
          mb: 1,
        }}
      >
        {t.watchlist.emptyBody}
      </Typography>
      <AddTickerButton variant="standalone" />
    </Stack>
  )
}
