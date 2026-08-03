import { useEffect, useRef, useCallback } from 'react'

import { OkxChannel, OkxFundingRate, OkxIndexTicker } from '../types/okx'
import { OkxOpenInterest } from '../types/okx'
import { OkxTicker } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import {
  getEmptyTicker,
  setOkxOpenInterest,
  setOkxPercent,
  updateOkxTicker,
} from '../store/okxRealtimeTicker'
import {
  indexInstIdOf,
  recordOkxOpenInterest,
  recordOkxPrice,
  setOkxIndexPrice,
} from '../store/okxRealtimeSeries'
import {
  markFeedMessage,
  resetFeed,
  setFeedStatus,
  useConnectionStore,
} from '../store/useConnectionStore'

import useOkxTickerFormat from './useOkxTickerFormat'

const RECONNECT_DELAY_MS = 3000

interface TickerResponse {
  arg: {
    channel: OkxChannel
    instId: string
  }
  data: OkxTicker[] | OkxOpenInterest[] | OkxFundingRate[] | OkxIndexTicker[]
}

export const useOkxTickers = () => {
  const initialInstIds = useTickerStore.getState().instIds // read once
  const setFunding = useTickerStore((state) => state.setFunding)
  const { formatTicker } = useOkxTickerFormat()
  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const formatTickerRef = useRef(formatTicker)
  const setFundingRef = useRef(setFunding)

  formatTickerRef.current = formatTicker
  setFundingRef.current = setFunding

  const generateSubscribeArgsByInstId = (instId: string) => {
    return [
      { channel: OkxChannel.TICKERS, instId },
      { channel: OkxChannel.OPEN_INTEREST, instId },
      { channel: OkxChannel.FUNDING_RATE, instId },
      // The contract's own price says nothing about what it is worth; the gap to
      // the index it settles against is the premium being paid for the leverage.
      { channel: OkxChannel.INDEX_TICKERS, instId: indexInstIdOf(instId) },
    ]
  }

  const generateSubscribeArgsByInstIds = (instIds: string[]) => {
    return instIds.map(generateSubscribeArgsByInstId).flat()
  }

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  const clearPingTimer = () => {
    if (pingTimerRef.current) {
      clearTimeout(pingTimerRef.current)
      pingTimerRef.current = null
    }
  }

  const connectRef = useRef<() => void>(() => {})

  connectRef.current = () => {
    if (!mountedRef.current) return

    // Detached before closing, so the outgoing socket already fails the
    // identity check by the time its close event arrives.
    const previous = wsRef.current
    wsRef.current = null
    previous?.close()
    clearPingTimer()

    setFeedStatus(
      useConnectionStore.getState().status === 'idle'
        ? 'connecting'
        : 'reconnecting',
    )

    const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public')
    wsRef.current = ws

    /**
     * A socket that has already been replaced must not touch shared state. Its
     * events keep arriving after the swap, and acting on them meant a dead
     * socket's close scheduled a reconnect that then tore down the healthy
     * socket which had replaced it, forever, every three seconds.
     */
    const isCurrent = () => wsRef.current === ws

    ws.onopen = () => {
      if (!mountedRef.current || !isCurrent()) {
        ws.close()
        return
      }
      setFeedStatus('live')
      ws.send(
        JSON.stringify({
          op: 'subscribe',
          args: generateSubscribeArgsByInstIds(initialInstIds),
        }),
      )
    }

    ws.onmessage = ({ data }: { data: string }) => {
      if (!isCurrent()) return
      markFeedMessage()
      clearPingTimer()
      pingTimerRef.current = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 20000)

      if (data === 'pong') return
      const res = JSON.parse(data) as TickerResponse
      if (!res.data) return

      const instId = res.arg.instId

      if (res.arg.channel === OkxChannel.TICKERS) {
        const ticker = res.data[0] as OkxTicker
        updateOkxTicker(ticker.instId, formatTickerRef.current({ ticker }))
        // The card only ever needed the newest price; a five-minute move needs
        // to know what it was five minutes ago, and this is the only place that
        // sees each one before it is overwritten.
        recordOkxPrice(ticker.instId, Number(ticker.last), Number(ticker.ts))
      } else if (res.arg.channel === OkxChannel.OPEN_INTEREST) {
        const { oi, ts } = res.data[0] as OkxOpenInterest
        setOkxOpenInterest(instId, oi)
        recordOkxOpenInterest(instId, Number(oi), Number(ts))
      } else if (res.arg.channel === OkxChannel.INDEX_TICKERS) {
        const { idxPx } = res.data[0] as OkxIndexTicker
        setOkxIndexPrice(instId, Number(idxPx))
      } else if (res.arg.channel === OkxChannel.FUNDING_RATE) {
        const { fundingRate, fundingTime } = res.data[0] as OkxFundingRate
        setFundingRef.current(
          instId,
          (Number(fundingRate) * 10000).toFixed(1),
          fundingTime,
        )
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (!isCurrent()) return
      clearPingTimer()
      ws.close()
    }

    ws.onclose = () => {
      if (!isCurrent()) return
      wsRef.current = null
      clearPingTimer()

      if (!mountedRef.current) return

      setFeedStatus('reconnecting')
      clearReconnectTimer()
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null
        connectRef.current()
      }, RECONNECT_DELAY_MS)
    }
  }

  const ensureWebSocket = useCallback(() => {
    return new Promise<WebSocket>((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current)
        return
      }

      const interval = setInterval(() => {
        if (!mountedRef.current) {
          clearInterval(interval)
          reject(new Error('Component unmounted'))
          return
        }
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(interval)
          resolve(wsRef.current)
        }
      }, 100)
    })
  }, [])

  const add = useCallback(
    async (instId: string) => {
      const ws = await ensureWebSocket()
      ws.send(
        JSON.stringify({
          op: 'subscribe',
          args: generateSubscribeArgsByInstId(instId),
        }),
      )
    },
    [ensureWebSocket],
  )

  const remove = useCallback(
    async (instId: string) => {
      const ws = await ensureWebSocket()
      ws.send(
        JSON.stringify({
          op: 'unsubscribe',
          args: generateSubscribeArgsByInstId(instId),
        }),
      )
    },
    [ensureWebSocket],
  )

  useEffect(() => {
    initialInstIds.forEach((instId) => {
      updateOkxTicker(instId, getEmptyTicker(instId))
      setOkxPercent(instId, 0)
    })
  }, [initialInstIds])

  useEffect(() => {
    mountedRef.current = true
    if (!initialInstIds.length) return

    connectRef.current()

    return () => {
      mountedRef.current = false
      clearReconnectTimer()
      clearPingTimer()
      const ws = wsRef.current
      wsRef.current = null
      ws?.close()
      resetFeed()
    }
  }, [initialInstIds.length])

  return {
    add,
    remove,
  }
}
