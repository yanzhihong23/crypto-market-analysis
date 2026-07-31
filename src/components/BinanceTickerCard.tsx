import { Avatar, Chip, Stack, Tooltip, Typography } from '@mui/material'

import { FullTicker } from '../types'
import { compactNumberFormatter, formatNumber } from '../utils'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'
import { numericFont } from '../fonts'

import TickerContainer from './TickerContainer'
import PriceRange from './PriceRange'

// Same colour budget as the OKX card: red and green mean price direction only.
const chipSx = {
  ...numericFont,
  backgroundColor: 'grey.100',
  color: 'grey.600',
}

export default function BinanceTickerCard({ t }: { t: FullTicker }) {
  const ratio = useBinanceTickerStore((state) => state.ratio[t.s]?.value)
  const up = +t.p > 0
  const priceColor = up ? 'market.up' : 'market.down'

  return (
    <TickerContainer up={up} changePercent={+t.P} borderWidth={3}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ zIndex: 2 }}>
        <Avatar
          src={`/logos/${t.s}.png`}
          sx={{ width: 24, height: 24, fontSize: 12 }}
          alt=""
        >
          {t.s.charAt(0)}
        </Avatar>
        <Typography fontSize={17} fontWeight={600} letterSpacing={0.2}>
          {t.s.replace('USDT', '')}
        </Typography>
        <Typography
          flex={1}
          fontSize={20}
          fontWeight={600}
          color={priceColor}
          align="right"
          sx={numericFont}
        >
          {+t.P > 0 ? `+${+t.P}` : +t.P}%
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="end" justifyContent="space-between">
        <Typography
          fontSize={34}
          fontWeight={600}
          lineHeight={1.15}
          color={priceColor}
          sx={numericFont}
        >
          {+t.c}{' '}
          <Typography
            fontSize={14}
            fontWeight={400}
            color="text.secondary"
            component="span"
            sx={numericFont}
          >
            {compactNumberFormatter(+t.Q)}
          </Typography>
        </Typography>
      </Stack>

      <PriceRange
        low={String(+t.l)}
        high={String(+t.h)}
        last={t.c}
        reference={String(+t.w)}
        up={up}
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ zIndex: 2 }}
      >
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Tooltip title="Quote Volume" arrow>
            <Chip
              size="small"
              aria-label="Quote volume"
              sx={chipSx}
              label={compactNumberFormatter(+t.q)}
            />
          </Tooltip>
          {!!ratio && (
            <Tooltip title="Long/Short Ratio" arrow>
              <Chip
                size="small"
                aria-label="Long/short ratio"
                sx={chipSx}
                label={formatNumber(Number(ratio), 2)}
              />
            </Tooltip>
          )}
        </Stack>

        <Typography fontSize={13} color={priceColor} sx={numericFont}>
          {+t.p > 0 ? `+${+t.p}` : +t.p}
        </Typography>
      </Stack>
    </TickerContainer>
  )
}
