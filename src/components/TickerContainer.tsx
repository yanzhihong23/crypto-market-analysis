import { Stack, SxProps, Theme } from '@mui/material'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react'

/** Above this 24h move a card earns the stronger border and fill. */
const STRONG_MOVE_PERCENT = 5

/** Card radius. */
const CORNER_RADIUS = 16

/** True hover with a mouse / trackpad — not a finger that leaves sticky :hover. */
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

function TickerContainer({
  up,
  changePercent = 0,
  minWidth = 236,
  width,
  pending = false,
  flagged = false,
  onDoubleClick,
  /**
   * Touch has no lasting hover. When set, a single tap toggles the action bar
   * open; fine-pointer devices keep using hover and ignore the tap path.
   * Never means "always show the bar on mobile".
   */
  tapActions = false,
  children,
  sx,
}: {
  up?: boolean
  /** Only decides whether this is a strong mover; the size of the move is
   * drawn on the range track, between the open and the live price. */
  changePercent?: number
  minWidth?: number
  width?: number
  /** No data yet, so the card claims no direction. */
  pending?: boolean
  /**
   * Two different kinds of reading on this card are out of range at once — what
   * the price did and whether anything was behind it, say — which is rarer and
   * more worth crossing the grid for than any one of them alone. It takes over
   * the ring; direction still reads off the stroke and the fill, so nothing is
   * lost when a strong mover is also the one the crowd is short.
   */
  flagged?: boolean
  /** Toggles the pin. Double-click rather than a control, so the card front
   * stays given over to the readings. */
  onDoubleClick?: () => void
  tapActions?: boolean
  children: React.ReactNode
  sx?: SxProps
}) {
  const strong = !pending && Math.abs(changePercent) >= STRONG_MOVE_PERCENT
  // The tinted edge a mover earns, and the one every card shows on hover.
  const edgeColor = useCallback(
    (theme: Theme) =>
      flagged
        ? theme.vars.palette.signal.border
        : pending
          ? theme.vars.palette.surface.border
          : up
            ? theme.vars.palette.market.upBorder
            : theme.vars.palette.market.downBorder,
    [flagged, pending, up],
  )

  const [actionsOpen, setActionsOpen] = useState(false)
  const finePointerRef = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia(FINE_POINTER_QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER_QUERY)
    finePointerRef.current = mq.matches
    const onChange = () => {
      finePointerRef.current = mq.matches
      // Hover owns visibility on fine pointers; drop any leftover tap-open state.
      if (mq.matches) setActionsOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // A tap-opened bar must not ride along with a finger scroll the way sticky
  // :hover used to. Capture so nested scroll parents still clear it.
  useEffect(() => {
    if (!actionsOpen) return
    const close = () => setActionsOpen(false)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [actionsOpen])

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!tapActions || finePointerRef.current) return
      // Second click of a double-tap is reserved for pin; do not flip the bar.
      if (event.detail > 1) return
      if ((event.target as Element).closest?.('.actionBar')) return
      setActionsOpen((open) => !open)
    },
    [tapActions],
  )

  const handleDoubleClick = useCallback(() => {
    setActionsOpen(false)
    onDoubleClick?.()
  }, [onDoubleClick])

  // Memoize the large sx object to avoid recreating on every render
  const containerSx = useMemo<SxProps<Theme>>(
    () => ({
      position: 'relative',
      overflow: 'hidden',
      // Fills its grid cell so a row of cards shares one baseline instead of
      // ending wherever its own content happens to stop.
      height: '100%',
      p: 2.5,
      zIndex: 2,
      borderRadius: `${CORNER_RADIUS}px`,
      // Double-clicking to pin would otherwise select whichever price sat under
      // the cursor, and on a card that redraws every tick that selection is
      // never worth keeping.
      userSelect: 'none',
      // At the card's own scale direction is a wash of tint and nothing more:
      // the reading itself is on the range track. Every card used to carry a
      // full animated gradient outline, which meant no card stood out; now only
      // real movers get the stronger edge and fill.
      backgroundColor: strong
        ? up
          ? 'market.upSurface'
          : 'market.downSurface'
        : 'background.paper',
      // An inset ring rather than a border, so the ring sits on the card's own
      // edge instead of pushing the padding box inwards.
      boxShadow: (theme: Theme) =>
        `inset 0 0 0 1px ${
          strong || flagged
            ? edgeColor(theme)
            : theme.vars.palette.surface.border
        }`,
      transition: 'box-shadow 0.2s ease-out',
      // Hover chrome only where a fine pointer can leave again. Touch scroll
      // otherwise sticks :hover and flashes the action bar over the sparkline.
      [`@media ${FINE_POINTER_QUERY}`]: {
        '&:hover': {
          // No transform: a scaling card overlaps its neighbours in a dense grid
          // and forces a repaint of the whole row.
          boxShadow: (theme: Theme) =>
            `${theme.vars.palette.surface.shadow}, inset 0 0 0 1px ${edgeColor(theme)}`,
          '& .actionBar': {
            display: 'flex',
          },
        },
      },
      // Tap-to-toggle on touch; never a permanent always-visible mobile bar.
      '&.actions-open .actionBar': {
        display: 'flex',
      },
      ...sx,
    }),
    [up, strong, flagged, edgeColor, sx],
  )

  return (
    <Stack
      direction="column"
      className={actionsOpen ? 'actions-open' : undefined}
      onClick={tapActions ? handleClick : undefined}
      onDoubleClick={onDoubleClick ? handleDoubleClick : undefined}
      sx={[
        {
          gap: 1.5,
          width: width,
          minWidth: minWidth,
        },
        ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
      ]}
    >
      {children}
    </Stack>
  )
}

export default memo(TickerContainer)
