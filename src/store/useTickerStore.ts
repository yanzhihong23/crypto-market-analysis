import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { OkxInstrument, OkxKline, OpenTime, SortBy } from '../types/okx'
import { Coil, DailyStats, isDailyStats } from '../utils/klineStats'
import { Baseline } from '../utils/signals'

import { coalescedLocalStorage } from './coalescedStorage'

export const DEFAULT_GROUP_ID = 'default'

export interface TickerGroup {
  id: string
  name: string
  collapsed?: boolean
}

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
   * Both come off the same candles, so both go in on one write. Writes through
   * this store cost the size of everything it saves rather than the size of
   * what changed, which is why they are coalesced and why the candles
   * themselves are not among what it saves — see the persist options below.
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
  /**
   * Which side the market orders have been on, as a signed share: +1 is every
   * taker buying, -1 is every taker selling, 0 is an even fight. Kept alongside
   * its deviation the way the ratio is, because both are read off a polled
   * history and neither moves between polls.
   */
  takerFlow: Record<
    string,
    { imbalance: number; deviation: number | null; updatedAt: number }
  >
  setTakerFlow: (
    instId: string,
    imbalance: number,
    deviation: number | null,
  ) => void
  /**
   * How far the elite position ratio is sitting from the crowd's account ratio,
   * as a difference of logs, with how unusual that is for this contract. Held
   * like the ratio for the same reason: both are read off a polled history and
   * neither moves between polls.
   */
  divergence: Record<
    string,
    { gap: number; deviation: number | null; updatedAt: number }
  >
  setDivergence: (instId: string, gap: number, deviation: number | null) => void
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
  /**
   * What a long has paid to hold this for a week, summed over the settlements
   * in it, in the unit the card shows the rate in.
   *
   * Rides along on the history the baselines above are taken from and costs no
   * request of its own. It belongs with the medium-term readings rather than
   * with them — the level and the shift describe one settlement, and this
   * describes twenty-one — but the fetch is here, and a second poller against
   * the same endpoint to compute a different sum off the same rows would be a
   * request spent on arithmetic.
   */
  fundingCarry: Record<string, number | null>
  /** All four come off one history, so all four go in on one write. */
  setFundingBaseline: (
    instId: string,
    baseline: Baseline | null,
    shiftBaseline: Baseline | null,
    previous: string,
    carry: number | null,
    settlesAt: number,
  ) => void
  fundingBaselineAt: Record<string, number>
  /**
   * When the settlement that was still ahead at the moment the history above
   * was fetched falls due, off the live channel's own `fundingTime`.
   *
   * It is what makes `fundingPrev` mean what it says. That figure is the rate
   * the last settlement actually charged, and it only moves when this history
   * is refetched — so a clock-based staleness alone let a settlement land and
   * go unrecorded, and `funding-shift` then measured the live rate against the
   * settlement *before* last while comparing it to the spread of single
   * settlement steps. Past this stamp the history is short of a row whatever
   * the clock says, and that is the moment to go back for it.
   */
  fundingSettlesAt: Record<string, number>
  /**
   * The spread of this instrument's own five-minute returns. The move itself is
   * taken off the live buffer, which holds no history to compare against and
   * has none to offer after a reload; this is the half that has to be fetched,
   * and like the funding baseline it moves slowly enough to be polled rarely.
   */
  momentumBaseline: Record<string, Baseline | null>
  momentumBaselineAt: Record<string, number>
  /**
   * How quiet the last two hours have been against the eight behind them. Off
   * the same uncut candles as the baseline above and written with it, because
   * the board's own candles are cut to the session and have too few bars to
   * answer this for the first half of every day.
   */
  coil: Record<string, Coil | null>
  setMomentumBaseline: (
    instId: string,
    baseline: Baseline | null,
    coil: Coil | null,
  ) => void
  /** The same, for five-minute open interest changes. */
  oiChangeBaseline: Record<string, Baseline | null>
  setOiChangeBaseline: (instId: string, baseline: Baseline | null) => void
  /**
   * A month and a week of daily bars, reduced to the dozen numbers anything
   * medium term is read against.
   *
   * The daily candles it comes off are not kept — three hundred bars per symbol
   * would be most of what this store saves, and nothing reads them twice. What
   * is kept is the yardstick, which is the part that survives a reload usefully:
   * it describes a month, so an hour-old copy of it is as good as a fresh one,
   * and a board that reopens already knowing where every symbol sits in its
   * range is a board that does not have to refetch to say so.
   */
  dailyStats: Record<string, DailyStats | null>
  dailyStatsAt: Record<string, number>
  /**
   * Which open each of those was cut at, so switching the board's open discards
   * them rather than leaving a month measured on the other clock.
   *
   * A record of its own rather than a field on the timestamp: that one is
   * persisted, and a field added inside a record already being saved is exactly
   * the case the version note below is about. Absent from an old save, this
   * reads as undefined, misses against whatever the board is set to, and the
   * next pass rewrites it — which is what should happen to a month taken before
   * anybody was asking.
   */
  dailyStatsOpenTime: Record<string, OpenTime>
  /**
   * Where open interest sits in its own hundred days, 0 to 1. Off a different
   * endpoint from the candles above and on the same hourly walk, so it goes in
   * on the same write rather than earning a poller of its own.
   */
  dailyOiPercentile: Record<string, number | null>
  setDailyStats: (
    instId: string,
    stats: DailyStats | null,
    oiPercentile: number | null,
    openTime: OpenTime,
  ) => void
  /**
   * BTC's own daily stats, held apart from the watchlist's.
   *
   * Everything else here is keyed by instrument because it describes one. This
   * describes the market, and it is fetched whether or not anybody is watching
   * BTC — a benchmark that came and went with the watchlist would make the same
   * symbol's relative strength mean different things on different boards, which
   * is the one thing a benchmark exists to prevent.
   */
  benchmarkDaily: DailyStats | null
  benchmarkDailyAt: number
  /** The same stamp, for the one series that is not keyed by instrument. */
  benchmarkDailyOpenTime: OpenTime | null
  setBenchmarkDaily: (stats: DailyStats | null, openTime: OpenTime) => void
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
  /**
   * Whether the card's sparkline carries volume behind it. A preference rather
   * than a fixed choice because the bars are texture: on a board of a dozen
   * cards they say which stretch of the session traded, and on a board of a
   * hundred they are a hundred more shapes to look past.
   */
  klineVolume: boolean
  setKlineVolume: (klineVolume: boolean) => void
  /**
   * Collapses each card down to its header and last price — symbol, 24h change,
   * price and print size — dropping the range track, sparkline and metric chips
   * so more of the watchlist fits in view at once.
   */
  compactCard: boolean
  setCompactCard: (compactCard: boolean) => void
  /**
   * User-defined watchlist sections, rendered alongside the implicit default
   * group. Keeping `instIds` as the single subscription list lets sockets and
   * pollers stay unaware of grouping while `symbolGroup` assigns each symbol
   * to at most one section.
   */
  groups: TickerGroup[]
  /** Display order of sections, including `DEFAULT_GROUP_ID` and custom group ids. */
  groupOrder: string[]
  defaultGroupCollapsed: boolean
  symbolGroup: Record<string, string>
  addGroup: (name: string) => string
  renameGroup: (id: string, name: string) => void
  deleteGroup: (id: string) => void
  moveGroup: (id: string, direction: 'up' | 'down') => void
  toggleGroupCollapsed: (id: string) => void
  setSymbolGroup: (instId: string, groupId: string) => void
}

