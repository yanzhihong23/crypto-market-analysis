import { Typography } from '@mui/material'
import { Stack } from '@mui/material'
import { memo, useMemo } from 'react'

import SymbolAvatar from './SymbolAvatar'

function OkxLogoSymbol({ instId }: { instId: string }) {
  const symbol = useMemo(() => instId.split('-')[0], [instId])

  return (
    <Stack direction="row" alignItems="center" gap={1} zIndex={2}>
      <SymbolAvatar instId={instId} />
      <Typography fontSize={17} fontWeight={600} letterSpacing={0.2}>
        {symbol}
      </Typography>
    </Stack>
  )
}

export default memo(OkxLogoSymbol)
