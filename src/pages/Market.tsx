import { Typography, Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { FullTicker } from '../types'
import { compactNumberFormatter } from '../utils'

export default function Market() {
  const [tickers, setTickers] = useState<FullTicker[]>([])

  useEffect(() => {
    const socket = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr')

    socket.onopen = () => {
      console.log('socket open')
    }

    socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.ping) {
          socket.send(JSON.stringify({ pong: Date.now() }))
        } else if (data.length) {
          setTickers((prevTickers) => {
            const updatedTickers: FullTicker[] = []
            const existingTickers = prevTickers.reduce((acc, cur) => {
              acc[cur.s] = cur
              return acc
            }, {} as Record<string, FullTicker>)
            data
              .filter((d: FullTicker) => /USDT$/.test(d.s))
              .forEach((d: FullTicker) => {
                if (existingTickers[d.s]) {
                  Object.assign(existingTickers[d.s], d)
                  updatedTickers.push(existingTickers[d.s])
                  delete existingTickers[d.s]
                } else {
                  updatedTickers.push(d)
                }
              })
            return [...updatedTickers, ...Object.values(existingTickers)].sort(
              (a, b) => +b.P - +a.P,
            )
          })
        }
      } catch (error) {
        // TODO
      }
    }

    return () => {
      socket.close()
    }
  }, [])

  return (
    <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {tickers.map((t) => (
        <Box
          key={t.s}
          sx={{ width: 200, border: 'dashed 1px #ccc', padding: '8px 0' }}
        >
          <Typography>{t.s}</Typography>
          <Typography>{+t.c}</Typography>
          <Typography>
            {+t.p}({+t.P}%)
          </Typography>
          <Typography>{compactNumberFormatter(+t.q)}</Typography>
        </Box>
      ))}
    </Box>
  )
}
