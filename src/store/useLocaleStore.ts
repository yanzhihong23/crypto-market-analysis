import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { Locale } from '../i18n/locale'

interface LocaleStore {
  /**
   * Null until a language is picked, which is what lets the browser keep
   * deciding. Storing the resolved locale instead would freeze whatever the
   * browser happened to be set to on the first visit into a choice the reader
   * never made.
   */
  preference: Locale | null
  setPreference: (locale: Locale) => void
}

/** The page follows the browser's languages until this is set. */
export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      preference: null,
      setPreference: (preference: Locale) => set({ preference }),
    }),
    {
      name: 'locale',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
