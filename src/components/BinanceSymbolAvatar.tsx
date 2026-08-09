import { Avatar } from '@mui/material'
import { memo, useEffect, useState } from 'react'

import { binanceLogoCandidates } from '../utils/binanceLogo'

/**
 * Futures symbols often differ from the spot marketing logo filenames
 * (TradFi `B` suffix, 1000x contracts). Try candidates in order; Avatar
 * children show the initial when every path 404s.
 */
function BinanceSymbolAvatar({
  symbol,
  size = 24,
}: {
  symbol: string
  size?: number
}) {
  const candidates = binanceLogoCandidates(symbol)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [symbol])

  const src =
    index < candidates.length ? `/logos/${candidates[index]}.png` : undefined

  return (
    <Avatar
      src={src}
      alt=""
      slotProps={{
        img: {
          loading: 'lazy',
          onError: () => setIndex((i) => i + 1),
        },
      }}
      sx={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        fontWeight: 600,
      }}
    >
      {symbol.charAt(0)}
    </Avatar>
  )
}

export default memo(BinanceSymbolAvatar)
