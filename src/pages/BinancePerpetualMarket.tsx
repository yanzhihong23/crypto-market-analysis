import { Box } from '@mui/material'
import { useEffect, useState } from 'react'

import { FullTicker } from '../types'
import BinanceTickerCard from '../components/BinanceTickerCard'
import BinanceTickerActionBar from '../components/BinanceTickerActionBar'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'
import { SortBy } from '../types/binance'

export default function Market() {
  const [tickers, setTickers] = useState<FullTicker[]>([])
  const sortBy = useBinanceTickerStore((state) => state.sortBy)

  useEffect(() => {
    const socket = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr')

    socket.onopen = () => {
      console.log('socket open')
    }

    socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.ping) {
          console.log('ping', data)

          socket.send(JSON.stringify({ pong: Date.now() }))
        } else if (data.length) {
          setTickers((prevTickers) => {
            const updatedTickers: FullTicker[] = []
            const existingTickers = prevTickers.reduce(
              (acc, cur) => {
                acc[cur.s] = cur
                return acc
              },
              {} as Record<string, FullTicker>,
            )
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
              (a, b) => {
                if (sortBy === SortBy.PERCENT) {
                  return +b.P - +a.P
                }

                return +b.q - +a.q
              },
            )
          })
        }
      } catch (error) {
        // TODO
        console.log(error)
      }
    }

    return () => {
      socket.close()
    }
  }, [sortBy])

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
      }}
    >
      {tickers.map((t) => (
        <BinanceTickerCard key={t.s} t={t} />
      ))}

      <BinanceTickerActionBar />
    </Box>
  )
}
