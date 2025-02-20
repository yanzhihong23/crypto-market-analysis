import { SpeedDial, SpeedDialIcon, SpeedDialAction } from '@mui/material'
import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import WatchIcon from '@mui/icons-material/Watch'
import StorefrontIcon from '@mui/icons-material/Storefront'

export default function NavSpeedDial() {
  const [open, setOpen] = useState(false)
  const actions = [
    {
      icon: <AddIcon />,
      tooltipTitle: 'Add',
      onClick: () => {},
    },
    {
      icon: <WatchIcon />,
      tooltipTitle: '24H',
      onClick: () => {},
    },
    {
      icon: <StorefrontIcon />,
      tooltipTitle: 'UTC+0',
      onClick: () => {},
    },
    {
      icon: <StorefrontIcon />,
      tooltipTitle: 'UTC+8',
      onClick: () => {},
    },
  ]

  return (
    <SpeedDial
      ariaLabel="SpeedDial tooltip example"
      sx={{ position: 'fixed', bottom: 32, right: 32 }}
      icon={<SpeedDialIcon />}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.tooltipTitle}
          icon={action.icon}
          tooltipTitle={action.tooltipTitle}
          onClick={action.onClick}
        />
      ))}
    </SpeedDial>
  )
}
