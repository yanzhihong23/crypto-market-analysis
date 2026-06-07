import { throttle } from 'lodash'

import { OkxTickerFormatted } from '../types/okx'

type Listener = () => void

const tickers = new Map<string, OkxTickerFormatted>()
const percent = new Map<string, number>()
const tickerListeners = new Map<string, Set<Listener>>()
const percentListeners = new Map<string, Set<Listener>>()

const subscribeByInstId = (
  registry: Map<string, Set<Listener>>,
  instId: string,
  listener: Listener,
) => {
  let listeners = registry.get(instId)
  if (!listeners) {
    listeners = new Set()
    registry.set(instId, listeners)
  }
  listeners.add(listener)
  return () => {
    listeners?.delete(listener)
    if (listeners?.size === 0) {
      registry.delete(instId)
    }
  }
}

const notify = (registry: Map<string, Set<Listener>>, instId: string) => {
  registry.get(instId)?.forEach((listener) => listener())
}

export const getEmptyTicker = (instId: string): OkxTickerFormatted => ({
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
  dif: '',
  percent: '',
  vol: '',
  color: '',
})

export const subscribeOkxTicker = (instId: string, listener: Listener) =>
  subscribeByInstId(tickerListeners, instId, listener)

export const subscribeOkxPercent = (instId: string, listener: Listener) =>
  subscribeByInstId(percentListeners, instId, listener)

export const getOkxTickerSnapshot = (instId: string) => tickers.get(instId)

export const getOkxPercentSnapshot = (instId: string) =>
  percent.get(instId) ?? 0

export const setOkxPercent = (instId: string, value: number) => {
  percent.set(instId, value)
  notify(percentListeners, instId)
}

const throttledPercentUpdate = throttle((instId: string, value: number) => {
  setOkxPercent(instId, value)
}, 3000)

export const updateOkxTicker = (instId: string, ticker: OkxTickerFormatted) => {
  const lastTicker = tickers.get(instId)
  ticker.isUp = !lastTicker
    ? true
    : +ticker.last === +lastTicker.last
      ? lastTicker.isUp
      : +ticker.last > +lastTicker.last

  tickers.set(instId, ticker)
  notify(tickerListeners, instId)
  throttledPercentUpdate(instId, Number(ticker.percent))
}

export const removeOkxTicker = (instId: string) => {
  tickers.delete(instId)
  percent.delete(instId)
  notify(tickerListeners, instId)
  notify(percentListeners, instId)
}
