import { useEffect } from 'react'

import useOkxInstrumentsUpdater from '../hooks/useOkxInstrumentsUpdater'
import useOkxKlinesUpdater from '../hooks/useOkxKlinesUpdater'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'
import { useOkxTickers } from '../hooks/useOkxTickers'
import { okxTickerActions } from '../okx/okxTickerActions'

export default function OkxDataSync() {
  useOkxInstrumentsUpdater()
  const { add, remove } = useOkxTickers()
  useOkxKlinesUpdater()
  const { updateRatioByInstId } = useOkxRatioUpdater()

  useEffect(() => {
    okxTickerActions.add = async (instId: string) => {
      await add(instId)
      await updateRatioByInstId(instId)
    }
    okxTickerActions.remove = remove
  }, [add, remove, updateRatioByInstId])

  return null
}
