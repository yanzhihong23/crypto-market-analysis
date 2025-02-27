import { Box, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { FullTicker } from '../types'
import { compactNumberFormatter } from '../utils'

const Description = ({ label, value }: { label: string; value: string }) => {
  return (
    <Typography fontSize={20} color="text.secondary">
      {label}:{' '}
      <Typography
        fontSize={20}
        fontWeight={500}
        component="span"
        color="text.primary"
      >
        {value}
      </Typography>
    </Typography>
  )
}

export default function Ticker({ symbol }: { symbol: string }) {
  const [aggTrade, setAggTrade] = useState<{
    e: string // event type
    E: string // event time
    s: string // symbol
    p: string // price
    q: string // quantity
    m: string // market maker?
  }>()
  const [ticker, setTicker] = useState<FullTicker>()

  useEffect(() => {
    const socket = new WebSocket(
      `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@aggTrade`,
    )
    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: [`${symbol.toLowerCase()}@ticker`],
          id: Math.floor(Math.random() * 10000),
        }),
      )
    }
    const onMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.ping) {
          socket.send(JSON.stringify({ pong: Date.now() }))
        } else if (data.e === 'aggTrade') {
          setAggTrade(data)
        } else if (data.e === '24hrTicker') {
          setTicker(data)
        }
      } catch (error) {
        // TODO
        console.error(error)
      }
    }

    socket.addEventListener('message', onMessage)

    return () => {
      socket.removeEventListener('message', onMessage)
      socket.close()
    }
  }, [symbol])

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
      }}
    >
      <Stack spacing={1}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <Typography
            fontSize={48}
            lineHeight={1}
            fontWeight={600}
            color={!aggTrade?.m ? 'success' : 'error'}
          >
            {aggTrade?.p ?? '-'}
          </Typography>
          <Typography
            fontSize={20}
            fontWeight={500}
            lineHeight={1.4}
            color="text.secondary"
          >
            {aggTrade?.q ?? '-'}
          </Typography>
        </Box>
        <Typography
          sx={{ display: 'flex', gap: '16px' }}
          fontSize={22}
          fontWeight={600}
          color={Number(ticker?.p) > 0 ? 'success' : 'error'}
        >
          <span>{Number(ticker?.p) > 0 ? `+${ticker?.p}` : ticker?.p}</span>
          <span>{Number(ticker?.p) > 0 ? `+${ticker?.P}` : ticker?.P}%</span>
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Description label="24h High" value={ticker?.h ?? '-'} />
        <Description label="24h Low" value={ticker?.l ?? '-'} />
      </Stack>
      <Stack spacing={2}>
        <Description
          label={`Volume(${aggTrade?.s.split('USDT')[0]})`}
          value={compactNumberFormatter(Number(ticker?.v))}
        />
        <Description
          label="Volume(USDT)"
          value={compactNumberFormatter(Number(ticker?.q))}
        />
      </Stack>
    </Box>
  )
}
