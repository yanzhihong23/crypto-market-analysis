import { OkxTickerFormatted } from '../types/okx'

import { removeOkxSeries } from './okxRealtimeSeries'
import { removeOkxSpread } from './okxRealtimeSpread'

type Listener = () => void

const tickers = new Map<string, OkxTickerFormatted>()
const percent = new Map<string, number>()
/**
 * Live open interest, in contracts. Out here with the tickers rather than in
 * the persisted store: it arrives every few seconds per instrument, and each of
 * those would otherwise be a write through to localStorage. The session-open
 * figure it gets compared against is polled, so that one does live in the store.
 */
const openInterest = new Map<string, string>()
const tickerListeners = new Map<string, Set<Listener>>()
const percentListeners = new Map<string, Set<Listener>>()
const openInterestListeners = new Map<string, Set<Listener>>()

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
  open: '',
})

export const subscribeOkxTicker = (instId: string, listener: Listener) =>
  subscribeByInstId(tickerListeners, instId, listener)

export const subscribeOkxPercent = (instId: string, listener: Listener) =>
  subscribeByInstId(percentListeners, instId, listener)

export const subscribeOkxOpenInterest = (instId: string, listener: Listener) =>
  subscribeByInstId(openInterestListeners, instId, listener)

export const getOkxTickerSnapshot = (instId: string) => tickers.get(instId)

export const getOkxOpenInterestSnapshot = (instId: string) =>
  openInterest.get(instId)

export const setOkxOpenInterest = (instId: string, oi: string) => {
  if (openInterest.get(instId) === oi) return
  openInterest.set(instId, oi)
  notify(openInterestListeners, instId)
}

export const getOkxPercentSnapshot = (instId: string) =>
  percent.get(instId) ?? 0

export const setOkxPercent = (instId: string, value: number) => {
  if (percent.get(instId) === value) return
  percent.set(instId, value)
  notify(percentListeners, instId)
}

/**
 * The percent drives the gainers/losers sort, so publishing it on every ticker
 * message would re-sort the whole board several times a second. The delay is
 * shared by every instrument rather than owned per instrument: one timer means
 * the board reorders once, as a whole, instead of a card at a time.
 *
 * This used to be a single lodash throttle called with the instId as an
 * argument, which kept only the last caller's arguments — so out of however
 * many instruments ticked inside a window, all but two had their update thrown
 * away, and a fresh sort took a minute to settle.
 */
const PERCENT_FLUSH_MS = 3000
const pendingPercent = new Map<string, number>()
let percentFlushTimer: ReturnType<typeof setTimeout> | undefined

const flushPercent = () => {
  percentFlushTimer = undefined
  const flushing = [...pendingPercent]
  pendingPercent.clear()
  flushing.forEach(([instId, value]) => setOkxPercent(instId, value))
}

const schedulePercentUpdate = (instId: string, value: number) => {
  if (percent.get(instId) === value) {
    pendingPercent.delete(instId)
    return
  }
  pendingPercent.set(instId, value)
  percentFlushTimer ??= setTimeout(flushPercent, PERCENT_FLUSH_MS)
}

export const updateOkxTicker = (instId: string, ticker: OkxTickerFormatted) => {
  const lastTicker = tickers.get(instId)
  ticker.isUp = !lastTicker
    ? true
    : +ticker.last === +lastTicker.last
      ? lastTicker.isUp
      : +ticker.last > +lastTicker.last

  tickers.set(instId, ticker)
  notify(tickerListeners, instId)
  schedulePercentUpdate(instId, Number(ticker.percent))
}

export const removeOkxTicker = (instId: string) => {
  tickers.delete(instId)
  percent.delete(instId)
  pendingPercent.delete(instId)
  openInterest.delete(instId)
  // Everything realtime about this symbol goes at once, so a symbol added back
  // later starts from nothing rather than from a five-minute-old buffer that
  // brackets a window it was not on the board for.
  removeOkxSeries(instId)
  removeOkxSpread(instId)
  notify(tickerListeners, instId)
  notify(percentListeners, instId)
  notify(openInterestListeners, instId)
}
