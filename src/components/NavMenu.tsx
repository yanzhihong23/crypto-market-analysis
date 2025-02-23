import { SxProps, Tab, Tabs, Box, styled } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'

const StyledTab = styled(Tab)<{ component?: React.ElementType; to?: string }>(
  ({ theme }) => ({
    fontSize: 16,
    fontWeight: 500,
    color: theme.palette.primary.contrastText,
    '&.Mui-selected': {
      color: theme.palette.primary.contrastText,
    },
  }),
)

export default function NavMenu({ sx }: { sx?: SxProps }) {
  const location = useLocation()

  const getActiveTab = (pathname: string) => {
    if (pathname === '/test') return false
    return pathname
  }

  return (
    <Box sx={sx}>
      <Tabs
        value={getActiveTab(location.pathname)}
        role="navigation"
        className="nav-tabs"
      >
        <StyledTab label="Home" value="/" component={Link} to="/" />
        <StyledTab
          label="Market"
          value="/binance-perpetual-market"
          component={Link}
          to="/binance-perpetual-market"
        />
        <StyledTab
          label="Charts"
          value="/charts"
          component={Link}
          to="/charts"
        />
      </Tabs>
    </Box>
  )
}
