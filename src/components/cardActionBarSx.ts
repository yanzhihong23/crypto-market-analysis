/**
 * Over the sparkline rather than pinned to the card's bottom edge, which is
 * where the chips now sit. The chart is the one thing on the card that can
 * afford to be covered: it is the shape of the session, and the buttons are only
 * up while a cursor is on the card.
 *
 * Shared with the skeleton, which draws a bar of its own so a card still waiting
 * on its first message can be taken off the board.
 */
export const cardActionBarSx = {
  position: 'absolute',
  // Anchored to the right rather than spanning the chart. It used to be laid
  // over the whole of it, which was invisible until the signal badge moved into
  // the chart's top-left corner: the bar showed through its own blur, so the
  // badge still looked hoverable, while the bar's box swallowed the pointer and
  // the badge's tooltip could never open. Hugging its buttons leaves that corner
  // alone without having to know how tall the badge is.
  top: 0,
  right: 0,
  bottom: 0,
  px: 2,
  zIndex: 3,
  display: 'none',
  alignItems: 'center',
  gap: 1,
  // The blur alone separates the button from the sparkline behind it; the white
  // wash that used to sit here inverted badly in the dark scheme.
  backdropFilter: 'blur(2px)',
} as const

/**
 * Neutral until it is pointed at. The theme's destructive red is the same hex as
 * its price-down red, so carrying it permanently put a third red on a card that
 * is already coloured by direction; on hover it is unambiguous, because nothing
 * else on the card responds to a cursor sitting on it.
 */
export const removeButtonSx = {
  color: 'text.secondary',
  '&:hover': { color: 'error.main' },
} as const
