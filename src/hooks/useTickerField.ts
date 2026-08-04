import { useCallback, useSyncExternalStore } from 'react'

import { useTickerStore } from '../store/useTickerStore'

const subscribeInstField = <T>(
  read: (state: ReturnType<typeof useTickerStore.getState>) => T,
) => {
  return (listener: () => void) =>
    useTickerStore.subscribe((state, prevState) => {
      if (!Object.is(read(state), read(prevState))) {
        listener()
      }
    })
}

const getInstFieldSnapshot = <T>(
  read: (state: ReturnType<typeof useTickerStore.getState>) => T,
) => read(useTickerStore.getState())

export function useVolCcyQuote(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.volCcyQuote[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useRatio(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) => state.ratio[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useTakerFlow(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.takerFlow[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useFundingRate(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.fundingRate[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useFundingTime(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.fundingTime[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useFundingBaseline(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.fundingBaseline[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useFundingShiftBaseline(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.fundingShiftBaseline[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useFundingPrev(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.fundingPrev[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useMomentumBaseline(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.momentumBaseline[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useOiChangeBaseline(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.oiChangeBaseline[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useOpenInterestOpen(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.openInterestOpen[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useKlineData(instId: string) {
  const read = useCallback(
    (state: ReturnType<typeof useTickerStore.getState>) =>
      state.klineData[instId],
    [instId],
  )
  const subscribe = useCallback(
    (listener: () => void) => subscribeInstField(read)(listener),
    [read],
  )
  const getSnapshot = useCallback(() => getInstFieldSnapshot(read), [read])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
