import { AppBar, Box, Stack, Toolbar, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

import Logo from '../assets/logo.svg?react'
import { numericFont } from '../fonts'

import NavMenu from './NavMenu'
import FeedStatus from './FeedStatus'
import ColorSchemeToggle from './ColorSchemeToggle'

export default function TopBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(format(new Date(), 'HH:mm:ss'))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AppBar
      position="static"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          height: 64,
          minHeight: 64,
          zIndex: 10,
          px: 3,
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Box component={Logo} sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700} pr={4}>
            Perpetual Market
          </Typography>
        </Stack>

        <NavMenu sx={{ display: { xs: 'none', md: 'block' } }} />

        <Stack direction="row" alignItems="center" gap={2} sx={{ ml: 'auto' }}>
          <FeedStatus />
          <Typography
            fontSize={16}
            fontWeight={500}
            color="text.secondary"
            sx={numericFont}
          >
            {time}
          </Typography>
          <ColorSchemeToggle />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
