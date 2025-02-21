import { Stack, Box } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { compactNumberFormatter } from '../utils'
import {
  OkxFundingRate,
  OkxOpenInterest,
  OkxTicker,
  OkxTickerFormatted,
  SortBy,
} from '../types/okx'
import { useTickerStore } from '../store/useTickerStore'
import OkxTickerCard from '../components/OkxTickerCard'
import useOkxKlineUpdater from '../hooks/useOkxKlineUpdater'
import useOkxTickerFormat from '../hooks/useOkxTickerFormat'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'
import ActionBar from '../components/ActionBar'

interface TickerResponse {
  arg: {
    channel: string
    instId: string
  }
  data: OkxTicker[] | OkxOpenInterest[] | OkxFundingRate[]
}

export default function OkxPerpetual() {
  const openTime = useTickerStore((state) => state.openTime)
  const sortBy = useTickerStore((state) => state.sortBy)
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
  const instIds = useTickerStore((state) => state.instIds)
  const { formatTicker } = useOkxTickerFormat()
  // update kline data
  useOkxKlineUpdater()
  // update ratio data
  useOkxRatioUpdater()

  const sortedTickers = useMemo(() => {
    return tickers.sort((a, b) => {
      if (sortBy === SortBy.VOLUME) return +b.volCcyQuote - +a.volCcyQuote
      if (sortBy === SortBy.PERCENT) return +b.percent - +a.percent
      if (sortBy === SortBy.RATIO) return +b.ratio - +a.ratio
      return tickers.indexOf(a) - tickers.indexOf(b)
    })
  }, [tickers, sortBy])

  useEffect(() => {
    setTickers(
      instIds.map((i) => ({
        instType: 'SWAP',
        instId: i,
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
        coin: i.split('-')[0],
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
      })),
    )
  }, [instIds])

  useEffect(() => {
    if (!instIds.length) return

    const connect = () => {
      const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public')
      let timer: ReturnType<typeof setTimeout>

      ws.onopen = () => {
        console.log('connected')
        setConnectCount((prev) => prev + 1)
        ws.send(
          JSON.stringify({
            op: 'subscribe',
            args: [
              ...instIds.map((i) => ({ channel: 'tickers', instId: i })),
              ...instIds.map((i) => ({ channel: 'open-interest', instId: i })),
              ...instIds.map((i) => ({ channel: 'funding-rate', instId: i })),
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
      }

      ws.onclose = () => {
        console.log('WebSocket closed, attempting to reconnect...')
        clearTimeout(timer)
        setTimeout(connect, 3000)
      }

      return ws
    }

    const ws = connect()

    return () => {
      ws.close()
    }
  }, [instIds])

  useEffect(() => {
    setTickers((prevTickers) => {
      return prevTickers.map((prevTicker) => {
        const rawData = rawTickers[prevTicker.instId]
        if (!rawData?.ticker) return prevTicker

        const formattedTicker = formatTicker({
          ticker: rawData.ticker,
          oldTicker: prevTicker,
          openTime,
        })
        if (rawData.openInterest) {
          formattedTicker.oiCcy = compactNumberFormatter(
            Number(rawData.openInterest.oiCcy),
          )
        }
        if (rawData.fundingRate) {
          formattedTicker.fundingRate = (
            +rawData.fundingRate.fundingRate * 10000
          ).toFixed(1)
        }

        return formattedTicker
      })
    })
  }, [rawTickers, openTime, formatTicker])

  useEffect(() => {
    console.log('connectCount', connectCount)
  }, [connectCount])

  return (
    <Box>
      <Stack direction="row" gap={2} flexWrap="wrap">
        {sortedTickers.map((t) => (
          <OkxTickerCard key={t.instId} t={t} />
        ))}
      </Stack>
      <ActionBar />
    </Box>
  )
}
