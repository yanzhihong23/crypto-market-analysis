import { Chip, Stack, Tooltip, Typography } from '@mui/material'

import { FullTicker } from '../types'
import { compactNumberFormatter, formatNumber } from '../utils'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'
import { numericFont } from '../fonts'
import { describeDeviation, isAnomalous } from '../utils/signals'
import { useMessages } from '../i18n'

import BinanceSymbolAvatar from './BinanceSymbolAvatar'
import TickerContainer from './TickerContainer'
import PriceRange from './PriceRange'
import { metricChipSx, signalChipSx } from './metricChipSx'

// `t` is the ticker on this card, so the dictionary goes by another name here.
export default function BinanceTickerCard({ t }: { t: FullTicker }) {
  const ratio = useBinanceTickerStore((state) => state.ratio[t.s]?.value)
  const ratioDeviation = useBinanceTickerStore(
    (state) => state.ratio[t.s]?.deviation,
  )
  const copy = useMessages()
  const up = +t.p > 0
  const priceColor = up ? 'market.up' : 'market.down'
  // No funding rate on this feed, so the card never earns the flagged ring the
  // OKX card can — the ratio chip is the whole signal here.
  const ratioUnusual = isAnomalous(ratioDeviation)
  const ratioTitle =
    ratioUnusual && ratioDeviation != null
      ? `${copy.binance.ratio} — ${describeDeviation(ratioDeviation, copy)}`
      : copy.binance.ratio

  return (
    <TickerContainer up={up} changePercent={+t.P}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, zIndex: 2 }}>
        <BinanceSymbolAvatar symbol={t.s} />
        <Typography sx={{ fontSize: 17, fontWeight: 600, letterSpacing: 0.2 }}>
          {t.s.replace('USDT', '')}
        </Typography>
        <Typography
          align="right"
          sx={{
            flex: 1,
            fontSize: 20,
            fontWeight: 600,
            color: priceColor,
            ...numericFont,
          }}
        >
          {+t.P > 0 ? `+${+t.P}` : +t.P}%
        </Typography>
      </Stack>
      <Stack
        direction="row"
        sx={{ alignItems: 'end', justifyContent: 'space-between' }}
      >
        <Typography
          sx={{
            fontSize: 34,
            fontWeight: 600,
            lineHeight: 1.15,
            color: priceColor,
            ...numericFont,
          }}
        >
          {+t.c}{' '}
          <Typography
            component="span"
            sx={{
              fontSize: 14,
              fontWeight: 400,
              color: 'text.secondary',
              ...numericFont,
            }}
          >
            {compactNumberFormatter(+t.Q)}
          </Typography>
        </Typography>
      </Stack>

      <PriceRange
        low={String(+t.l)}
        high={String(+t.h)}
        last={t.c}
        open={String(+t.o)}
        reference={String(+t.w)}
        up={up}
      />
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 2,
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
          <Tooltip title={copy.metrics.quoteVolume} arrow>
            <Chip
              size="small"
              aria-label={copy.metrics.quoteVolumeAria}
              sx={metricChipSx}
              label={compactNumberFormatter(+t.q)}
            />
          </Tooltip>
          {!!ratio && (
            <Tooltip title={ratioTitle} arrow>
              <Chip
                size="small"
                aria-label={copy.metrics.ratioAria}
                sx={ratioUnusual ? signalChipSx : metricChipSx}
                label={formatNumber(Number(ratio), 2)}
              />
            </Tooltip>
          )}
        </Stack>

        <Typography sx={{ fontSize: 13, color: priceColor, ...numericFont }}>
          {+t.p > 0 ? `+${+t.p}` : +t.p}
        </Typography>
      </Stack>
    </TickerContainer>
  )
}
