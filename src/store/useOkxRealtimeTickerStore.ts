import { create } from 'zustand'

import { OkxTickerFormatted } from '../types/okx'

interface OkxRealtimeTickerStore {
  tickers: Record<string, OkxTickerFormatted>
  updateTicker: (instId: string, ticker: OkxTickerFormatted) => void
  percent: Record<string, number | string>
  setPercent: (instId: string, percent: number) => void
}

export const useOkxRealtimeTickerStore = create<OkxRealtimeTickerStore>(
  (set) => ({
    tickers: {},
    updateTicker: (instId: string, ticker: OkxTickerFormatted) =>
      set((state) => {
        const last = state.tickers[instId]
        // same price, different amount
        const isUp =
          +ticker.last === +last?.last ? last?.isUp : +ticker.last > +last?.last

        return {
          tickers: {
            ...state.tickers,
            [instId]: { ...ticker, isUp },
          },
          percent: {
            ...state.percent,
            [instId]: ticker.percent,
          },
        }
      }),
    percent: {},
    setPercent: (instId: string, percent: number) =>
      set((state) => ({
        percent: {
          ...state.percent,
          [instId]: percent,
        },
      })),
  }),
)
