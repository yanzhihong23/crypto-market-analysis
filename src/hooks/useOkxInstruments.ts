import { useEffect, useState } from 'react'

import { fetchOkxInstruments } from '../apis/okx'
import { OkxInstrument } from '../types/okx'

export const useOkxInstruments = () => {
  const [instruments, setInstruments] = useState<OkxInstrument[]>([])

  useEffect(() => {
    fetchOkxInstruments().then((instruments) => {
      setInstruments(instruments)
    })
  }, [])

  return instruments
}
