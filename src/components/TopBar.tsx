import { AppBar, Stack, Toolbar, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import Logo from '../assets/logo.svg?react'

import NavMenu from './NavMenu'

export default function TopBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toTimeString().split(' ')[0])
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
          <Logo />
          <Typography variant="h6" fontWeight={700} pr={4}>
            Perpetual Market
          </Typography>
        </Stack>

        <NavMenu sx={{ display: { xs: 'none', md: 'block' } }} />

        <Typography fontSize={18} fontWeight={700} sx={{ ml: 'auto' }}>
          {time}
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
