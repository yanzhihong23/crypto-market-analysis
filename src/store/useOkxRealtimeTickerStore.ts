import { create } from 'zustand'
import { throttle } from 'lodash'

import { OkxTickerFormatted } from '../types/okx'

interface OkxRealtimeTickerStore {
  tickers: Map<string, OkxTickerFormatted>
  percent: Map<string, number>
  updateTicker: (instId: string, ticker: OkxTickerFormatted) => void
  setPercent: (instId: string, value: number) => void
}

export const useOkxRealtimeTickerStore = create<OkxRealtimeTickerStore>(
  (set, get) => {
    let tickersRafId: number | null = null
    let percentRafId: number | null = null

    const scheduleTickersNotify = () => {
      if (tickersRafId !== null) return
      tickersRafId = requestAnimationFrame(() => {
        tickersRafId = null
        set({ tickers: get().tickers })
      })
    }

    const schedulePercentNotify = () => {
      if (percentRafId !== null) return
      percentRafId = requestAnimationFrame(() => {
        percentRafId = null
        set({ percent: get().percent })
      })
    }

    const throttledPercentUpdate = throttle((instId: string, value: number) => {
      get().percent.set(instId, value)
      schedulePercentNotify()
    }, 3000)

    return {
      tickers: new Map(),
      percent: new Map(),
      updateTicker: (instId, ticker) => {
        const lastTicker = get().tickers.get(instId)
        ticker.isUp = !lastTicker
          ? true
          : +ticker.last === +lastTicker?.last
            ? lastTicker?.isUp
            : +ticker.last > +lastTicker?.last

        get().tickers.set(instId, ticker)
        scheduleTickersNotify()
        throttledPercentUpdate(instId, Number(ticker.percent))
      },
      setPercent: (instId, value) => {
        get().percent.set(instId, value)
        schedulePercentNotify()
      },
    }
  },
)
