import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { OkxInstrument, OkxKline, OpenTime, SortBy } from '../types/okx'
import { Baseline } from '../utils/signals'

interface TickerStore {
  instruments: OkxInstrument[]
  setInstruments: (instruments: OkxInstrument[]) => void
  instIds: string[]
  setInstIds: (instIds: string[]) => void
  /**
   * Takes a symbol off the board and everything held under its name with it.
   * Dropping it from the watchlist alone left its klines, its ratio and its
   * funding history behind in a store that is persisted, so the saved state
   * grew with every symbol ever watched and never shrank.
   */
  removeInstId: (instId: string) => void
  /**
   * Tickers that hold the front of the board whatever the sort is. Sorting a
   * live board by volume or by change moves everything every few seconds, and
   * the handful of symbols actually being watched moved with it.
   */
  pinnedInstIds: string[]
  togglePinned: (instId: string) => void
  klineData: Record<string, OkxKline[]>
  volCcyQuote: Record<string, string>
  /**
   * Both come off the same candles, so both go in on one write. Every write
   * through this store is serialised and handed to localStorage, which is the
   * one cost here that does not care how small the values are.
   */
  setKlines: (
    instId: string,
    klineData: OkxKline[],
    volCcyQuote: string,
  ) => void
  ratio: Record<
    string,
    { value: string; deviation: number | null; updatedAt: number }
  >
  setRatio: (instId: string, ratio: string, deviation: number | null) => void
  fundingRate: Record<string, string>
  /**
   * When the rate currently being quoted is actually charged. A funding rate
   * only costs anything to a position held through its settlement, so the
   * number on the card means something different an hour out than a minute out.
   */
  fundingTime: Record<string, string>
  setFunding: (instId: string, fundingRate: string, fundingTime: string) => void
  /**
   * The shape of each instrument's funding history, so the live rate off the
   * websocket can be measured against it. The rate itself is not stored with a
   * deviation the way the ratio is, because it moves between polls.
   */
  fundingBaseline: Record<string, Baseline | null>
  /**
   * The shape of the steps between settlements, and the rate the last one
   * charged. A rate that has sat at its high all month and a rate that has just
   * tripled are different events, and the level alone tells them apart.
   */
  fundingShiftBaseline: Record<string, Baseline | null>
  fundingPrev: Record<string, string>
  /** All three come off one history, so all three go in on one write. */
  setFundingBaseline: (
    instId: string,
    baseline: Baseline | null,
    shiftBaseline: Baseline | null,
    previous: string,
  ) => void
  fundingBaselineAt: Record<string, number>
  /**
   * The spread of this instrument's own five-minute returns. The move itself is
   * taken off the live buffer, which holds no history to compare against and
   * has none to offer after a reload; this is the half that has to be fetched,
   * and like the funding baseline it moves slowly enough to be polled rarely.
   */
  momentumBaseline: Record<string, Baseline | null>
  momentumBaselineAt: Record<string, number>
  setMomentumBaseline: (instId: string, baseline: Baseline | null) => void
  /** The same, for five-minute open interest changes. */
  oiChangeBaseline: Record<string, Baseline | null>
  setOiChangeBaseline: (instId: string, baseline: Baseline | null) => void
  /**
   * Open interest as it stood when the current session opened, which is what
   * the live figure off the websocket is measured against. Stamped with the
   * session it was taken for, so switching the board's open discards it rather
   * than quietly comparing against the wrong morning.
   */
  openInterestOpen: Record<
    string,
    { value: string; openTime: OpenTime; fetchedAt: number }
  >
  setOpenInterestOpen: (
    instId: string,
    value: string,
    openTime: OpenTime,
  ) => void
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
      removeInstId: (instId: string) =>
        set((state) => {
          const without = <T>(record: Record<string, T>) => {
            const rest = { ...record }
            delete rest[instId]
            return rest
          }

          return {
            instIds: state.instIds.filter((id) => id !== instId),
            // Otherwise the pin outlives the card and reappears if the symbol
            // is added back later.
            pinnedInstIds: state.pinnedInstIds.filter((id) => id !== instId),
            klineData: without(state.klineData),
            volCcyQuote: without(state.volCcyQuote),
            ratio: without(state.ratio),
            fundingRate: without(state.fundingRate),
            fundingTime: without(state.fundingTime),
            fundingBaseline: without(state.fundingBaseline),
            fundingShiftBaseline: without(state.fundingShiftBaseline),
            fundingPrev: without(state.fundingPrev),
            fundingBaselineAt: without(state.fundingBaselineAt),
            momentumBaseline: without(state.momentumBaseline),
            momentumBaselineAt: without(state.momentumBaselineAt),
            oiChangeBaseline: without(state.oiChangeBaseline),
            openInterestOpen: without(state.openInterestOpen),
          }
        }),
      pinnedInstIds: [],
      togglePinned: (instId: string) =>
        set((state) => ({
          pinnedInstIds: state.pinnedInstIds.includes(instId)
            ? state.pinnedInstIds.filter((id) => id !== instId)
            : [...state.pinnedInstIds, instId],
        })),
      klineData: {},
      volCcyQuote: {},
      setKlines: (instId: string, klineData: OkxKline[], volCcyQuote: string) =>
        set((state) => ({
          klineData: { ...state.klineData, [instId]: klineData },
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
      fundingShiftBaseline: {},
      fundingPrev: {},
      fundingBaselineAt: {},
      setFundingBaseline: (
        instId: string,
        baseline: Baseline | null,
        shiftBaseline: Baseline | null,
        previous: string,
      ) =>
        set((state) => ({
          fundingBaseline: { ...state.fundingBaseline, [instId]: baseline },
          fundingShiftBaseline: {
            ...state.fundingShiftBaseline,
            [instId]: shiftBaseline,
          },
          fundingPrev: { ...state.fundingPrev, [instId]: previous },
          fundingBaselineAt: {
            ...state.fundingBaselineAt,
            [instId]: Date.now(),
          },
        })),
      momentumBaseline: {},
      momentumBaselineAt: {},
      setMomentumBaseline: (instId: string, baseline: Baseline | null) =>
        set((state) => ({
          momentumBaseline: { ...state.momentumBaseline, [instId]: baseline },
          momentumBaselineAt: {
            ...state.momentumBaselineAt,
            [instId]: Date.now(),
          },
        })),
      oiChangeBaseline: {},
      setOiChangeBaseline: (instId: string, baseline: Baseline | null) =>
        set((state) => ({
          oiChangeBaseline: { ...state.oiChangeBaseline, [instId]: baseline },
        })),
      openInterestOpen: {},
      setOpenInterestOpen: (
        instId: string,
        value: string,
        openTime: OpenTime,
      ) =>
        set((state) => ({
          openInterestOpen: {
            ...state.openInterestOpen,
            [instId]: { value, openTime, fetchedAt: Date.now() },
          },
        })),
      fundingRate: {},
      fundingTime: {},
      // Both off the same message, so both in one write rather than two.
      setFunding: (instId: string, fundingRate: string, fundingTime: string) =>
        set((state) => ({
          fundingRate: { ...state.fundingRate, [instId]: fundingRate },
          fundingTime: { ...state.fundingTime, [instId]: fundingTime },
        })),
      openTime: OpenTime.UTC0,
      setOpenTime: (openTime: OpenTime) => set({ openTime }),
      sortBy: SortBy.VOLUME,
      setSortBy: (sortBy: SortBy) => set({ sortBy }),
    }),
    {
      name: 'tickers',
      storage: createJSONStorage(() => localStorage),
      /**
       * Everything but the instrument list, which is four hundred-odd contracts
       * and was 425KB of the 431KB this store saved. It is refetched on every
       * mount regardless, so persisting it bought nothing and cost a full
       * serialisation of it on every write through the store — with a live feed
       * writing several times a minute per symbol, megabytes a minute of
       * throwaway strings handed to a synchronous localStorage. Safari reloads
       * a tab that goes on doing that.
       *
       * Saved empty rather than dropped so the persisted shape still matches
       * the store's, which is the same state the app boots into anyway.
       */
      partialize: (state) => ({ ...state, instruments: [] }),
    },
  ),
)
