import './App.css'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { useEffect } from 'react'

import Pages from './routes'
import theme from './theme'
import { useLocale } from './i18n'
import { htmlLang } from './i18n/locale'

function App() {
  const locale = useLocale()

  // Not copy, so it cannot come out of the dictionary: this is the attribute a
  // screen reader picks a voice from and the browser hyphenates by, and the
  // document it belongs to is outside React's tree.
  useEffect(() => {
    document.documentElement.lang = htmlLang(locale)
  }, [locale])

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <Pages />
    </ThemeProvider>
  )
}

export default App
