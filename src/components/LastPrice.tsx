import { Typography } from '@mui/material'
import { memo } from 'react'

import { numericFont } from '../fonts'

/**
 * Monospace figures have a fixed advance width, so a long price would overflow
 * a 236px card at a single fixed size. Step the size down by length instead.
 */
function priceFontSize(last: string) {
  if (last.length <= 7) return 34
  if (last.length <= 9) return 28
  return 24
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
    <Typography
      fontSize={priceFontSize(last)}
      fontWeight={500}
      lineHeight={1.15}
      color={up ? 'market.up' : 'market.down'}
      sx={numericFont}
    >
      {last}{' '}
      <Typography
        fontSize={14}
        fontWeight={400}
        component="span"
        color="text.secondary"
        sx={numericFont}
      >
        {lastSz}
      </Typography>
    </Typography>
  )
}

export default memo(LastPrice)
