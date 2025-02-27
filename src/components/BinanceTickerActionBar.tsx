import { Stack, Fab } from '@mui/material'
import SortIcon from '@mui/icons-material/Sort'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { useState } from 'react'

import { SortBy } from '../types/binance'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'

export default function BinanceTickerActionBar() {
  const sortBy = useBinanceTickerStore((state) => state.sortBy)
  const setSortBy = useBinanceTickerStore((state) => state.setSortBy)

  const [show, setShow] = useState(false)

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems="end"
      spacing={2}
      sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10 }}
    >
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setShow(!show)}
        sx={{
          transform: show ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}
      >
        <MenuOpenIcon />
      </Fab>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems="end"
        spacing={2}
        sx={{
          display: show ? 'flex' : 'none',
          transition: 'height 3s ease',
        }}
      >
        {/* Sort By */}
        <Stack direction="row" spacing={2}>
          <Fab
            variant="extended"
            color={sortBy === SortBy.VOLUME ? 'secondary' : 'default'}
            onClick={() => setSortBy(SortBy.VOLUME)}
          >
            <SortIcon sx={{ mr: 1 }} />
            VOL
          </Fab>
          <Fab
            variant="extended"
            color={sortBy === SortBy.PERCENT ? 'secondary' : 'default'}
            onClick={() => setSortBy(SortBy.PERCENT)}
          >
            <SortIcon sx={{ mr: 1 }} />
            PER
          </Fab>
        </Stack>
      </Stack>
    </Stack>
  )
}
