import { Stack, Typography } from '@mui/material'
import { memo } from 'react'

import { numericFont } from '../fonts'

/**
 * Monospace figures have a fixed advance width, so a long price would overflow
 * a 236px card at a single fixed size. The steps below keep the price plus the
 * trade size on one line down to the narrowest column the grid will produce.
 */
function priceFontSize(last: string) {
  if (last.length <= 7) return 32
  if (last.length <= 9) return 26
  return 22
}

function LastPrice({
  last,
  lastSz,
  up,
}: {
  last: string
  lastSz: string
  /**
   * The last tick's direction, not the 24h one: whether this print landed above
   * or below the previous one, which is as close to buy/sell pressure as the
   * OKX tickers channel gets — it carries no side. The 24h reading is on the
   * change percent, the card border and the range bar, so the two never have to
   * share this number.
   */
  up?: boolean
}) {
  return (
    <Stack
      direction="row"
      alignItems="baseline"
      justifyContent="space-between"
      gap={1}
      flexWrap="nowrap"
    >
      <Typography
        fontSize={priceFontSize(last)}
        fontWeight={600}
        lineHeight={1.15}
        color={up ? 'market.up' : 'market.down'}
        sx={{ ...numericFont, whiteSpace: 'nowrap' }}
      >
        {last}
      </Typography>
      <Typography
        fontSize={13}
        color="text.secondary"
        sx={{ ...numericFont, whiteSpace: 'nowrap' }}
      >
        {lastSz}
      </Typography>
    </Stack>
  )
}

export default memo(LastPrice)
