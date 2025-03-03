import { Typography } from '@mui/material'
import { memo, useMemo } from 'react'

function LastPrice({
  last,
  lastSz,
  isUp,
}: {
  last: string
  lastSz: string
  isUp?: boolean
}) {
  const shadowStyle = useMemo(
    () => ({
      textShadow: isUp
        ? `0 0 2px rgba(37, 167, 80, 0.3),
       1px 1px 2px rgba(37, 167, 80, 0.2),
       -1px -1px 2px rgba(255, 255, 255, 0.1)`
        : `0 0 2px rgba(202, 63, 100, 0.3),
       1px 1px 2px rgba(202, 63, 100, 0.2),
       -1px -1px 2px rgba(255, 255, 255, 0.1)`,
    }),
    [isUp],
  )

  return (
    <Typography
      fontSize={36}
      fontWeight={600}
      color={isUp ? 'success' : 'error'}
      sx={shadowStyle}
    >
      {last}{' '}
      <Typography
        fontSize={16}
        fontWeight={500}
        component="span"
        color="text.secondary"
        sx={{ textShadow: 'none' }}
      >
        {lastSz}
      </Typography>
    </Typography>
  )
}

export default memo(LastPrice)
