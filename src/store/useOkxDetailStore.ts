import { create } from 'zustand'

/**
 * Which OKX perpetual currently has the detail dialog open, if any.
 *
 * Held here rather than inside each card so any surface that names a symbol —
 * the card itself, the alert bell, the bottom tape, or a desktop notification —
 * opens the same single dialog without pulling Recharts or the dialog into the
 * shell bundle.
 */
interface OkxDetailStore {
  instId: string | null
  open: (instId: string) => void
  close: () => void
  priceAlertInstId: string | null
  openPriceAlert: (instId: string) => void
  closePriceAlert: () => void
}

export const useOkxDetailStore = create<OkxDetailStore>()((set) => ({
  instId: null,
  open: (instId) => set({ instId }),
  close: () => set({ instId: null }),
  priceAlertInstId: null,
  openPriceAlert: (priceAlertInstId) => set({ priceAlertInstId }),
  closePriceAlert: () => set({ priceAlertInstId: null }),
}))

export const openOkxDetail = (instId: string) =>
  useOkxDetailStore.getState().open(instId)

export const closeOkxDetail = () => useOkxDetailStore.getState().close()

export const openOkxPriceAlert = (instId: string) =>
  useOkxDetailStore.getState().openPriceAlert(instId)

export const closeOkxPriceAlert = () =>
  useOkxDetailStore.getState().closePriceAlert()