/**
 * Every store field that is a Record keyed by instId.
 *
 * Arrays and functions also satisfy `Record` in TypeScript's structural
 * typing, so both are carved out. What remains are the per-instrument maps —
 * the ones `removeInstId` promises to take with the symbol.
 */
type InstIdRecordKey = {
  [K in keyof TickerStore]-?: TickerStore[K] extends Record<string, unknown>
    ? TickerStore[K] extends readonly unknown[]
      ? never
      : TickerStore[K] extends (...args: never[]) => unknown
        ? never
        : K
    : never
}[keyof TickerStore]

const withoutInstId = <T>(record: Record<string, T>, instId: string) => {
  const rest = { ...record }
  delete rest[instId]
  return rest
}

/**
 * Drop one instrument from every Record that lives under its name.
 *
 * The return is typed as a full `Pick` of every `InstIdRecordKey`, so a keyed
 * field added to `TickerStore` will not build until it is named here — the same
 * class of protection `NUMERIC_FIELDS` gives `isDailyStats`. The hand-written
 * list that lived inside `removeInstId` used to miss `fundingSettlesAt` and
 * `dailyStatsOpenTime` for exactly that reason.
 */
const clearInstIdRecords = (
  state: TickerStore,
  instId: string,
): Pick<TickerStore, InstIdRecordKey> => ({
  klineData: withoutInstId(state.klineData, instId),
  volCcyQuote: withoutInstId(state.volCcyQuote, instId),
  ratio: withoutInstId(state.ratio, instId),
  takerFlow: withoutInstId(state.takerFlow, instId),
  divergence: withoutInstId(state.divergence, instId),
  fundingRate: withoutInstId(state.fundingRate, instId),
  fundingTime: withoutInstId(state.fundingTime, instId),
  fundingBaseline: withoutInstId(state.fundingBaseline, instId),
  fundingShiftBaseline: withoutInstId(state.fundingShiftBaseline, instId),
  fundingPrev: withoutInstId(state.fundingPrev, instId),
  fundingCarry: withoutInstId(state.fundingCarry, instId),
  fundingBaselineAt: withoutInstId(state.fundingBaselineAt, instId),
  fundingSettlesAt: withoutInstId(state.fundingSettlesAt, instId),
  momentumBaseline: withoutInstId(state.momentumBaseline, instId),
  momentumBaselineAt: withoutInstId(state.momentumBaselineAt, instId),
  coil: withoutInstId(state.coil, instId),
  oiChangeBaseline: withoutInstId(state.oiChangeBaseline, instId),
  dailyStats: withoutInstId(state.dailyStats, instId),
  dailyStatsAt: withoutInstId(state.dailyStatsAt, instId),
  dailyStatsOpenTime: withoutInstId(state.dailyStatsOpenTime, instId),
  dailyOiPercentile: withoutInstId(state.dailyOiPercentile, instId),
  openInterestOpen: withoutInstId(state.openInterestOpen, instId),
  symbolGroup: withoutInstId(state.symbolGroup, instId),
})

