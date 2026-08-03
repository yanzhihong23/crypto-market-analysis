import {
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/MenuRounded'
import CloseIcon from '@mui/icons-material/CloseRounded'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

import { useMessages } from '../i18n'

import { NAV_ITEMS } from './navItems'

/**
 * Three tabs, a clock and a status dot do not fit across a phone, so the tab
 * bar is hidden below `md` — which until now left the other pages reachable
 * only by typing their URL. The same routes move into a drawer instead.
 */
export default function MobileNavMenu() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const theme = useTheme()
  const t = useMessages()

  // Unmounted rather than hidden: a drawer left open while the viewport grows
  // past the breakpoint would outlive the button that opens it.
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  if (desktop) return null

  return (
    <>
      <IconButton
        size="small"
        aria-label={t.navMenu.open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon sx={{ fontSize: 22 }} />
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: { width: 248, backgroundImage: 'none' },
          },
        }}
      >
        {/* Matches the toolbar's height and padding so the close button lands
            on the button that opened it and the rule continues the app bar's. */}
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: 64,
            px: 2,
            borderBottom: `1px solid ${theme.vars.palette.divider}`,
          }}
        >
          <IconButton
            size="small"
            aria-label={t.navMenu.close}
            onClick={() => setOpen(false)}
          >
            <CloseIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Stack>

        <List component="nav" sx={{ p: 1 }}>
          {NAV_ITEMS.map((item) => {
            const selected = item.path === location.pathname
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={selected}
                aria-current={selected ? 'page' : undefined}
                onClick={() => setOpen(false)}
                sx={{
                  // Explicit px, not the shorthand: the theme's 16px shape
                  // radius makes `borderRadius: 2` a 32px stadium.
                  borderRadius: '10px',
                  // The theme's selected fill is the primary indigo, which on a
                  // page that spends colour on price direction would make the
                  // menu the loudest thing on screen.
                  '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: 'surface.subtle',
                  },
                }}
              >
                <ListItemText
                  primary={t.nav[item.key]}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: selected ? 600 : 500,
                        color: selected ? 'text.primary' : 'text.secondary',
                      },
                    },
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Drawer>
    </>
  )
}
