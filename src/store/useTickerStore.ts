import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { OkxKline } from '../types/okx'

interface TickerStore {
  instIds: string[]
  setInstIds: (instIds: string[]) => void
  klineData: Record<string, OkxKline[]>
  setKlineData: (instId: string, klineData: OkxKline[]) => void
  volCcyQuote: Record<string, string>
  setVolCcyQuote: (instId: string, volCcyQuote: string) => void
  ratio: Record<string, string>
  setRatio: (instId: string, ratio: string) => void
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
      klineData: {},
      setKlineData: (instId: string, klineData: OkxKline[]) =>
        set((state) => ({
          klineData: { ...state.klineData, [instId]: klineData },
        })),
      volCcyQuote: {},
      setVolCcyQuote: (instId: string, volCcyQuote: string) =>
        set((state) => ({
          volCcyQuote: { ...state.volCcyQuote, [instId]: volCcyQuote },
        })),
      ratio: {},
      setRatio: (instId: string, ratio: string) =>
        set((state) => ({
          ratio: { ...state.ratio, [instId]: ratio },
        })),
    }),
    {
      name: 'tickers',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
