import { Chip, Stack, Tooltip } from '@mui/material'
import { memo } from 'react'

import {
  useFundingBaseline,
  useFundingRate,
  useFundingTime,
  useOpenInterestOpen,
  useRatio,
  useVolCcyQuote,
} from '../hooks/useTickerField'
import { useOkxOpenInterest, useOkxPercent } from '../hooks/useOkxOpenInterest'
import useMinute from '../hooks/useMinute'
import { compactNumberFormatter } from '../utils'
import { formatCountdown, isImminent, msUntilFunding } from '../utils/funding'
import { describeFlow, flowRead } from '../utils/openInterest'
import { describeDeviation, deviationFrom, isAnomalous } from '../utils/signals'

import { metricChipSx, signalChipSx } from './metricChipSx'

/** Placeholder for a metric the feed has not sent yet. */
const MISSING = '-'

function OkxMarketMetrics({ instId }: { instId: string }) {
  const volCcyQuote = useVolCcyQuote(instId)
  const ratio = useRatio(instId)
  const fundingRate = useFundingRate(instId)
  const fundingBaseline = useFundingBaseline(instId)
  const fundingTime = useFundingTime(instId)
  const openInterest = useOkxOpenInterest(instId)
  const openInterestOpen = useOpenInterestOpen(instId)
  const pricePercent = useOkxPercent(instId)

  // Each of these arrives on its own channel, so a card can hold two real
  // values and one gap. Formatting an absent value used to print NaN and
  // "undefined‱" straight onto the card.
  const volumeLabel = Number.isFinite(Number(volCcyQuote))
    ? compactNumberFormatter(Number(volCcyQuote))
    : MISSING
  // The only one of the three that needs saying: a compact volume carries its
  // own suffix and the funding rate its own unit, but a bare 2.1 between them
  // meant nothing until you hovered it.
  const ratioLabel = `L/S ${ratio?.value ?? MISSING}`

  // Recomputed on the minute rather than on every message, so the countdown is
  // the only thing on the card that moves when nothing has traded.
  useMinute()
  const untilFunding = msUntilFunding(fundingTime)
  const fundingRateLabel = Number.isFinite(Number(fundingRate))
    ? `${+fundingRate > 0 ? '+' : ''}${fundingRate}‱`
    : MISSING
  // The countdown joins the chip only once the settlement is close. Carrying it
  // all day would put eight hours of nothing-yet next to every rate on the
  // board; the last half hour is when it decides anything.
  const fundingLabel =
    untilFunding !== null && isImminent(untilFunding)
      ? `${fundingRateLabel} ${formatCountdown(untilFunding)}`
      : fundingRateLabel

  // Open interest is only worth a card slot as a change: the level says how big
  // the instrument is, the change over the session says whether the price move
  // is new money arriving or old positions leaving. The two halves come from
  // different places — live off the socket, the open off a poll — so the chip
  // waits for both.
  const live = Number(openInterest)
  const open = Number(openInterestOpen?.value)
  const oiPercent =
    Number.isFinite(live) && open > 0 ? ((live - open) / open) * 100 : null
  const oiLabel =
    oiPercent === null
      ? `OI ${MISSING}`
      : `OI ${oiPercent > 0 ? '+' : ''}${oiPercent.toFixed(1)}%`
  const flow = oiPercent === null ? null : flowRead(pricePercent, oiPercent)
  const oiTitle = flow
    ? `Open Interest — ${describeFlow(flow)}`
    : 'Open Interest'

  // The ratio arrives with its own history, so its deviation is computed where
  // it is fetched. The funding rate does not: the live one comes off the
  // websocket and is measured here against the polled history.
  const ratioDeviation = ratio?.deviation
  const fundingDeviation = deviationFrom(Number(fundingRate), fundingBaseline)
  const ratioUnusual = isAnomalous(ratioDeviation)
  const fundingUnusual = isAnomalous(fundingDeviation)
  const ratioTitle =
    ratioUnusual && ratioDeviation != null
      ? `L/S Ratio — ${describeDeviation(ratioDeviation)}`
      : 'L/S Ratio'
  // The chip only shows the countdown near the settlement; the tooltip carries
  // it whenever the feed knows one, which is where you look to find out how
  // long a rate has to be held through before it costs anything.
  const fundingTitle = [
    fundingUnusual && fundingDeviation != null
      ? `Funding Rate — ${describeDeviation(fundingDeviation)}`
      : 'Funding Rate',
    untilFunding !== null
      ? `settles in ${formatCountdown(untilFunding)}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    // Four chips overflow a card at its narrowest, so the row wraps rather than
    // clipping the last one; at the widths most of the grid runs at it stays a
    // single line.
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      gap={0.75}
      sx={{ zIndex: 2 }}
    >
      <Tooltip title="Quote Volume" arrow>
        <Chip
          size="small"
          aria-label="Quote volume"
          sx={metricChipSx}
          label={volumeLabel}
        />
      </Tooltip>
      <Tooltip title={ratioTitle} arrow>
        <Chip
          size="small"
          aria-label="Long/short ratio"
          sx={ratioUnusual ? signalChipSx : metricChipSx}
          label={ratioLabel}
        />
      </Tooltip>
      <Tooltip title={fundingTitle} arrow>
        <Chip
          size="small"
          aria-label="Funding rate"
          sx={fundingUnusual ? signalChipSx : metricChipSx}
          label={fundingLabel}
        />
      </Tooltip>
      <Tooltip title={oiTitle} arrow>
        <Chip
          size="small"
          aria-label="Open interest change"
          sx={metricChipSx}
          label={oiLabel}
        />
      </Tooltip>
    </Stack>
  )
}

export default memo(OkxMarketMetrics)
