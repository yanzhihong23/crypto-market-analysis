import { Box, Stack, Tooltip, Typography } from '@mui/material'

import useOkxBackdrop from '../hooks/useOkxBackdrop'
import useOkxTimeframes from '../hooks/useOkxTimeframes'
import { numericFont } from '../fonts'
import { useMessages } from '../i18n'
import type { Messages } from '../i18n/en'
import { formatNumber } from '../utils'
import { isMonthRungReading } from '../utils/backdrop'
import { formatSigmas } from '../utils/signals'
import { periodLabelOf, timeframeAgreement } from '../utils/timeframes'

/**
 * What a rung hangs on its right-hand end. The board's `Signal` and the
 * backdrop's reading are different layers with different lifetimes and nothing
 * in common as types — but a chip is a chip, and the month's rung earns its own
 * the moment the range it describes is a row rather than a panel.
 */
interface RowChip {
  kind: string
  label: string
  detail: string
}

import PositionTrack from './PositionTrack'

/**
 * The month's rung. A bar code like the four above it rather than a translated
 * word, because it is read down the same column as `15m` and `1D` and a reader
 * scanning that column is not changing languages halfway.
 */
const MONTH_LABEL = '30D'

const TRACK_WIDTH = 48

/** Period, move, how unusual the move is, range position, what else it found. */
const LADDER_COLUMNS = `28px 62px 36px ${TRACK_WIDTH}px minmax(0, 1fr)`

/**
 * Below this a sigma is saying "nothing unusual", which is what an empty cell
 * says for nothing. Four rows of `0.2σ 0.7σ 0.2σ 0.4σ` cost a glyph cluster
 * each and are read as a column of noise, and the one time the number matters —
 * a move several times this instrument's usual — it was set in the same grey at
 * the same weight as all of them.
 */
const SIGMA_WORTH_PRINTING = 1
/**
 * And above this it has left the range the instrument normally keeps it in,
 * which is what the board's amber is for. Within the colour budget because a
 * sigma here is a magnitude: the signed move sitting beside it carries the
 * direction, so this is not a number that already has one.
 */
const SIGMA_UNUSUAL = 2

/**
 * Where in the month's range, or that it is no longer in it.
 *
 * `rangePositionOf` is deliberately unclamped — the breakout detectors read the
 * overshoot — so this is the first surface that has had to print the raw value,
 * and `-1%` is not a share of anything. The track underneath has already pinned
 * its marker to the end of the range, which left the number and the marker
 * telling the reader two different things about the same price.
 */
function rangePositionLabel(position: number, t: Messages) {
  if (position < 0 || position > 1) return t.timeframe.rangeBroken(position > 1)
  return `${Math.round(position * 100)}%`
}

/** Two decimals until the move is big enough that the second is noise. */
const formatMove = (move: number) =>
  `${move > 0 ? '+' : ''}${move.toFixed(Math.abs(move) >= 10 ? 1 : 2)}%`

/**
 * One rung: a period, what it did, how unusual that was for it, where it sits
 * in its own range, then whatever else it found.
 *
 * The move first and coloured, because that is the column being scanned down;
 * then how unusual the move is, which is what makes a quarter hour and a day
 * comparable at all; then the range position; then the rest.
 *
 * Cells rather than a row, so every rung shares one grid and the four tracks
 * line up under each other — which is the comparison they are here to make.
 */