/**
 * Resolves which section a symbol belongs to, falling back to the default
 * group if unassigned or if its group was removed.
 */
export const groupIdOf = (
  instId: string,
  groups: TickerGroup[],
  symbolGroup: Record<string, string>,
): string => {
  const assigned = symbolGroup[instId]
  if (assigned && groups.some((group) => group.id === assigned)) {
    return assigned
  }
  return DEFAULT_GROUP_ID
}

/**
 * Resolves the display order of all sections (default + custom), reconciling
 * any persisted order with newly added or deleted groups.
 */
export const orderedGroupIds = (
  groups: TickerGroup[],
  groupOrder: string[] = [],
): string[] => {
  const valid = new Set<string>([
    DEFAULT_GROUP_ID,
    ...groups.map((group) => group.id),
  ])
  const result: string[] = []
  const seen = new Set<string>()

  for (const id of groupOrder) {
    if (valid.has(id) && !seen.has(id)) {
      result.push(id)
      seen.add(id)
    }
  }
  if (!seen.has(DEFAULT_GROUP_ID)) {
    result.unshift(DEFAULT_GROUP_ID)
    seen.add(DEFAULT_GROUP_ID)
  }
  for (const group of groups) {
    if (!seen.has(group.id)) {
      result.push(group.id)
      seen.add(group.id)
    }
  }
  return result
}

/**
 * Every watched symbol in the same section as `instId`. When no custom groups
 * exist, the whole watchlist is one group.
 */
