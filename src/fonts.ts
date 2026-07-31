// Self-hosted webfonts. DM Sans carries the UI, DM Mono carries every number so
// that prices keep a fixed advance width while they tick.
import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/dm-mono/latin-500.css'

export const SANS_STACK =
  "'DM Sans Variable', system-ui, -apple-system, 'Helvetica Neue', sans-serif"

export const MONO_STACK =
  "'DM Mono', ui-monospace, 'SF Mono', 'Roboto Mono', monospace"

/**
 * Spread into `sx` for anything that shows a live number. Fixed advance width
 * stops the row from shifting sideways on every tick, and keeps columns of
 * figures aligned across cards.
 */
export const numericFont = {
  fontFamily: MONO_STACK,
  fontVariantNumeric: 'tabular-nums',
} as const
