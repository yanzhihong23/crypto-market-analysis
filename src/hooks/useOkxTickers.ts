import { useEffect, useState, useRef } from 'react'

import { OkxFundingRate, OkxTickerFormatted } from '../types/okx'
import { OkxOpenInterest } from '../types/okx'
import { OkxTicker } from '../types/okx'
import { compactNumberFormatter } from '../utils'
import { useTickerStore } from '../store/useTickerStore'

import useOkxTickerFormat from './useOkxTickerFormat'

interface TickerResponse {
  arg: {
    channel: string
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
    priceColor: '',
    oiCcy: '',
    fundingRate: '',
    ratio: '-',
    volCcyQuote: '',
  }
}

export const useOkxTickers = () => {
  const initialInstIds = useTickerStore.getState().instIds // read once
  const openTime = useTickerStore((state) => state.openTime)
  const { formatTicker } = useOkxTickerFormat()
  const [connectCount, setConnectCount] = useState(0)
  const [tickers, setTickers] = useState<OkxTickerFormatted[]>([])
  const [rawTickers, setRawTickers] = useState<
    Record<
      string,
      {
        ticker?: OkxTicker
        openInterest?: OkxOpenInterest
        fundingRate?: OkxFundingRate
      }
    >
  >({})
  const wsRef = useRef<WebSocket | null>(null)

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
          args: [
            ...initialInstIds.map((i) => ({ channel: 'tickers', instId: i })),
            ...initialInstIds.map((i) => ({
              channel: 'open-interest',
              instId: i,
            })),
            ...initialInstIds.map((i) => ({
              channel: 'funding-rate',
              instId: i,
            })),
          ],
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

      const res = JSON.parse(data) as TickerResponse
      if (!res.data) return

      setRawTickers((prev) => {
        const instId = res.arg.instId
        const newData = { ...prev[instId] }

        if (res.arg.channel === 'tickers') {
          newData.ticker = res.data[0] as OkxTicker
        } else if (res.arg.channel === 'open-interest') {
          newData.openInterest = res.data[0] as OkxOpenInterest
        } else if (res.arg.channel === 'funding-rate') {
          newData.fundingRate = res.data[0] as OkxFundingRate
        }

        return {
          ...prev,
          [instId]: newData,
        }
      })
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

  const ensureWebSocket = () => {
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
  }

  const add = async (instId: string) => {
    setTickers((prev) => [...prev, getEmptyTicker(instId)])
    const ws = await ensureWebSocket()
    ws.send(
      JSON.stringify({
        op: 'subscribe',
        args: [
          { channel: 'tickers', instId },
          { channel: 'open-interest', instId },
          { channel: 'funding-rate', instId },
        ],
      }),
    )
  }

  const remove = async (instId: string) => {
    setTickers((prev) => prev.filter((t) => t.instId !== instId))
    const ws = await ensureWebSocket()
    ws.send(
      JSON.stringify({
        op: 'unsubscribe',
        args: [
          { channel: 'tickers', instId },
          { channel: 'open-interest', instId },
          { channel: 'funding-rate', instId },
        ],
      }),
    )
  }

  useEffect(() => {
    setTickers(initialInstIds.map(getEmptyTicker))
  }, [initialInstIds])

  useEffect(() => {
    if (!initialInstIds.length) return

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [])

  useEffect(() => {
    setTickers((prevTickers) => {
      return prevTickers.map((prevTicker) => {
        const rawData = rawTickers[prevTicker.instId]
        if (!rawData?.ticker) return prevTicker

        // 创建基础更新函数
        const updateExtraData = (ticker: OkxTickerFormatted) => {
          if (rawData.openInterest) {
            ticker.oiCcy = compactNumberFormatter(
              Number(rawData.openInterest.oiCcy),
            )
          }
          if (rawData.fundingRate) {
            ticker.fundingRate = (
              +rawData.fundingRate.fundingRate * 10000
            ).toFixed(1)
          }
          return ticker
        }

        // 如果价格没变，只更新额外数据
        if (rawData.ticker.last === prevTicker.last) {
          return updateExtraData({ ...prevTicker })
        }

        // 价格变化时，进行完整格式化并更新额外数据
        return updateExtraData(
          formatTicker({
            ticker: rawData.ticker,
            oldTicker: prevTicker,
            openTime,
          }),
        )
      })
    })
  }, [rawTickers, openTime, formatTicker])

  useEffect(() => {
    console.log('connectCount', connectCount)
  }, [connectCount])

  return {
    tickers,
    connectCount,
    add,
    remove,
  }
}
