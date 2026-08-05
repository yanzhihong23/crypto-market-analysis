import { keyframes } from '@emotion/react'
import { Box, IconButton, Stack, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { formatDistanceToNowStrict } from 'date-fns'

import { Alert, useAlertStore } from '../store/useAlertStore'
import { numericFont } from '../fonts'
import { useDateLocale, useMessages } from '../i18n'

/**
 * What has fired recently, along the bottom of the board.
 *
 * The bell already holds the whole log, and this is not a second copy of it —
 * the two answer different questions. The bell is where you go once you know to
 * ask what happened. The tape is what tells you something happened at all while
 * you are reading a card three rows below the one that rang, without asking you
 * to keep an eye on a badge in the corner.
 *
 * It runs rather than cycling one entry at a time. A carousel decides how long
 * you get with each entry, and the one you wanted is always the one that just
 * left; a strip carries several at once and hands the pacing back — a pointer
 * anywhere on it stops it, and a reader whose system has asked for less motion
 * gets a row they can scroll by hand instead of one that moves on its own.
 */

/** One line of 12px text with room to breathe. The page reserves exactly this. */
const TAPE_HEIGHT = 34

/**
 * How far back the strip reaches. The log keeps fifty entries so that "what
 * happened while I was out" has an answer; the tape makes a stronger claim —
 * that this is still what the board is doing — and the readings underneath it
 * are five-minute ones. Three of those is about as long as that holds.
 */
const RECENT = 15 * 60 * 1000

/**
 * Enough to be a tape rather than a headline, and few enough that the loop comes
 * back round while the first entry is still worth reading.
 */
const MOST_RECENT = 12

/**
 * How much of an entry the strip carries. `flagStateOf` hands over every reading
 * that was out of range, which on a symbol doing several things at once is more
 * than fits on a line anybody reads to the end of. The same three the desktop
 * notification takes, for the same reason: the bell is where all of them are.
 */
const MOST_REASONS = 3

/**
 * And how much of the backdrop it carries after them. One, where the bell shows
 * all of it: this line already runs to three readings, and the backdrop is the
 * qualifier on them rather than more of them — a reader who wants the rest is
 * asking a longer question than a moving strip can answer.
 */
const MOST_CONTEXT = 1

/** Pixels a second: slow enough to finish reading an entry that is leaving. */
const SPEED = 40

/** How often the window closes on an entry and the relative times move on. */
const TICK = 30 * 1000

const scroll = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`

/**
 * Both copies of the row are this, including the trailing gap — with the space
 * inside the group rather than between the two of them, the halves are exactly
 * the same width, which is what lets the loop hand over at -50% without a seam.
 */
const groupSx = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: 3,
  pr: 3,
} as const

/**
 * Between the readings within an entry. A middle dot would not do it: every
 * reading already spells itself with one, so the mark that separated two of them
 * would be the same mark that joins a move to its sigma. This is the rule the
 * top bar uses to hold two kinds of thing apart, at the size this line reads at.
 */
const ruleSx = {
  width: '1px',
  height: 10,
  flexShrink: 0,
  backgroundColor: 'surface.marker',
} as const

/** Entries do not stop dead at the edges; they arrive and leave. */
const fade =
  'linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)'

function useRecentAlerts(): Alert[] {
  const enabled = useAlertStore((state) => state.tapeEnabled)
  const alerts = useAlertStore((state) => state.alerts)
  const dismissedAt = useAlertStore((state) => state.tapeDismissedAt)
  const [now, setNow] = useState(() => Date.now())

  // One clock for two jobs: an entry ageing out of the window, and the "2m ago"
  // on the ones still in it. Neither is worth a second of anybody's attention,
  // so neither is worth a timer of its own.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK)
    return () => clearInterval(interval)
  }, [])

  return useMemo(
    () =>
      enabled
        ? alerts
            .filter(
              (alert) => alert.at > dismissedAt && now - alert.at < RECENT,
            )
            .slice(0, MOST_RECENT)
        : [],
    [enabled, alerts, dismissedAt, now],
  )
}

export default function AlertTape() {
  const alerts = useRecentAlerts()
  const dismiss = useAlertStore((state) => state.dismissTape)
  const t = useMessages()
  const dateLocale = useDateLocale()

  const viewportRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  /** Seconds for one pass, or zero for a row with nowhere to go. */
  const [duration, setDuration] = useState(0)

  const showing = alerts.length > 0

  // The strip is fixed over the bottom of the viewport, so the page underneath
  // has to stop short of it — and it is the strip's own coming and going that
  // decides by how much. Published as a custom property rather than lifted into
  // the layout so that a tape appearing, or ageing out an hour later, does not
  // re-render the board it is sitting under.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty(
      '--vigil-tape-height',
      showing ? `${TAPE_HEIGHT}px` : '0px',
    )
    return () => {
      root.style.removeProperty('--vigil-tape-height')
    }
  }, [showing])

  // Measured rather than derived from the number of entries: two alerts can be
  // a third of the width of twelve, and a duration per entry would run a short
  // tape at a crawl and a long one past reading speed.
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const group = groupRef.current
    if (!viewport || !group) return

    const measure = () => {
      const width = group.getBoundingClientRect().width
      // A row that already fits has nothing to reveal by moving, and moving it
      // anyway would drag text past a reader to no end.
      setDuration(width > viewport.clientWidth ? width / SPEED : 0)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(group)
    return () => observer.disconnect()
  }, [alerts])

  if (!showing) return null

  const entries = alerts.map((alert) => (
    <Stack
      key={alert.id}
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 0.75,
        whiteSpace: 'nowrap',
        fontSize: 12,
      }}
    >
      {/* The mark that opens an entry is also what separates it from the one
          before, and amber because this is a signal — the tape never carries a
          number with a direction, so red and green stay out of it. */}
      <Box
        sx={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: 'signal.main',
          flexShrink: 0,
        }}
      />
      <Box component="span" sx={{ fontWeight: 600 }}>
        {alert.instId.split('-')[0]}
      </Box>
      {/* What kind of event it was, then what it was made of — the same order,
          and the same two weights, the bell puts them in. A headline on its own
          says a card is worth looking at; the readings are what let you decide
          from here whether it is. */}
      <Box component="span">{alert.headline}</Box>
      {alert.reasons.slice(0, MOST_REASONS).map((reason) => (
        <Fragment key={reason.kind}>
          <Box sx={ruleSx} />
          <Box
            component="span"
            sx={{ ...numericFont, color: 'text.secondary' }}
          >
            {reason.detail}
          </Box>
        </Fragment>
      ))}
      {/* What had been true for weeks when this fired. Behind the readings and
          in the label rather than the sentence, because it is not one of them:
          those say what happened, and this says what it happened to. No rule in
          front of it either — a rule would rank it with them. */}
      {(alert.context ?? []).slice(0, MOST_CONTEXT).map((reading) => (
        <Box
          key={reading.kind}
          component="span"
          sx={{
            ml: 0.5,
            fontSize: 11,
            color: 'text.secondary',
            opacity: 0.75,
          }}
        >
          {reading.label}
        </Box>
      ))}
      {/* Which is the difference between "this is happening" and "this happened
          while you were making coffee". Set apart from the readings rather than
          ruled off them: it is not one of them. */}
      <Box
        component="span"
        sx={{
          ...numericFont,
          ml: 0.5,
          fontSize: 11,
          color: 'text.secondary',
          opacity: 0.6,
        }}
      >
        {formatDistanceToNowStrict(alert.at, {
          addSuffix: true,
          locale: dateLocale,
        })}
      </Box>
    </Stack>
  ))

  return (
    <Box
      component="aside"
      aria-label={t.alerts.recent}
      sx={(theme) => ({
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        // Over the board and under anything the board opens on top of itself.
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        height: TAPE_HEIGHT,
        px: { xs: 1, md: 1.5 },
        backgroundColor: theme.vars.palette.background.paper,
        borderTop: `1px solid ${theme.vars.palette.divider}`,
        // Anywhere on the strip, not only over the text: someone reaching for
        // the entry that is leaving should not have to catch it first.
        '&:hover [data-tape-track], &:focus-within [data-tape-track]': {
          animationPlayState: 'paused',
        },
      })}
    >
      {/* The same bell as the one in the top bar, so the strip reads as that
          list having spoken rather than as a fourth thing to learn. */}
      <NotificationsNoneIcon
        sx={{ fontSize: 16, color: 'signal.main', flexShrink: 0 }}
      />

      <Box
        ref={viewportRef}
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          maskImage: fade,
          WebkitMaskImage: fade,
          // Nothing moves, so nothing is out of reach on a timer; the row
          // becomes one you push along yourself.
          '@media (prefers-reduced-motion: reduce)': {
            overflowX: 'auto',
            maskImage: 'none',
            WebkitMaskImage: 'none',
          },
        }}
      >
        <Box
          data-tape-track
          sx={{
            display: 'flex',
            width: 'max-content',
            animation: duration
              ? `${scroll} ${duration}s linear infinite`
              : 'none',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <Box ref={groupRef} sx={groupSx}>
            {entries}
          </Box>
          {/* The second pass, which is what the first one runs into instead of
              running out. Only worth carrying while the row is moving. */}
          {duration > 0 && (
            <Box
              aria-hidden
              sx={{
                ...groupSx,
                '@media (prefers-reduced-motion: reduce)': { display: 'none' },
              }}
            >
              {entries}
            </Box>
          )}
        </Box>
      </Box>

      <Tooltip title={t.alerts.hide} arrow>
        <IconButton
          size="small"
          aria-label={t.alerts.hide}
          onClick={dismiss}
          sx={{ color: 'text.secondary', flexShrink: 0, p: 0.5 }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
