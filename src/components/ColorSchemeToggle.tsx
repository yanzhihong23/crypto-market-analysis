import { IconButton, Tooltip, useColorScheme } from '@mui/material'
import LightModeIcon from '@mui/icons-material/LightModeOutlined'
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined'

/**
 * The page follows the system preference until this is touched, after which
 * the explicit choice is remembered.
 */
export default function ColorSchemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme()

  // Undefined on the first render, before the stored preference is read.
  if (!mode) return null

  const resolved = mode === 'system' ? systemMode : mode
  const next = resolved === 'dark' ? 'light' : 'dark'

  return (
    <Tooltip title={`Switch to ${next} mode`} arrow>
      <IconButton
        size="small"
        aria-label={`Switch to ${next} mode`}
        onClick={() => setMode(next)}
      >
        {resolved === 'dark' ? (
          <LightModeIcon fontSize="small" />
        ) : (
          <DarkModeIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  )
}
