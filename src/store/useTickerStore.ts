import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { OkxInstrument, OkxKline, OpenTime, SortBy } from '../types/okx'

interface TickerStore {
  instruments: OkxInstrument[]
  setInstruments: (instruments: OkxInstrument[]) => void
  instIds: string[]
  setInstIds: (instIds: string[]) => void
  klineData: Record<string, OkxKline[]>
  setKlineData: (instId: string, klineData: OkxKline[]) => void
  volCcyQuote: Record<string, string>
  setVolCcyQuote: (instId: string, volCcyQuote: string) => void
  ratio: Record<string, { value: string; updatedAt: number }>
  setRatio: (instId: string, ratio: string) => void
  fundingRate: Record<string, string>
  setFundingRate: (instId: string, fundingRate: string) => void
  openTime: OpenTime
  setOpenTime: (openTime: OpenTime) => void
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
}

export const useTickerStore = create<TickerStore>()(
  persist(
    (set) => ({
      instruments: [],
      setInstruments: (instruments: OkxInstrument[]) => set({ instruments }),
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
          ratio: {
            ...state.ratio,
            [instId]: { value: ratio, updatedAt: Date.now() },
          },
        })),
      fundingRate: {},
      setFundingRate: (instId: string, fundingRate: string) =>
        set((state) => ({
          fundingRate: { ...state.fundingRate, [instId]: fundingRate },
        })),
      openTime: OpenTime.UTC0,
      setOpenTime: (openTime: OpenTime) => set({ openTime }),
      sortBy: SortBy.VOLUME,
      setSortBy: (sortBy: SortBy) => set({ sortBy }),
    }),
    {
      name: 'tickers',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
