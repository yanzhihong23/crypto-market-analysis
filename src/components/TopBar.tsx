import { AppBar, Box, Stack, Toolbar, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

import Logo from '../assets/logo.svg?react'
import { numericFont } from '../fonts'

import NavMenu from './NavMenu'
import MobileNavMenu from './MobileNavMenu'
import FeedStatus from './FeedStatus'
import AlertBell from './AlertBell'
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
          px: { xs: 2, md: 3 },
          gap: { xs: 1, md: 2 },
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1,
            pr: 3,
          }}
        >
          <Box
            component={Logo}
            sx={{ color: 'primary.main', width: 24, height: 24 }}
          />
          {/* Sized down from 20px/700: the wordmark was the heaviest text on
              a page whose whole job is to make prices the heaviest text. */}
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: -0.1,
            }}
          >
            Vigil
          </Typography>
        </Stack>

        <NavMenu sx={{ display: { xs: 'none', md: 'block' } }} />

        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: { xs: 1, md: 2 },
            ml: 'auto',
          }}
        >
          <FeedStatus />
          <Typography
            sx={[
              {
                fontSize: 16,
                fontWeight: 500,
                color: 'text.secondary',
                // A phone already prints the time an inch above this one, and
                // the row needs the width more than it needs to repeat it.
                display: { xs: 'none', sm: 'block' },
              },
              ...(Array.isArray(numericFont) ? numericFont : [numericFont]),
            ]}
          >
            {time}
          </Typography>
          <AlertBell />
          <ColorSchemeToggle />
          <MobileNavMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
