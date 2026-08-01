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
import {
  markFeedMessage,
  resetFeed,
  setFeedStatus,
} from '../store/useConnectionStore'

const RECONNECT_DELAY_MS = 3000

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
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const connect = () => {
      if (disposed) return

      const ws = new WebSocket(
        'wss://fstream.binance.com/market/ws/!ticker@arr',
      )
      socket = ws

      // A replaced socket keeps emitting events; acting on them would let a
      // dead connection schedule a reconnect over the live one.
      const isCurrent = () => socket === ws

      ws.onopen = () => {
        if (!isCurrent()) {
          ws.close()
          return
        }
        setFeedStatus('live')
      }

      ws.onclose = () => {
        if (!isCurrent() || disposed) return
        socket = null
        setFeedStatus('reconnecting')
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
      }

      ws.onmessage = handleMessage
    }

    const handleMessage = (event: MessageEvent) => {
      markFeedMessage()
      try {
        const data = JSON.parse(event.data)
        if (data.ping) {
          socket?.send(JSON.stringify({ pong: Date.now() }))
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

    setFeedStatus('connecting')
    connect()

    return () => {
      disposed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      // Detached before closing, so the outgoing socket fails its own identity
      // check and does not report a reconnect that will never be attempted.
      const ws = socket
      socket = null
      ws?.close()
      resetFeed()
    }
  }, [])

  return (
    <Box>
      <BinanceTickerActionBar />

      <Box
        sx={{
          display: 'grid',
          // space-evenly on a wrapping flex row left ragged gaps between fixed
          // width cards; the grid distributes the leftover width instead.
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 2,
        }}
      >
        {showTickers.map((t) => (
          <BinanceTickerCard key={t.s} t={t} />
        ))}
      </Box>

      {showTickers.length < tickers.length && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            p: 2,
          }}
        >
          <CircularProgress size="24px" ref={ref} />
        </Stack>
      )}
    </Box>
  )
}
