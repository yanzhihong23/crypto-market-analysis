import { Box, CircularProgress, Stack } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIntersectionObserver } from 'usehooks-ts'

import { FullTicker } from '../types'
import BinanceTickerCard from '../components/BinanceTickerCard'
import BinanceTickerActionBar from '../components/BinanceTickerActionBar'
import { useBinanceTickerStore } from '../store/useBinanceTickerStore'
import { SortBy } from '../types/binance'
import useBinanceSymbolUpdater from '../hooks/useBinanceSymbolUpdater'
import useBinanceRatioUpdater from '../hooks/useBinanceRatioUpdater'

export default function Market() {
  const [count, setCount] = useState(20)
  const [tickers, setTickers] = useState<FullTicker[]>([])
  const sortBy = useBinanceTickerStore((state) => state.sortBy)
  const showTickers = useMemo(() => {
    return tickers
      .sort((a, b) => {
        if (sortBy === SortBy.PERCENT) {
          return +b.P - +a.P
        }

        return +b.q - +a.q
      })
      .slice(0, count)
  }, [tickers, count, sortBy])

  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  })

  useBinanceSymbolUpdater()
  useBinanceRatioUpdater()

  const loadMore = useCallback(() => {
    console.log('load more')
    setCount((prevCount) => prevCount + 20)
  }, [])

  useEffect(() => {
    console.log('isIntersecting', isIntersecting)
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    if (isIntersecting) {
      loadMore()
      timeoutId = setTimeout(loadMore, 1000)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isIntersecting, loadMore])

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
            return [...updatedTickers, ...Object.values(existingTickers)]
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
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
      }}
    >
      {showTickers.map((t) => (
        <BinanceTickerCard key={t.s} t={t} />
      ))}

      {showTickers.length < tickers.length && (
        <Stack
          sx={{ width: '100%', p: 2 }}
          direction="row"
          alignItems="center"
          justifyContent="center"
        >
          <CircularProgress size="24px" ref={ref} />
        </Stack>
      )}

      <BinanceTickerActionBar />
    </Box>
  )
}
