import { Typography } from '@mui/material'
import { Stack } from '@mui/material'
import { memo, useMemo } from 'react'

function OkxLogoSymbol({ instId }: { instId: string }) {
  const symbol = useMemo(() => instId.split('-')[0], [instId])
  const logo = useMemo(
    () =>
      `https://static.okx.com/cdn/oksupport/asset/currency/icon/${symbol.toLowerCase()}.png?x-oss-process=image/format,webp`,
    [symbol],
  )

  return (
    <Stack direction="row" alignItems="center" gap={1} zIndex={2}>
      <img src={logo} width={24} height={24} alt="" loading="lazy" />
      <Typography fontSize={17} fontWeight={600} letterSpacing={0.2}>
        {symbol}
      </Typography>
    </Stack>
  )
}

export default memo(OkxLogoSymbol)
