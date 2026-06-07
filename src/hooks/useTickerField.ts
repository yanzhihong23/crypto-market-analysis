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
