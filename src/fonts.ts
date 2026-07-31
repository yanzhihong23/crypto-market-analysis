// Self-hosted webfonts. Geist carries the UI, Geist Mono carries every number
// so that prices keep a fixed advance width while they tick. Both are variable,
// so the whole weight range costs one file each.
import '@fontsource-variable/geist/wght.css'
import '@fontsource-variable/geist-mono/wght.css'

export const SANS_STACK =
  "'Geist Variable', system-ui, -apple-system, 'Helvetica Neue', sans-serif"

export const MONO_STACK =
  "'Geist Mono Variable', ui-monospace, 'SF Mono', 'Roboto Mono', monospace"

/**
 * Spread into `sx` for anything that shows a live number. Fixed advance width
 * stops the row from shifting sideways on every tick, and keeps columns of
 * figures aligned across cards.
 */
export const numericFont = {
  fontFamily: MONO_STACK,
  fontVariantNumeric: 'tabular-nums',
} as const
