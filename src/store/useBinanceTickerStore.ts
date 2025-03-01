import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SortBy } from '../types/binance'

interface TickerStore {
  symbols: string[]
  setSymbols: (symbols: string[]) => void
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
  ratio: Record<
    string,
    {
      value: string
      updatedAt: number
    }
  >
  setRatio: (symbol: string, ratio: string) => void
}

export const useBinanceTickerStore = create<TickerStore>()(
  persist(
    (set) => ({
      symbols: [],
      setSymbols: (symbols: string[]) => set({ symbols }),
      sortBy: SortBy.VOLUME,
      setSortBy: (sortBy: SortBy) => set({ sortBy }),
      ratio: {},
      setRatio: (symbol: string, ratio: string) =>
        set((state) => ({
          ratio: {
            ...state.ratio,
            [symbol]: { value: ratio, updatedAt: Date.now() },
          },
        })),
    }),
    {
      name: 'binance-tickers',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
