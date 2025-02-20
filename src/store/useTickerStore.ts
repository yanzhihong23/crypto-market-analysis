import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface TickerStore {
  instIds: string[]
  setInstIds: (instIds: string[]) => void
}

export const useTickerStore = create<TickerStore>()(
  persist(
    (set) => ({
      instIds: [
        'BTC-USDT-SWAP',
        'ETH-USDT-SWAP',
        'SUI-USDT-SWAP',
        'IP-USDT-SWAP',
      ],
      setInstIds: (instIds: string[]) => set({ instIds }),
    }),
    {
      name: 'tickers',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
