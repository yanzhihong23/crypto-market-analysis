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
    const throttledPercentUpdate = throttle((instId: string, value: number) => {
      get().percent.set(instId, value)
      set({ percent: get().percent })
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
        requestAnimationFrame(() => set({ tickers: get().tickers }))
        throttledPercentUpdate(instId, Number(ticker.percent))
      },
      setPercent: (instId, value) => {
        get().percent.set(instId, value)
        set({ percent: get().percent })
      },
    }
  },
)
