import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { memo, useCallback, useRef, useSyncExternalStore } from 'react'

import { useTickerStore } from '../store/useTickerStore'
import {
  getOkxPercentOrNull,
  subscribeOkxPercent,
} from '../store/okxRealtimeTicker'
import { numericFont } from '../fonts'
import { useMessages } from '../i18n'

interface BreadthSnapshot {
  up: number
  down: number
  total: number
  /** Rounded to two decimal places so sub-basis-point jitter does not re-render. */
  median: number
}

const EMPTY_BREADTH: BreadthSnapshot = { up: 0, down: 0, total: 0, median: 0 }

function computeBreadth(instIds: string[]): BreadthSnapshot {
  const values: number[] = []
  let up = 0
  let down = 0

  for (const instId of instIds) {
    const value = getOkxPercentOrNull(instId)
    if (value === null || !Number.isFinite(value)) continue
    values.push(value)
    if (value > 0) up += 1
    else if (value < 0) down += 1
  }

  const total = values.length
  if (total === 0) return EMPTY_BREADTH

  values.sort((a, b) => a - b)
  const mid = Math.floor(total / 2)
  const rawMedian =
    total % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2
  const median = Math.round(rawMedian * 100) / 100

  return { up, down, total, median }
}

function useBoardBreadth(instIds: string[]): BreadthSnapshot {
  const snapshotRef = useRef<BreadthSnapshot>(EMPTY_BREADTH)

  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubs = instIds.map((instId) =>
        subscribeOkxPercent(instId, listener),
      )
      return () => {
        unsubs.forEach((unsub) => unsub())
      }
    },
    [instIds],
  )

  const getSnapshot = useCallback(() => {
    const next = computeBreadth(instIds)
    const prev = snapshotRef.current
    if (
      prev.up === next.up &&
      prev.down === next.down &&
      prev.total === next.total &&
      prev.median === next.median
    ) {
      return prev
    }
    snapshotRef.current = next
    return next
  }, [instIds])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * A quiet desktop-only breadth readout at the trailing edge of the toolbar:
 * advancers, decliners and the board's median session change, so a reader can
 * tell in a glance whether a red card is moving with the rest of the watchlist
 * or breaking away from it.
 *
 * Isolated in its own memoised component so three-second percent flushes never
 * re-render the toolbar controls sitting beside it.
 */
function OkxBoardBreadth() {
  const instIds = useTickerStore((state) => state.instIds)
  const { up, down, total, median } = useBoardBreadth(instIds)
  const t = useMessages()

  if (total === 0) return null

  const upShare = (up / total) * 100
  const downShare = (down / total) * 100
  const medianColor =
    median > 0 ? 'market.up' : median < 0 ? 'market.down' : 'text.secondary'
  const medianText = `${median > 0 ? '+' : ''}${median.toFixed(2)}%`

  return (
    <Tooltip title={t.toolbar.breadthHint(total)} arrow>
      <Stack
        direction="row"
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 1,
          ml: 'auto',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {/* Proportional split bar: green from the left, red from the right,
            leaving neutral track in the middle for any flat symbols. */}
        <Box
          aria-hidden
          sx={{
            position: 'relative',
            width: 48,
            height: 4,
            borderRadius: '999px',
            backgroundColor: 'surface.subtle',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {up > 0 && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${upShare}%`,
                backgroundColor: 'market.up',
              }}
            />
          )}
          {down > 0 && (
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${downShare}%`,
                backgroundColor: 'market.down',
              }}
            />
          )}
        </Box>

        <Stack
          direction="row"
          sx={{
            alignItems: 'baseline',
            gap: 0.5,
            fontSize: 13,
            ...numericFont,
          }}
        >
          <Box component="span" sx={{ color: 'market.up', fontWeight: 500 }}>
            {t.toolbar.breadthUp(up)}
          </Box>
          <Box
            component="span"
            aria-hidden
            sx={{ color: 'text.secondary', opacity: 0.45 }}
          >
            /
          </Box>
          <Box component="span" sx={{ color: 'market.down', fontWeight: 500 }}>
            {t.toolbar.breadthDown(down)}
          </Box>
        </Stack>

        <Box
          component="span"
          aria-hidden
          sx={{ fontSize: 13, color: 'text.secondary', opacity: 0.45 }}
        >
          ·
        </Box>

        <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.5 }}>
          <Typography
            component="span"
            sx={{ fontSize: 13, color: 'text.secondary' }}
          >
            {t.toolbar.breadthMedian}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: medianColor,
              ...numericFont,
            }}
          >
            {medianText}
          </Typography>
        </Stack>
      </Stack>
    </Tooltip>
  )
}

export default memo(OkxBoardBreadth)
