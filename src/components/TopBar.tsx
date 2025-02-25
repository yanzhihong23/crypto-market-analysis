import { AppBar, Stack, Toolbar, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

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
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 2L4 8V24L16 30L28 24V8L16 2Z"
              fill="currentColor"
              fillOpacity="0.2"
            />
            <path
              d="M16 6L8 10V22L16 26L24 22V10L16 6Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16 12V20M12 16H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <Typography variant="h6" fontWeight={700} pr={4}>
            Crypto Market
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