export const peerInstIdsOf = (
  instId: string,
  state: Pick<TickerStore, 'instIds' | 'groups' | 'symbolGroup'>,
): string[] => {
  if (!state.groups.length) return state.instIds
  const target = groupIdOf(instId, state.groups, state.symbolGroup)
  return state.instIds.filter(
    (id) => groupIdOf(id, state.groups, state.symbolGroup) === target,
  )
}

export const useTickerStore = create<TickerStore>()(
  persist(
    (set) => ({
      instruments: [],
      setInstruments: (instruments: OkxInstrument[]) => set({ instruments }),
      instIds: [
        'BTC-USDT-SWAP',
        'ETH-USDT-SWAP',
        'ZEC-USDT-SWAP',
        'SOL-USDT-SWAP',
        'PUMP-USDT-SWAP',
        'XAU-USDT-SWAP',
        'XAG-USDT-SWAP',
        'SNDK-USDT-SWAP',
        'SPCX-USDT-SWAP',
        'OKB-USDT-SWAP',
      ],
      setInstIds: (instIds: string[]) => set({ instIds }),
      removeInstId: (instId: string) =>
        set((state) => ({
          ...clearInstIdRecords(state, instId),
          instIds: state.instIds.filter((id) => id !== instId),
          // Otherwise the pin outlives the card and reappears if the symbol
          // is added back later.
          pinnedInstIds: state.pinnedInstIds.filter((id) => id !== instId),
        })),
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
      takerFlow: {},
      setTakerFlow: (
        instId: string,
        imbalance: number,
        deviation: number | null,
      ) =>
        set((state) => ({
          takerFlow: {
            ...state.takerFlow,
            [instId]: { imbalance, deviation, updatedAt: Date.now() },
          },
        })),
      divergence: {},
      setDivergence: (instId: string, gap: number, deviation: number | null) =>
        set((state) => ({
          divergence: {
            ...state.divergence,
            [instId]: { gap, deviation, updatedAt: Date.now() },
          },
        })),
      fundingBaseline: {},
      fundingShiftBaseline: {},
      fundingPrev: {},
      fundingCarry: {},
      fundingBaselineAt: {},
      fundingSettlesAt: {},
      setFundingBaseline: (
        instId: string,
        baseline: Baseline | null,
        shiftBaseline: Baseline | null,
        previous: string,
        carry: number | null,
        settlesAt: number,
      ) =>
        set((state) => ({
          fundingBaseline: { ...state.fundingBaseline, [instId]: baseline },
          fundingShiftBaseline: {
            ...state.fundingShiftBaseline,
            [instId]: shiftBaseline,
          },
          fundingPrev: { ...state.fundingPrev, [instId]: previous },
          fundingCarry: { ...state.fundingCarry, [instId]: carry },
          fundingBaselineAt: {
            ...state.fundingBaselineAt,
            [instId]: Date.now(),
          },
          fundingSettlesAt: {
            ...state.fundingSettlesAt,
            [instId]: settlesAt,
          },
        })),
      momentumBaseline: {},
      momentumBaselineAt: {},
      coil: {},
      setMomentumBaseline: (
        instId: string,
        baseline: Baseline | null,
        coil: Coil | null,
      ) =>
        set((state) => ({
          momentumBaseline: { ...state.momentumBaseline, [instId]: baseline },
          coil: { ...state.coil, [instId]: coil },
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
      dailyStats: {},
      dailyStatsAt: {},
      dailyStatsOpenTime: {},
      dailyOiPercentile: {},
      // Stamped even when the derivation came to nothing, so a symbol with too
      // little history is not refetched on every pass for the month it takes to
      // grow some.
      setDailyStats: (
        instId: string,
        stats: DailyStats | null,
        oiPercentile: number | null,
        openTime: OpenTime,
      ) =>
        set((state) => ({
          dailyStats: { ...state.dailyStats, [instId]: stats },
          dailyOiPercentile: {
            ...state.dailyOiPercentile,
            [instId]: oiPercentile,
          },
          dailyStatsAt: { ...state.dailyStatsAt, [instId]: Date.now() },
          dailyStatsOpenTime: {
            ...state.dailyStatsOpenTime,
            [instId]: openTime,
          },
        })),
      benchmarkDaily: null,
      benchmarkDailyAt: 0,
      benchmarkDailyOpenTime: null,
      setBenchmarkDaily: (stats: DailyStats | null, openTime: OpenTime) =>
        set({
          benchmarkDaily: stats,
          benchmarkDailyAt: Date.now(),
          benchmarkDailyOpenTime: openTime,
        }),
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
      klineVolume: true,
      setKlineVolume: (klineVolume: boolean) => set({ klineVolume }),
      compactCard: false,
      setCompactCard: (compactCard: boolean) => set({ compactCard }),
      groups: [],
      groupOrder: [DEFAULT_GROUP_ID],
      defaultGroupCollapsed: false,
      symbolGroup: {},
      addGroup: (name: string) => {
        const trimmed = name.trim()
        const id = `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
        set((state) => {
          const nextGroups = [...state.groups, { id, name: trimmed }]
          return {
            groups: nextGroups,
            groupOrder: orderedGroupIds(nextGroups, [...state.groupOrder, id]),
          }
        })
        return id
      },
      renameGroup: (id: string, name: string) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, name: trimmed } : group,
          ),
        }))
      },
      deleteGroup: (id: string) =>
        set((state) => {
          const nextSymbolGroup: Record<string, string> = {}
          for (const [instId, groupId] of Object.entries(state.symbolGroup)) {
            if (groupId !== id) nextSymbolGroup[instId] = groupId
          }
          const nextGroups = state.groups.filter((group) => group.id !== id)
          return {
            groups: nextGroups,
            groupOrder: orderedGroupIds(
              nextGroups,
              state.groupOrder.filter((gid) => gid !== id),
            ),
            symbolGroup: nextSymbolGroup,
          }
        }),
      moveGroup: (id: string, direction: 'up' | 'down') =>
        set((state) => {
          const fullOrder = orderedGroupIds(state.groups, state.groupOrder)
          const hasDefaultSymbols = state.instIds.some(
            (instId) =>
              groupIdOf(instId, state.groups, state.symbolGroup) ===
              DEFAULT_GROUP_ID,
          )
          // Swap against the adjacent *visible* section so moving past a
          // hidden empty Default group never takes an invisible extra click.
          const visible = fullOrder.filter(
            (gid) => gid !== DEFAULT_GROUP_ID || hasDefaultSymbols,
          )
          const visIndex = visible.indexOf(id)
          if (visIndex === -1) return state
          const neighborVisIndex =
            direction === 'up' ? visIndex - 1 : visIndex + 1
          if (neighborVisIndex < 0 || neighborVisIndex >= visible.length) {
            return state
          }
          const neighborId = visible[neighborVisIndex]
          const a = fullOrder.indexOf(id)
          const b = fullOrder.indexOf(neighborId)
          const next = [...fullOrder]
          ;[next[a], next[b]] = [next[b], next[a]]
          return { groupOrder: next }
        }),
      toggleGroupCollapsed: (id: string) =>
        set((state) => {
          if (id === DEFAULT_GROUP_ID) {
            return { defaultGroupCollapsed: !state.defaultGroupCollapsed }
          }
          return {
            groups: state.groups.map((group) =>
              group.id === id
                ? { ...group, collapsed: !group.collapsed }
                : group,
            ),
          }
        }),
      setSymbolGroup: (instId: string, groupId: string) =>
        set((state) => {
          if (
            groupId === DEFAULT_GROUP_ID ||
            !state.groups.some((group) => group.id === groupId)
          ) {
            if (!(instId in state.symbolGroup)) return state
            return { symbolGroup: withoutInstId(state.symbolGroup, instId) }
          }
          if (state.symbolGroup[instId] === groupId) return state
          return {
            symbolGroup: { ...state.symbolGroup, [instId]: groupId },
          }
        }),
    }),
    {
      name: 'tickers',
      // Coalesced rather than written straight through: every write through
      // this store saves the whole of it, and a live feed writes several times
      // a second. See the module for the numbers.
      storage: coalescedLocalStorage<TickerStore>(),
      /**
       * Bumped whenever a persisted *record* grows a field, as opposed to the
       * store growing a record.
       *
       * A new record is safe unversioned: it is absent from an old save, reads
       * as undefined, and every caller already asks whether it is there. A new
       * field inside a record that is already saved is not — the record arrives
       * looking complete, passes the null check that guards it, and yields
       * undefined only when something reaches through it. Relative strength
       * subtracts two of those and put `NaN%` on the dialog for anybody whose
       * daily stats had been written an hour earlier by the build before it.
       */
      version: 1,
      /**
       * For version steps from here on. It cannot repair what is already saved,
       * and it is worth being precise about why: zustand only migrates when the
       * stored blob carries a numeric version, and every blob written before
       * this option existed carries none. Those load as-is and are then written
       * back stamped with the current version, so a migration keyed on the step
       * they actually came from can never run for them.
       */
      migrate: (persisted, version) => {
        const state = persisted as TickerStore
        if (version >= 1) return state
        return { ...state, dailyStats: {}, dailyStatsAt: {} }
      },
      /**
       * Which is why the shape check lives here instead, where it runs on every
       * rehydration and asks nothing about where the state came from.
       *
       * Only the daily stats are checked, because they are the only record here
       * that is a *composite* and persisted. A record added later is absent from
       * an old save rather than half-built, and every caller already asks
       * whether it is there; a field added to a record already being saved is
       * the case nothing catches, and this is that case.
       *
       * Dropped rather than repaired, along with the timestamp that would
       * otherwise keep the hourly poll from replacing them. They are derived
       * from candles refetched every hour anyway, so the honest fix is to let
       * the next pass write the shape this build expects. Nulls are kept: a
       * symbol too new to have a month of history is a real answer, not a
       * malformed one.
       */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<TickerStore>
        const usable = Object.entries(saved.dailyStats ?? {}).filter(
          ([, stats]) => stats === null || isDailyStats(stats),
        )
        const keep = new Set(usable.map(([instId]) => instId))

        return {
          ...current,
          ...saved,
          dailyStats: Object.fromEntries(usable),
          dailyStatsAt: Object.fromEntries(
            Object.entries(saved.dailyStatsAt ?? {}).filter(([instId]) =>
              keep.has(instId),
            ),
          ),
          dailyStatsOpenTime: Object.fromEntries(
            Object.entries(saved.dailyStatsOpenTime ?? {}).filter(([instId]) =>
              keep.has(instId),
            ),
          ),
          benchmarkDaily: isDailyStats(saved.benchmarkDaily)
            ? saved.benchmarkDaily
            : null,
          benchmarkDailyAt: isDailyStats(saved.benchmarkDaily)
            ? (saved.benchmarkDailyAt ?? 0)
            : 0,
          benchmarkDailyOpenTime: isDailyStats(saved.benchmarkDaily)
            ? (saved.benchmarkDailyOpenTime ?? null)
            : null,
        }
      },
      /**
       * Everything but the two records that are refetched on mount anyway, and
       * which between them were all but the last few percent of what this store
       * saved: the instrument list, four hundred-odd contracts at 425KB of the
       * 431KB it held then, and the candles, 368KB of the 425KB it held after
       * that one was taken out. Neither bought anything by being saved, and each
       * cost a full serialisation of itself on every write through the store —
       * with a live feed writing several times a minute per symbol, megabytes a
       * minute of throwaway strings handed to a synchronous localStorage. Safari
       * reloads a tab that goes on doing that.
       *
       * The candles go rather than stay because of what they are: a quarter hour
       * each, twenty-five hours of them, repolled every minute. A saved copy is
       * stale by the time it is read, which is the opposite of the medium-term
       * yardsticks next to them — those describe a month, so an hour-old copy is
       * as good as a fresh one and worth every byte it costs. What is lost is a
       * sparkline on the cards for the few seconds the opening walk takes, on a
       * board whose prices are waiting on the socket over the same seconds.
       *
       * Saved empty rather than dropped so the persisted shape still matches
       * the store's, which is the same state the app boots into anyway.
       */
      partialize: (state) => ({ ...state, instruments: [], klineData: {} }),
    },
  ),
)
