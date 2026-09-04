import { Box, Stack, Tooltip, Typography } from '@mui/material'

import useOkxTimeframes from '../hooks/useOkxTimeframes'
import { numericFont } from '../fonts'
import { useMessages } from '../i18n'
import { formatSigmas } from '../utils/signals'
import {
  periodLabelOf,
  type TimeframeRead,
  timeframeAgreement,
} from '../utils/timeframes'

import PositionTrack from './PositionTrack'

/**
 * One period. The move first and coloured, because that is the column being
 * scanned down; then how unusual the move is for this period, which is what
 * makes a quarter hour and a day comparable at all; then the range position;
 * then whatever else this period found.
 */
function TimeframeRow({ read }: { read: TimeframeRead }) {
  const t = useMessages()
  const move = read.returnPercent

  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', gap: 1, minHeight: 22, flexWrap: 'wrap' }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: 'text.secondary',
          width: 28,
          flexShrink: 0,
          ...numericFont,
        }}
      >
        {periodLabelOf(read.period)}
      </Typography>

      <Typography
        sx={{
          fontSize: 13,
          width: 62,
          flexShrink: 0,
          textAlign: 'right',
          ...numericFont,
          color:
            move === null
              ? 'text.secondary'
              : move > 0
                ? 'market.up'
                : move < 0
                  ? 'market.down'
                  : 'text.secondary',
        }}
      >
        {move === null
          ? '—'
          : `${move > 0 ? '+' : ''}${move.toFixed(move >= 10 || move <= -10 ? 1 : 2)}%`}
      </Typography>

      {/* Magnitude only: the move beside it already carries the direction, and
          a signed sigma next to a signed percent is the same fact twice. */}
      <Typography
        sx={{
          fontSize: 12,
          width: 40,
          flexShrink: 0,
          color: 'text.secondary',
          opacity: 0.8,
          ...numericFont,
        }}
      >
        {read.deviation === null ? '' : formatSigmas(read.deviation, t)}
      </Typography>

      {read.position !== null ? (
        <Tooltip
          title={t.timeframe.position(Math.round(read.position * 100))}
          arrow
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PositionTrack position={read.position} />
          </Box>
        </Tooltip>
      ) : (
        <Box sx={{ width: 44, flexShrink: 0 }} />
      )}

      {read.signals.map((signal) => (
        <Tooltip key={signal.kind} title={signal.detail} arrow>
          <Box
            component="span"
            sx={{
              fontSize: 11,
              px: 0.625,
              py: 0.125,
              borderRadius: '6px',
              backgroundColor: 'surface.subtle',
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              ...numericFont,
            }}
          >
            {signal.label}
          </Box>
        </Tooltip>
      ))}
    </Stack>
  )
}

/**
 * The same instrument at four bar sizes, one row each.
 *
 * The board answers what is happening now; this answers whether the periods
 * agree about it, which is the question a chart gets opened for. Four rows
 * pointing one way is a different event from one row pointing and three not,
 * and no single-horizon reading can tell them apart.
 *
 * Laid out rather than scored. The count in the heading is a count — it says how
 * many of the four moved the same way and nothing about how much that is worth —
 * because every row it counted is directly underneath it to be disagreed with.
 */
export default function TimeframeGrid({
  instId,
  open,
}: {
  instId: string
  open: boolean
}) {
  const t = useMessages()
  const { reads, loading, failed } = useOkxTimeframes(instId, open)

  if (failed) return null

  const agreement = timeframeAgreement(reads)

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1, mb: 0.75 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {t.timeframe.title}
        </Typography>
        {agreement && (
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            {t.timeframe.agreement(
              agreement.agreed,
              agreement.of,
              agreement.up,
            )}
          </Typography>
        )}
      </Stack>

      {reads.length ? (
        <Stack sx={{ gap: 0.5 }}>
          {reads.map((read) => (
            <TimeframeRow key={read.period} read={read} />
          ))}
        </Stack>
      ) : (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', py: 1 }}>
          {loading ? t.timeframe.loading : t.detail.empty}
        </Typography>
      )}
    </Box>
  )
}
