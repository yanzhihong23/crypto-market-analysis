import { Box, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { FullTicker } from '../types'
import { compactNumberFormatter } from '../utils'

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
            color={!aggTrade?.m ? '#82ca9d' : '#E04A59'}
          >
            {String(aggTrade?.p)}
          </Typography>
          <Typography fontSize={24} lineHeight={1.4} color="#aaa">
            {String(aggTrade?.q)}
          </Typography>
        </Box>
        <Typography
          sx={{ display: 'flex', gap: '16px' }}
          fontSize={24}
          color={Number(ticker?.p) > 0 ? '#82ca9d' : '#E04A59'}
        >
          <span>{Number(ticker?.p) > 0 ? `+${ticker?.p}` : ticker?.p}</span>
          <span>{Number(ticker?.p) > 0 ? `+${ticker?.P}` : ticker?.P}%</span>
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography fontSize={20}>High: {String(ticker?.h)}</Typography>
        <Typography fontSize={20}>Low: {String(ticker?.l)}</Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography fontSize={20}>
          Volume: {compactNumberFormatter(Number(ticker?.v))}
        </Typography>
        <Typography fontSize={20}>
          Quote: {compactNumberFormatter(Number(ticker?.q))}
        </Typography>
      </Stack>
    </Box>
  )
}
