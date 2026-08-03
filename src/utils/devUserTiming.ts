/**
 * React's development build takes a `performance.measure()` reading for every
 * component it renders — that is what draws its tracks in the DevTools
 * performance panel. Nothing ever clears them, and this board renders several
 * thousand components a second across a full watchlist: after two minutes the
 * entries alone held 100MB of the tab's 190MB, all of it invisible to the JS
 * heap figure because the entries are native objects. Left open, the tab grows
 * by roughly three gigabytes an hour until Chrome offers to close it.
 *
 * The production build takes no readings at all, so this is a development
 * problem only — but development is where the board is left open longest.
 */

/**
 * Long enough that a profile taken by hand still has its recent history to read,
 * short enough that the buffer holds seconds rather than hours.
 */
const CLEAR_INTERVAL_MS = 10_000

/**
 * Chrome writes a trace event at the moment each reading is taken, so a
 * recording made while this is running still shows React's tracks in full. The
 * buffer this empties only serves `performance.getEntries()`, which nothing in
 * this app reads.
 *
 * Marks are left alone: React takes none, and clearing them would reach into
 * whatever tooling does.
 */
export function boundUserTimingBuffer() {
  if (typeof performance === 'undefined' || !performance.clearMeasures) return

  setInterval(() => performance.clearMeasures(), CLEAR_INTERVAL_MS)
}
