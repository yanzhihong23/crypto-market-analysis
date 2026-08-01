import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { OkxInstrument, OkxKline, OpenTime, SortBy } from '../types/okx'
import { Baseline } from '../utils/signals'

interface TickerStore {
  instruments: OkxInstrument[]
  setInstruments: (instruments: OkxInstrument[]) => void
  instIds: string[]
  setInstIds: (instIds: string[]) => void
  klineData: Record<string, OkxKline[]>
  setKlineData: (instId: string, klineData: OkxKline[]) => void
  volCcyQuote: Record<string, string>
  setVolCcyQuote: (instId: string, volCcyQuote: string) => void
  ratio: Record<
    string,
    { value: string; deviation: number | null; updatedAt: number }
  >
  setRatio: (instId: string, ratio: string, deviation: number | null) => void
  fundingRate: Record<string, string>
  setFundingRate: (instId: string, fundingRate: string) => void
  /**
   * The shape of each instrument's funding history, so the live rate off the
   * websocket can be measured against it. The rate itself is not stored with a
   * deviation the way the ratio is, because it moves between polls.
   */
  fundingBaseline: Record<string, Baseline | null>
  setFundingBaseline: (instId: string, baseline: Baseline | null) => void
  fundingBaselineAt: Record<string, number>
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
      instIds: ['BTC-USDT-SWAP', 'ETH-USDT-SWAP', 'SUI-USDT-SWAP'],
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
      setRatio: (instId: string, ratio: string, deviation: number | null) =>
        set((state) => ({
          ratio: {
            ...state.ratio,
            [instId]: { value: ratio, deviation, updatedAt: Date.now() },
          },
        })),
      fundingBaseline: {},
      fundingBaselineAt: {},
      setFundingBaseline: (instId: string, baseline: Baseline | null) =>
        set((state) => ({
          fundingBaseline: { ...state.fundingBaseline, [instId]: baseline },
          fundingBaselineAt: {
            ...state.fundingBaselineAt,
            [instId]: Date.now(),
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
