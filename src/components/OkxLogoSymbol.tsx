import { Typography } from '@mui/material'
import { Stack } from '@mui/material'
import { memo, useMemo } from 'react'

function OkxLogoSymbol({ instId }: { instId: string }) {
  const symbol = useMemo(() => instId.split('-')[1], [instId])
  const logo = useMemo(
    () =>
      `https://static.okx.com/cdn/oksupport/asset/currency/icon/${symbol.toLowerCase()}.png?x-oss-process=image/format,webp`,
    [symbol],
  )

  return (
    <Stack direction="row" alignItems="center" gap={1} zIndex={2}>
      <img src={logo} width={32} />
      <Typography fontSize={20} fontWeight={700}>
        {symbol}
      </Typography>
    </Stack>
  )
}

export default memo(OkxLogoSymbol)
