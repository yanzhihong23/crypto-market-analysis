import './App.css'
import { ThemeProvider, CssBaseline } from '@mui/material'

import Pages from './routes'
import theme from './theme'

function App() {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <Pages />
    </ThemeProvider>
  )
}

export default App
