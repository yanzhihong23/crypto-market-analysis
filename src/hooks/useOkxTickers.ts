import { useEffect, useRef, useCallback } from 'react'

import {
  OkxChannel,
  OkxFundingRate,
  OkxIndexTicker,
  OkxLiquidationOrder,
} from '../types/okx'
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
import { recordOkxSpread } from '../store/okxRealtimeSpread'
import { recordOkxLiquidation } from '../store/okxRealtimeLiquidation'
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
    /** Absent on the liquidation channel, which is subscribed for all swaps. */
    instId: string
  }
  data:
    | OkxTicker[]
    | OkxOpenInterest[]
    | OkxFundingRate[]
    | OkxIndexTicker[]
    | OkxLiquidationOrder[]
}

/**
 * The whole exchange's liquidations, on one subscription rather than one per
 * instrument — the channel offers no per-instrument form, and would not be worth
 * one anyway: a symbol can go a day without a single liquidation, and the
 * messages that matter arrive for everything at once.
 *
 * The cost of taking the whole exchange is a filter on the way in, which is the
 * next thing down.
 */
const LIQUIDATION_ARG = {
  channel: OkxChannel.LIQUIDATION_ORDERS,
  instType: 'SWAP',
}

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

export const useOkxTickers = () => {
  /**
   * Whether the board is watching anything at all, and nothing finer than that.
   * The socket used to be torn down and rebuilt whenever the *number* of
   * symbols changed, so adding or removing one dropped the whole feed and
   * resubscribed every other symbol on the board to arrive back where it was.
   */
  const watching = useTickerStore((state) => state.instIds.length > 0)
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
          // The liquidation feed rides along on the same socket and is not part
          // of the per-instrument set, so it is subscribed here and never
          // unsubscribed — adding or removing a symbol does not change what this
          // channel sends, only which of it we keep.
          args: [
            // Read off the store rather than closed over. Every socket that
            // opens — the first one and each reconnect after it — subscribes
            // the watchlist as it stands at that moment, which is what lets a
            // symbol added while the feed was down come back with the rest.
            ...generateSubscribeArgsByInstIds(
              useTickerStore.getState().instIds,
            ),
            LIQUIDATION_ARG,
          ],
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

      if (res.arg.channel === OkxChannel.LIQUIDATION_ORDERS) {
        // The only channel here whose instrument is in the payload rather than
        // on the arg, and the only one that arrives for symbols nobody is
        // watching: this is the whole exchange, so it is filtered down to the
        // board before anything is kept.
        const watched = new Set(useTickerStore.getState().instIds)
        for (const order of res.data as OkxLiquidationOrder[]) {
          // A row without an instrument is a back-reference. The exchange's
          // serialiser collapses a repeated object into `{"$ref": "$.data[0]"}`
          // — fifteen of the sixteen rows on a REST reply for one underlying
          // are that — and whatever it points at is another row of this same
          // message, which is already being counted. Skipping them is what
          // keeps a liquidation from being counted twice, not a gap.
          if (!order?.instId || !watched.has(order.instId)) continue
          for (const detail of order.details ?? []) {
            recordOkxLiquidation(
              order.instId,
              Number(detail.sz),
              detail.posSide === 'long',
              Number(detail.ts),
            )
          }
        }
        return
      }

      if (res.arg.channel === OkxChannel.TICKERS) {
        const ticker = res.data[0] as OkxTicker
        updateOkxTicker(ticker.instId, formatTickerRef.current({ ticker }))
        // The card only ever needed the newest price; a five-minute move needs
        // to know what it was five minutes ago, and this is the only place that
        // sees each one before it is overwritten.
        recordOkxPrice(ticker.instId, Number(ticker.last), Number(ticker.ts))
        // Best bid and best ask ride along on the same message and were being
        // thrown away with it. What the book charges to cross it is the one
        // reading here that describes the conditions rather than the event.
        recordOkxSpread(
          ticker.instId,
          Number(ticker.bidPx),
          Number(ticker.askPx),
          Number(ticker.ts),
        )
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

  /**
   * One symbol's channels, on the socket the board already holds.
   *
   * A no-op while that socket is down, rather than something to wait for: the
   * next one to open subscribes the whole watchlist off the store, which by
   * then is the watchlist this symbol has just joined or left. This used to
   * poll for an open socket and resolve only once it had one, which on a feed
   * that never came up left the promise pending forever — and the caller waits
   * on it before fetching the new symbol's ratio, funding and daily stats, so
   * a symbol added while the feed was down got none of them until a reload.
   */
  const sendSubscription = useCallback(
    (op: 'subscribe' | 'unsubscribe', instId: string) => {
      const ws = wsRef.current
      if (ws?.readyState !== WebSocket.OPEN) return
      ws.send(
        JSON.stringify({ op, args: generateSubscribeArgsByInstId(instId) }),
      )
    },
    [],
  )

  const add = useCallback(
    async (instId: string) => {
      sendSubscription('subscribe', instId)
    },
    [sendSubscription],
  )

  const remove = useCallback(
    async (instId: string) => {
      sendSubscription('unsubscribe', instId)
    },
    [sendSubscription],
  )

  // The placeholder every card is drawn from until its first message lands.
  // Mount only: this used to run again whenever the watchlist changed, so
  // adding or removing one symbol emptied the ticker held for every *other*
  // symbol and the whole board dropped back to skeletons until the feed refilled
  // it a moment later.
  useEffect(() => {
    useTickerStore.getState().instIds.forEach((instId) => {
      updateOkxTicker(instId, getEmptyTicker(instId))
      setOkxPercent(instId, 0)
    })
  }, [])

  // A board with nothing on it has nothing to listen for, and the liquidation
  // channel is the whole exchange — worth closing rather than filtering to an
  // empty watchlist. Anything short of emptying the board leaves the socket
  // alone; `add` and `remove` carry the difference over the one that is up.
  useEffect(() => {
    if (!watching) return

    mountedRef.current = true
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
  }, [watching])

  return {
    add,
    remove,
  }
}
