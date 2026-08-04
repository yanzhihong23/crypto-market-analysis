import { Chip, Stack, Tooltip } from '@mui/material'
import { memo } from 'react'

import {
  useFundingRate,
  useFundingTime,
  useOpenInterestOpen,
  useRatio,
  useTakerFlow,
  useVolCcyQuote,
} from '../hooks/useTickerField'
import { useOkxOpenInterest, useOkxPercent } from '../hooks/useOkxOpenInterest'
import useMinute from '../hooks/useMinute'
import useOkxSignals from '../hooks/useOkxSignals'
import { formatCountdown, isImminent, msUntilFunding } from '../utils/funding'
import { describeFlow, flowRead } from '../utils/openInterest'
import { signalOf } from '../utils/detectors'
import { compactNumberFormatter } from '../utils'
import { useMessages } from '../i18n'

import { metricChipSx, signalChipSx } from './metricChipSx'

function OkxMarketMetrics({ instId }: { instId: string }) {
  const volCcyQuote = useVolCcyQuote(instId)
  const ratio = useRatio(instId)
  const takerFlow = useTakerFlow(instId)
  const fundingRate = useFundingRate(instId)
  const fundingTime = useFundingTime(instId)
  const openInterest = useOkxOpenInterest(instId)
  const openInterestOpen = useOpenInterestOpen(instId)
  const pricePercent = useOkxPercent(instId)
  const { signals } = useOkxSignals(instId)
  const t = useMessages()

  // Each of these arrives on its own channel, so a card can hold two real
  // values and one gap. Formatting an absent value used to print NaN and
  // "undefined‱" straight onto the card.
  const volumeLabel = Number.isFinite(Number(volCcyQuote))
    ? compactNumberFormatter(Number(volCcyQuote))
    : t.common.missing
  const ratioLabel = `${ratio?.value ?? t.common.missing}`

  // Recomputed on the minute rather than on every message, so the countdown is
  // the only thing on the card that moves when nothing has traded.
  useMinute()
  const untilFunding = msUntilFunding(fundingTime)
  const fundingRateLabel = Number.isFinite(Number(fundingRate))
    ? `${+fundingRate > 0 ? '+' : ''}${fundingRate}‱`
    : t.common.missing
  // The countdown joins the chip only once the settlement is close. Carrying it
  // all day would put eight hours of nothing-yet next to every rate on the
  // board; the last few minutes are when it decides anything.
  const fundingLabel =
    untilFunding !== null && isImminent(untilFunding)
      ? `${fundingRateLabel} ${formatCountdown(untilFunding, t)}`
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
  const oiLabel = t.metrics.openInterestChange(
    oiPercent === null
      ? t.common.missing
      : `${oiPercent > 0 ? '+' : ''}${oiPercent.toFixed(1)}%`,
  )
  const flow = oiPercent === null ? null : flowRead(pricePercent, oiPercent)

  // Which readings are out of range is decided in one place for the whole card,
  // so a chip and the ring around it can never tell different stories. Each chip
  // asks for its own and tints itself if it is there.
  const volumeSignal = signalOf(signals, 'volume')
  const takerSignal = signalOf(signals, 'taker')
  const ratioSignal = signalOf(signals, 'ratio')
  const divergenceSignal = signalOf(signals, 'divergence')
  const fundingSignal = signalOf(signals, 'funding')
  const fundingShiftSignal = signalOf(signals, 'funding-shift')
  const oiSignal = signalOf(signals, 'open-interest')
  const liquidationSignal = signalOf(signals, 'liquidation')

  const chipTitle = (name: string, ...parts: (string | null | undefined)[]) =>
    [name, ...parts].filter(Boolean).join(' — ')

  // Which side has been crossing the spread belongs to the volume chip rather
  // than to a fifth one: how much traded and who was doing it are one question,
  // and the chip already answers the first half. The signal's own sentence
  // carries the same share plus how unusual it is, so it stands in rather than
  // being added to.
  const takerLine =
    takerSignal?.detail ??
    (takerFlow
      ? t.metrics.takerFlow(
          `${Math.round(((1 + Math.abs(takerFlow.imbalance)) / 2) * 100)}%`,
          takerFlow.imbalance > 0,
        )
      : null)

  // Session volume on the chip, a surge inside the current bar in the tooltip:
  // the day's total is what the number is for, and a day's total barely moves
  // when fifteen minutes go mad.
  const volumeTitle = chipTitle(
    t.metrics.quoteVolume,
    volumeSignal?.detail,
    takerLine,
  )
  // Whether the biggest accounts agree with the crowd goes on the chip that
  // carries what the crowd holds: the ratio is the show of hands, and this is
  // the only thing that says whether the money is behind it.
  const ratioTitle = chipTitle(
    t.metrics.ratio,
    ratioSignal?.detail,
    divergenceSignal?.detail,
  )
  // The chip only shows the countdown near the settlement; the tooltip carries
  // it whenever the feed knows one, which is where you look to find out how
  // long a rate has to be held through before it costs anything.
  const fundingTitle = [
    chipTitle(
      t.metrics.funding,
      fundingSignal?.detail,
      fundingShiftSignal?.detail,
    ),
    untilFunding !== null
      ? t.metrics.settlesIn(formatCountdown(untilFunding, t))
      : null,
  ]
    .filter(Boolean)
    .join(' · ')
  // Two windows on one chip: the number is the change across the session, and
  // the five-minute reading underneath it is what says whether that change is
  // happening right now and whose positions are going.
  // The liquidation line goes last, under the quadrant read that has been
  // inferring it: that one says what the price and the open interest together
  // look like, and this one says what the exchange actually did. When both are
  // there they should agree, and when they do not the observed one is the one to
  // believe.
  const oiTitle = chipTitle(
    t.metrics.openInterest,
    flow ? describeFlow(flow, t) : null,
    oiSignal?.detail,
    liquidationSignal?.detail,
  )

  return (
    // Four chips overflow a card at its narrowest, so the row wraps rather than
    // clipping the last one; at the widths most of the grid runs at it stays a
    // single line.
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.75,
        zIndex: 2,
      }}
    >
      <Tooltip title={volumeTitle} arrow>
        <Chip
          size="small"
          aria-label={t.metrics.quoteVolumeAria}
          sx={volumeSignal || takerSignal ? signalChipSx : metricChipSx}
          label={volumeLabel}
        />
      </Tooltip>
      <Tooltip title={ratioTitle} arrow>
        <Chip
          size="small"
          aria-label={t.metrics.ratioAria}
          sx={ratioSignal || divergenceSignal ? signalChipSx : metricChipSx}
          label={ratioLabel}
        />
      </Tooltip>
      <Tooltip title={fundingTitle} arrow>
        <Chip
          size="small"
          aria-label={t.metrics.fundingAria}
          sx={fundingSignal || fundingShiftSignal ? signalChipSx : metricChipSx}
          label={fundingLabel}
        />
      </Tooltip>
      <Tooltip title={oiTitle} arrow>
        <Chip
          size="small"
          aria-label={t.metrics.openInterestAria}
          sx={oiSignal || liquidationSignal ? signalChipSx : metricChipSx}
          label={oiLabel}
        />
      </Tooltip>
    </Stack>
  )
}

export default memo(OkxMarketMetrics)
