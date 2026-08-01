import { useEffect } from 'react'

import useOkxInstrumentsUpdater from '../hooks/useOkxInstrumentsUpdater'
import useOkxKlinesUpdater from '../hooks/useOkxKlinesUpdater'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'
import useOkxFundingBaselineUpdater from '../hooks/useOkxFundingBaselineUpdater'
import useOkxOpenInterestUpdater from '../hooks/useOkxOpenInterestUpdater'
import { useOkxTickers } from '../hooks/useOkxTickers'
import { okxTickerActions } from '../okx/okxTickerActions'

export default function OkxDataSync() {
  useOkxInstrumentsUpdater()
  const { add, remove } = useOkxTickers()
  useOkxKlinesUpdater()
  const { updateRatioByInstId } = useOkxRatioUpdater()
  const { updateFundingBaselineByInstId } = useOkxFundingBaselineUpdater()
  const { updateOpenInterestOpenByInstId } = useOkxOpenInterestUpdater()

  useEffect(() => {
    okxTickerActions.add = async (instId: string) => {
      await add(instId)
      await updateRatioByInstId(instId)
      await updateFundingBaselineByInstId(instId)
      await updateOpenInterestOpenByInstId(instId)
    }
    okxTickerActions.remove = remove
  }, [
    add,
    remove,
    updateRatioByInstId,
    updateFundingBaselineByInstId,
    updateOpenInterestOpenByInstId,
  ])

  return null
}
