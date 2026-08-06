import { Component, type ReactNode } from 'react'

import { isChunkLoadError, reloadOnceForStaleChunk } from '../utils/staleChunk'

/**
 * Catches a chunk-load failure that bubbled past `lazy` — Safari in particular
 * sometimes surfaces it as a render error rather than a rejected import — and
 * reloads once instead of leaving the board blank.
 */
export default class RouteErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    if (isChunkLoadError(error) && reloadOnceForStaleChunk()) return
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