function LadderRow({
  label,
  move,
  deviation,
  position,
  signals,
}: {
  label: string
  move: number | null
  deviation: number | null
  position: number | null
  signals: RowChip[]
}) {
  const t = useMessages()
  const sigmas =
    deviation !== null && Math.abs(deviation) >= SIGMA_WORTH_PRINTING
      ? Math.abs(deviation)
      : null

  return (
    <>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: 'text.secondary',
          ...numericFont,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: 13,
          textAlign: 'right',
          ...numericFont,
          color:
            move === null || move === 0
              ? 'text.secondary'
              : move > 0
                ? 'market.up'
                : 'market.down',
        }}
      >
        {move === null ? '—' : formatMove(move)}
      </Typography>

      {/* Magnitude only: the move beside it already carries the direction, and
          a signed sigma next to a signed percent is the same fact twice. */}
      <Typography
        sx={{
          fontSize: 12,
          ...numericFont,
          color:
            sigmas !== null && sigmas >= SIGMA_UNUSUAL
              ? 'signal.main'
              : 'text.secondary',
          opacity: sigmas !== null && sigmas >= SIGMA_UNUSUAL ? 1 : 0.8,
        }}
      >
        {sigmas === null ? '' : formatSigmas(sigmas, t)}
      </Typography>

      {position !== null ? (
        <Tooltip title={t.timeframe.position(Math.round(position * 100))} arrow>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PositionTrack position={position} width={TRACK_WIDTH} />
          </Box>
        </Tooltip>
      ) : (
        <Box />
      )}

      <Stack
        direction="row"
        sx={{ gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}
      >
        {signals.map((signal) => (
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
    </>
  )
}

/**
 * The same instrument at five horizons, one rung each, shortest at the top.
 *
 * The board answers what is happening now; this answers whether the horizons
 * agree about it, which is the question a chart gets opened for. Four rows
 * pointing one way is a different event from one row pointing and three not,
 * and no single-horizon reading can tell them apart.
 *
 * The month is the last rung rather than a panel of its own. It asks the same
 * question in the same shape — what the price did over a stretch, and where in
 * that stretch's range it ended up — so a reader scanning the column goes from
 * fifteen minutes to thirty days without changing how they read it, and the two
 * range tracks that used to sit in different columns at different offsets can
 * finally be compared. The rule above it is there because it comes off a
 * different feed: daily stats rather than the bar fetch, which is also why it
 * is the one rung with no sigma — there is no 30-day baseline to measure it
 * against, and a cell left empty is better than a number borrowed from a
 * horizon that is not this one.
 *
 * Laid out rather than scored. The count in the heading is a count — it says how
 * many of the rungs moved the same way and nothing about how much that is worth
 * — because every row it counted is directly underneath it to be disagreed
 * with.
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
  const backdrop = useOkxBackdrop(instId)

  const month =
    backdrop.rangePosition !== null || backdrop.return30d !== null
      ? backdrop
      : null

  // The bar fetch failing takes the four periods with it, but not the month:
  // that one is off the daily stats and is still true.
  if (failed && !month) return null

  // The month counted with the rest: it is a rung of the same ladder now, and
  // the count is only honest while every row it covers is underneath it.
  const agreement = timeframeAgreement([
    ...reads.map((read) => read.returnPercent),
    month?.return30d ?? null,
  ])

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1, mb: 0.75 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {t.timeframe.title}
        </Typography>
        {agreement && (
          <Typography
            sx={{
              fontSize: 12,
              // Unanimity is the state worth looking up for, and it is the one
              // the count cannot make louder on its own — `4 of 4 up` and
              // `3 of 4 up` are a character apart. Weight rather than colour:
              // red and green are spoken for, and an agreeing ladder is not an
              // anomaly, which is what the amber would claim.
              fontWeight:
                !agreement.split && agreement.agreed === agreement.of
                  ? 500
                  : 400,
              color:
                !agreement.split && agreement.agreed === agreement.of
                  ? 'text.primary'
                  : 'text.secondary',
            }}
          >
            {agreement.split
              ? t.timeframe.split(agreement.of)
              : t.timeframe.agreement(
                  agreement.agreed,
                  agreement.of,
                  agreement.up,
                )}
          </Typography>
        )}
      </Stack>

      {reads.length || month ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: LADDER_COLUMNS,
            alignItems: 'center',
            columnGap: 1,
            rowGap: 0.75,
          }}
        >
          {reads.map((read) => (
            <LadderRow
              key={read.period}
              label={periodLabelOf(read.period)}
              move={read.returnPercent}
              deviation={read.deviation}
              position={read.position}
              signals={read.signals}
            />
          ))}

          {month && (
            <>
              {reads.length > 0 && (
                <Box
                  sx={{
                    gridColumn: '1 / -1',
                    height: '1px',
                    backgroundColor: 'surface.border',
                    my: 0.25,
                  }}
                />
              )}
              <LadderRow
                label={MONTH_LABEL}
                move={month.return30d}
                deviation={null}
                position={month.rangePosition}
                signals={month.readings.filter(isMonthRungReading)}
              />
              {/* Under the track it belongs to rather than beside it: half of a
                  range is only worth saying if the range is said too, and the
                  rung has no room left to say it on one line. */}
              {month.rangePosition !== null && (
                <Typography
                  sx={{
                    gridColumn: '4 / -1',
                    fontSize: 11,
                    color: 'text.secondary',
                    opacity: 0.8,
                    mt: -0.25,
                    ...numericFont,
                  }}
                >
                  {rangePositionLabel(month.rangePosition, t)}
                  {month.range &&
                    ` · ${formatNumber(month.range.low, 6)} – ${formatNumber(month.range.high, 6)}`}
                </Typography>
              )}
            </>
          )}
        </Box>
      ) : (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', py: 1 }}>
          {loading ? t.timeframe.loading : t.detail.empty}
        </Typography>
      )}
    </Box>
  )
}
