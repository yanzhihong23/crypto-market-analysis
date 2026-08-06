import { ComponentType, lazy, LazyExoticComponent } from 'react'

import { isChunkLoadError, reloadOnceForStaleChunk } from './staleChunk'

/**
 * `React.lazy` with a single retry via full reload when the chunk is gone.
 * A hanging promise after the reload is intentional: resolving with a broken
 * module would paint the empty tree the reload is there to avoid.
 */
export function lazyPage<T extends ComponentType>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((error: unknown) => {
      if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    }),
  )
}
