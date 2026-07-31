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
   * 24h direction, matching the change percent and the card border. This used
   * to be the last tick's direction, so a coin down 1.48% on the day rendered
   * its price in green.
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
