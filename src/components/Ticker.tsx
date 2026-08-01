import { Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { FullTicker } from '../types'
import { compactNumberFormatter } from '../utils'
import { numericFont } from '../fonts'

const Description = ({ label, value }: { label: string; value: string }) => {
  return (
    <Typography sx={{ fontSize: 18, color: 'text.secondary' }}>
      {label}:{' '}
      <Typography
        component="span"
        sx={{
          fontSize: 18,
          fontWeight: 500,
          color: 'text.primary',
          ...numericFont,
        }}
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
    m: boolean // is the buyer the maker, i.e. the taker sold into the bid
  }>()
  const [ticker, setTicker] = useState<FullTicker>()

  useEffect(() => {
    const socket = new WebSocket(
      `wss://fstream.binance.com/market/ws/${symbol.toLowerCase()}@aggTrade`,
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

  const up = Number(ticker?.p) > 0
  const changeColor = up ? 'market.up' : 'market.down'
  // aggTrade carries the side, so the price shows who took the trade: buyer
  // taking the ask is up, seller hitting the bid is down. The 24h reading sits
  // on the change line below, which is why the two are allowed to disagree.
  const tradeColor = !aggTrade
    ? 'text.primary'
    : aggTrade.m
      ? 'market.down'
      : 'market.up'

  return (
    <Stack
      direction="row"
      spacing={3}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}
    >
      <Stack spacing={1} sx={{ flex: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-end' }}>
          <Typography
            sx={{
              fontSize: 44,
              lineHeight: 1,
              fontWeight: 600,
              color: tradeColor,
              ...numericFont,
            }}
          >
            {aggTrade?.p ?? '-'}
          </Typography>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 500,
              lineHeight: 1.4,
              color: 'text.secondary',
              ...numericFont,
            }}
          >
            {aggTrade?.q ?? '-'}
          </Typography>
        </Stack>
        <Typography
          sx={{
            display: 'flex',
            gap: '16px',
            fontSize: 20,
            fontWeight: 600,
            color: changeColor,
            ...numericFont,
          }}
        >
          <span>{up ? `+${ticker?.p}` : ticker?.p}</span>
          <span>{up ? `+${ticker?.P}` : ticker?.P}%</span>
        </Typography>
      </Stack>
      <Stack spacing={2} sx={{}}>
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
    </Stack>
  )
}
