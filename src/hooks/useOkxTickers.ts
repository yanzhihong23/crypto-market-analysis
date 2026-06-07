import { useEffect, useRef, useCallback } from 'react'

import { OkxChannel, OkxFundingRate } from '../types/okx'
import { OkxOpenInterest } from '../types/okx'
import { OkxTicker } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import {
  getEmptyTicker,
  setOkxPercent,
  updateOkxTicker,
} from '../store/okxRealtimeTicker'

import useOkxTickerFormat from './useOkxTickerFormat'

interface TickerResponse {
  arg: {
    channel: OkxChannel
    instId: string
  }
  data: OkxTicker[] | OkxOpenInterest[] | OkxFundingRate[]
}

export const useOkxTickers = () => {
  const initialInstIds = useTickerStore.getState().instIds // read once
  const setFundingRate = useTickerStore((state) => state.setFundingRate)
  const { formatTicker } = useOkxTickerFormat()
  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const formatTickerRef = useRef(formatTicker)
  const setFundingRateRef = useRef(setFundingRate)

  formatTickerRef.current = formatTicker
  setFundingRateRef.current = setFundingRate

  const generateSubscribeArgsByInstId = (instId: string) => {
    return [
      { channel: OkxChannel.TICKERS, instId },
      { channel: OkxChannel.OPEN_INTEREST, instId },
      { channel: OkxChannel.FUNDING_RATE, instId },
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

    wsRef.current?.close()
    clearPingTimer()

    const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public')
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close()
        return
      }
      ws.send(
        JSON.stringify({
          op: 'subscribe',
          args: generateSubscribeArgsByInstIds(initialInstIds),
        }),
      )
    }

    ws.onmessage = ({ data }: { data: string }) => {
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
      } else if (res.arg.channel === OkxChannel.OPEN_INTEREST) {
        // do nothing
      } else if (res.arg.channel === OkxChannel.FUNDING_RATE) {
        const { fundingRate } = res.data[0] as OkxFundingRate
        setFundingRateRef.current(
          instId,
          (Number(fundingRate) * 10000).toFixed(1),
        )
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      clearPingTimer()
      ws.close()
    }

    ws.onclose = () => {
      clearPingTimer()
      if (wsRef.current === ws) {
        wsRef.current = null
      }
      if (mountedRef.current) {
        clearReconnectTimer()
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null
          connectRef.current()
        }, 3000)
      }
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
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [initialInstIds.length])

  return {
    add,
    remove,
  }
}
