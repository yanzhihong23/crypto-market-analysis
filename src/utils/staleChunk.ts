/**
 * A tab that outlives a deploy still knows the previous build's chunk URLs.
 * Asking for one of those after the files are gone fails the dynamic import —
 * and without a handler, React leaves the tree empty. That is the white screen
 * on a route change, and on any other first load of a split that was not yet
 * fetched when the new build went up.
 *
 * Reloading is the honest fix: the document itself is also stale, and the only
 * page that can name the current chunks is a fresh one. A short cooldown stops
 * a broken deploy from reloading forever, and stops two handlers firing on the
 * same failure from clearing each other's flag before the reload lands.
 */

const RELOAD_KEY = 'vigil:chunk-reload'

/** Long enough that a failed reload cannot immediately try again. */
const COOLDOWN_MS = 15_000

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false
  const message = error instanceof Error ? error.message : String(error)
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  )
}

/**
 * Reloads if a reload has not already been tried in the cooldown window.
 * Returns true when a reload was started, so the caller can stop propagating
 * the error into an empty tree.
 */
export function reloadOnceForStaleChunk(): boolean {
  try {
    const previous = Number(sessionStorage.getItem(RELOAD_KEY) ?? '')
    if (Number.isFinite(previous) && Date.now() - previous < COOLDOWN_MS) {
      return false
    }
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // Private mode can refuse sessionStorage; still try the reload.
  }
  window.location.reload()
  return true
}
