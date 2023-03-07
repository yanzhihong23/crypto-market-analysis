import { Box, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
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
  const [ticker, setTicker] = useState<{
    e: string // event type
    E: string // event time
    s: string // symbol
    p: string // 24h price change
    P: string // 24h price change percent
    w: string // weighted price
    c: string // current price
    Q: string // current price quantity
    o: string // 24h open price
    h: string // 24h high price
    l: string // 24h low price
    v: string // total trades base asset volume
    q: string // total trades quote asset volume
  }>()

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
      if (event.data === 'ping') {
        socket.send('pong')
      } else {
        try {
          const data = JSON.parse(event.data)
          if (data.e === 'aggTrade') {
            setAggTrade(data)
          } else if (data.e === '24hrTicker') {
            setTicker(data)
          }
        } catch (error) {
          // TODO
        }
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
            {Number(aggTrade?.p)}
          </Typography>
          <Typography fontSize={24} lineHeight={1.4} color="#999">
            {Number(aggTrade?.q)}
          </Typography>
        </Box>
        <Typography
          sx={{ display: 'flex', gap: '16px' }}
          fontSize={24}
          color={Number(ticker?.p) > 0 ? '#82ca9d' : '#E04A59'}
        >
          <span>{Number(ticker?.p)}</span> <span>{Number(ticker?.P)}%</span>
        </Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography fontSize={20}>High: {Number(ticker?.h)}</Typography>
        <Typography fontSize={20}>Low: {Number(ticker?.l)}</Typography>
      </Stack>
      <Stack spacing={2}>
        <Typography fontSize={20}>
          Volumn: {compactNumberFormatter(Number(ticker?.v))}
        </Typography>
        <Typography fontSize={20}>
          Quote: {compactNumberFormatter(Number(ticker?.q))}
        </Typography>
      </Stack>
    </Box>
  )
}
