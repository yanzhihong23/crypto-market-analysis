import { AppBar, Box, Divider, Stack, Toolbar, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

import Logo from '../assets/logo.svg?react'
import { numericFont } from '../fonts'

import NavMenu from './NavMenu'
import MobileNavMenu from './MobileNavMenu'
import FeedStatus from './FeedStatus'
import AlertBell from './AlertBell'
import ColorSchemeToggle from './ColorSchemeToggle'
import LanguageToggle from './LanguageToggle'

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

        {/* Two kinds of thing sat here at one rhythm: a readout you look at and
            switches you press. Same gap between all five, so nothing said where
            reading stopped and clicking started. They are grouped and ruled
            apart now, and the clock is sized as what it is — a caption on the
            feed's state, not the loudest text in the bar. */}
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: { xs: 1, md: 1.5 },
            ml: 'auto',
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <FeedStatus />
            <Typography
              sx={[
                {
                  fontSize: 13,
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
          </Stack>

          {/* Below `sm` the clock is gone and the dot can be too, which would
              leave the rule opening the group on nothing. */}
          <Divider
            orientation="vertical"
            sx={{ height: 18, display: { xs: 'none', sm: 'block' } }}
          />

          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            <AlertBell />
            <LanguageToggle />
            <ColorSchemeToggle />
            <MobileNavMenu />
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
