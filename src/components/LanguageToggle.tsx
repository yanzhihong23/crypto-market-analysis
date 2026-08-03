import { IconButton, Tooltip } from '@mui/material'
import LanguageIcon from '@mui/icons-material/LanguageOutlined'

import { useLocale, useMessages, useSetLocale } from '../i18n'
import { otherLocale } from '../i18n/locale'

/**
 * The board follows the browser's languages until this is touched, after which
 * the explicit choice is remembered — the same bargain the colour scheme makes,
 * and for the same reason: guessing is right often enough to be the default and
 * wrong often enough to need overriding.
 *
 * Two languages, so it is a toggle rather than a menu, and the tooltip names the
 * one being switched to. Which language is currently on needs no label: the page
 * behind the button is written in it.
 */
export default function LanguageToggle() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useMessages()
  const next = otherLocale(locale)

  return (
    <Tooltip title={t.language.switchTo} arrow>
      <IconButton
        size="small"
        aria-label={t.language.switchTo}
        onClick={() => setLocale(next)}
        sx={{ color: 'text.secondary' }}
      >
        <LanguageIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Tooltip>
  )
}
