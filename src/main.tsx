import * as React from 'react'
import * as ReactDOM from 'react-dom/client'

import App from './App'
import { boundUserTimingBuffer } from './utils/devUserTiming'
import { isChunkLoadError, reloadOnceForStaleChunk } from './utils/staleChunk'
import './fonts'
import './index.css'

// Compiled out of the production bundle, which takes no readings to begin with.
if (import.meta.env.DEV) {
  boundUserTimingBuffer()
}

// Catches a stale chunk that was asked for outside React.lazy — shared async
// splits, for example — so those also reload instead of blanking the page.
window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason) && reloadOnceForStaleChunk()) {
    event.preventDefault()
  }
})

window.addEventListener('error', (event) => {
  if (
    isChunkLoadError(event.error ?? event.message) &&
    reloadOnceForStaleChunk()
  ) {
    event.preventDefault()
  }
})

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
