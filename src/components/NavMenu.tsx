import { SxProps, Tab, Tabs, Box, styled } from '@mui/material'
import { Link, useLocation } from 'react-router'

import { useMessages } from '../i18n'

import { NAV_ITEMS } from './navItems'

const StyledTab = styled(Tab)<{ component?: React.ElementType; to?: string }>(
  ({ theme }) => ({
    color: theme.vars.palette.text.secondary,
    '&.Mui-selected': {
      color: theme.vars.palette.text.primary,
      fontWeight: 600,
    },
  }),
)

export default function NavMenu({ sx }: { sx?: SxProps }) {
  const location = useLocation()
  const t = useMessages()

  // Anything off that list selects nothing rather than itself: Tabs logs an
  // error over a value none of its children carry, and an unknown path holds
  // the location for the frame it takes the catch-all route to redirect. This
  // used to name the one such path there was, which only worked until the next
  // one turned up.
  const active = NAV_ITEMS.some((item) => item.path === location.pathname)
    ? location.pathname
    : false

  return (
    <Box sx={sx}>
      <Tabs value={active} role="navigation" className="nav-tabs">
        {NAV_ITEMS.map((item) => (
          <StyledTab
            key={item.path}
            label={t.nav[item.key]}
            value={item.path}
            component={Link}
            to={item.path}
          />
        ))}
      </Tabs>
    </Box>
  )
}
