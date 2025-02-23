import { useEffect } from 'react'

import { fetchOkxInstruments } from '../apis/okx'
import { useTickerStore } from '../store/useTickerStore'

export default function useOkxInstrumentsUpdater() {
  const instruments = useTickerStore((state) => state.instruments)
  const setInstruments = useTickerStore((state) => state.setInstruments)

  useEffect(() => {
    fetchOkxInstruments().then((instruments) => {
      setInstruments(
        instruments.filter((instrument) => instrument.settleCcy === 'USDT'),
      )
    })
  }, [])

  return instruments
}
