import { Avatar } from '@mui/material'
import { memo } from 'react'

import { okxLogoUrl } from '../utils'

/**
 * OKX does not host an icon for every base currency it lists, and a bare `img`
 * left a broken-image glyph wherever the CDN 404s. Avatar renders the initial
 * instead, so the row keeps its shape and still identifies the symbol.
 */
function SymbolAvatar({
  instId,
  size = 24,
}: {
  instId: string
  size?: number
}) {
  const symbol = instId.split('-')[0]

  return (
    <Avatar
      src={okxLogoUrl(instId)}
      alt=""
      slotProps={{ img: { loading: 'lazy' } }}
      sx={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        fontWeight: 600,
        bgcolor: 'surface.subtle',
        color: 'text.secondary',
      }}
    >
      {symbol.charAt(0)}
    </Avatar>
  )
}

export default memo(SymbolAvatar)
