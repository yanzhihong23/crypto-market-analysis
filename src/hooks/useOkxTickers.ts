import { useEffect, useState, useRef, useCallback } from 'react'

import { OkxChannel, OkxFundingRate, OkxTickerFormatted } from '../types/okx'
import { OkxOpenInterest } from '../types/okx'
import { OkxTicker } from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import { useOkxRealtimeTickerStore } from '../store/useOkxRealtimeTickerStore'

import useOkxTickerFormat from './useOkxTickerFormat'

interface TickerResponse {
  arg: {
    channel: OkxChannel
    instId: string
  }
  data: OkxTicker[] | OkxOpenInterest[] | OkxFundingRate[]
}

const getEmptyTicker = (instId: string): OkxTickerFormatted => {
  return {
    instType: 'SWAP',
    instId,
    last: '',
    lastSz: '',
    askPx: '',
    askSz: '',
    bidPx: '',
    bidSz: '',
    open24h: '',
    high24h: '',
    low24h: '',
    volCcy24h: '',
    vol24h: '',
    sodUtc0: '',
    sodUtc8: '',
    ts: '',
    coin: instId.split('-')[0],
    logo: undefined,
    dif: '',
    percent: '',
    vol: '',
    color: '',
  }
}

export const useOkxTickers = () => {
  const initialInstIds = useTickerStore.getState().instIds // read once
  const setFundingRate = useTickerStore((state) => state.setFundingRate)
  const updateTicker = useOkxRealtimeTickerStore((state) => state.updateTicker)
  const setPercent = useOkxRealtimeTickerStore((state) => state.setPercent)
  const { formatTicker } = useOkxTickerFormat()
  const [connectCount, setConnectCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const [newTicker, setNewTicker] = useState<OkxTicker | null>(null)

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

  const connect = () => {
    const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public')
    wsRef.current = ws
    let timer: ReturnType<typeof setTimeout>

    ws.onopen = () => {
      console.log('connected')
      setConnectCount((prev) => prev + 1)
      ws.send(
        JSON.stringify({
          op: 'subscribe',
          args: generateSubscribeArgsByInstIds(initialInstIds),
        }),
      )
    }

    ws.onmessage = ({ data }: { data: string }) => {
      if (timer) {
        clearTimeout(timer)
      }

      timer = setTimeout(() => {
        ws.send('ping')
      }, 20000)

      if (data === 'pong') return
      const res = JSON.parse(data) as TickerResponse
      if (!res.data) return

      const instId = res.arg.instId

      if (res.arg.channel === OkxChannel.TICKERS) {
        const data = res.data[0] as OkxTicker
        // Formatting the ticker here would cause a closure issue, openTime is not updated
        setNewTicker(data)
      } else if (res.arg.channel === OkxChannel.OPEN_INTEREST) {
        // do nothing
      } else if (res.arg.channel === OkxChannel.FUNDING_RATE) {
        const { fundingRate } = res.data[0] as OkxFundingRate
        setFundingRate(instId, (Number(fundingRate) * 10000).toFixed(1))
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      clearTimeout(timer)
      ws.close()
      setTimeout(connect, 3000)
    }

    ws.onclose = () => {
      console.log('WebSocket closed, attempting to reconnect...')
      clearTimeout(timer)
      setTimeout(connect, 3000)
    }

    return ws
  }

  const ensureWebSocket = useCallback(() => {
    return new Promise<WebSocket>((resolve) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current)
        return
      }

      const checkAndResolve = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(checkAndResolve)
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
      updateTicker(instId, getEmptyTicker(instId))
      setPercent(instId, 0)
    })
  }, [initialInstIds, updateTicker, setPercent])

  useEffect(() => {
    if (!initialInstIds.length) return

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [])

  useEffect(() => {
    console.log('connectCount', connectCount)
  }, [connectCount])

  useEffect(() => {
    if (!newTicker) return

    updateTicker(newTicker.instId, formatTicker({ ticker: newTicker }))
  }, [newTicker, updateTicker, formatTicker])

  return {
    connectCount,
    add,
    remove,
  }
}
