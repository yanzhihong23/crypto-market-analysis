import { IconButton, Tooltip, useColorScheme } from '@mui/material'
import LightModeIcon from '@mui/icons-material/LightModeOutlined'
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined'

import { useMessages } from '../i18n'

/**
 * The page follows the system preference until this is touched, after which
 * the explicit choice is remembered.
 */
export default function ColorSchemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme()
  const t = useMessages()

  // Undefined on the first render, before the stored preference is read.
  if (!mode) return null

  const resolved = mode === 'system' ? systemMode : mode
  const next = resolved === 'dark' ? 'light' : 'dark'
  // One phrase per destination rather than the mode's name dropped into a
  // sentence: "light" and "dark" are adjectives that decline in some languages
  // and are a noun compound in Chinese, so the whole label has to be written.
  const title = next === 'light' ? t.colorScheme.toLight : t.colorScheme.toDark

  return (
    <Tooltip title={title} arrow>
      <IconButton
        size="small"
        aria-label={title}
        onClick={() => setMode(next)}
        sx={{ color: 'text.secondary' }}
      >
        {resolved === 'dark' ? (
          <LightModeIcon sx={{ fontSize: 20 }} />
        ) : (
          <DarkModeIcon sx={{ fontSize: 20 }} />
        )}
      </IconButton>
    </Tooltip>
  )
}
