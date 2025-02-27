import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SortBy } from '../types/binance'

interface TickerStore {
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
}

export const useBinanceTickerStore = create<TickerStore>()(
  persist(
    (set) => ({
      sortBy: SortBy.VOLUME,
      setSortBy: (sortBy: SortBy) => set({ sortBy }),
    }),
    {
      name: 'binance-tickers',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
