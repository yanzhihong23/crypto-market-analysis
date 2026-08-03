import * as React from 'react'
import * as ReactDOM from 'react-dom/client'

import App from './App'
import { boundUserTimingBuffer } from './utils/devUserTiming'
import './fonts'
import './index.css'

// Compiled out of the production bundle, which takes no readings to begin with.
if (import.meta.env.DEV) {
  boundUserTimingBuffer()
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
