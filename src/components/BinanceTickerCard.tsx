import { Avatar, Chip, Stack, Tooltip, Typography } from '@mui/material'

import { FullTicker } from '../types'
import { compactNumberFormatter } from '../utils'

import TickerContainer from './TickerContainer'

export default function BinanceTickerCard({ t }: { t: FullTicker }) {
  return (
    <TickerContainer up={+t.p > 0} width={300} borderWidth={2}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Avatar
          src={`/logos/${t.s}.png`}
          sx={{ width: 32, height: 32 }}
          alt={t.s.charAt(0)}
        >
          {t.s.charAt(0)}
        </Avatar>
        <Typography fontSize={20} fontWeight={500}>
          {t.s.replace('USDT', '')}
        </Typography>
        <Typography
          flex={1}
          fontSize={22}
          fontWeight={600}
          color={+t.p > 0 ? 'success' : 'error'}
          align="right"
        >
          {+t.P > 0 ? `+${+t.P}` : +t.P}%
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="end" justifyContent="space-between">
        <Typography
          fontSize={36}
          fontWeight={600}
          lineHeight={1}
          color={+t.p > 0 ? 'success' : 'error'}
        >
          {+t.c}{' '}
          <Typography
            fontSize={16}
            fontWeight={500}
            color="text.secondary"
            component="span"
          >
            {compactNumberFormatter(+t.Q)}
          </Typography>
        </Typography>
      </Stack>

      <Typography>
        {+t.l} -{' '}
        <Typography color="secondary" fontWeight={600} component="span">
          {+t.w}
        </Typography>{' '}
        - {+t.h}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ zIndex: 2 }}
      >
        <Tooltip title="Quote Volume" arrow>
          <Chip
            size="small"
            color="primary"
            label={compactNumberFormatter(+t.q)}
          />
        </Tooltip>
        <Typography
          fontSize={18}
          fontWeight="bold"
          color={+t.p > 0 ? 'success' : 'error'}
        >
          {+t.p > 0 ? `+${+t.p}` : +t.p}
        </Typography>
      </Stack>
    </TickerContainer>
  )
}
