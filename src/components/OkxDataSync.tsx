import { useEffect } from 'react'

import useOkxInstrumentsUpdater from '../hooks/useOkxInstrumentsUpdater'
import useOkxKlinesUpdater from '../hooks/useOkxKlinesUpdater'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'
import useOkxTakerFlowUpdater from '../hooks/useOkxTakerFlowUpdater'
import useOkxFundingBaselineUpdater from '../hooks/useOkxFundingBaselineUpdater'
import useOkxMomentumBaselineUpdater from '../hooks/useOkxMomentumBaselineUpdater'
import useOkxOpenInterestUpdater from '../hooks/useOkxOpenInterestUpdater'
import useOkxAlerts from '../hooks/useOkxAlerts'
import { useOkxTickers } from '../hooks/useOkxTickers'
import { okxTickerActions } from '../okx/okxTickerActions'

export default function OkxDataSync() {
  useOkxInstrumentsUpdater()
  const { add, remove } = useOkxTickers()
  useOkxKlinesUpdater()
  const { updateRatioByInstId } = useOkxRatioUpdater()
  const { updateTakerFlowByInstId } = useOkxTakerFlowUpdater()
  const { updateFundingBaselineByInstId } = useOkxFundingBaselineUpdater()
  const { updateMomentumBaselineByInstId } = useOkxMomentumBaselineUpdater()
  const { updateOpenInterestOpenByInstId } = useOkxOpenInterestUpdater()
  useOkxAlerts()

  useEffect(() => {
    okxTickerActions.add = async (instId: string) => {
      await add(instId)
      await updateRatioByInstId(instId)
      await updateTakerFlowByInstId(instId)
      await updateFundingBaselineByInstId(instId)
      await updateMomentumBaselineByInstId(instId)
      await updateOpenInterestOpenByInstId(instId)
    }
    okxTickerActions.remove = remove
  }, [
    add,
    remove,
    updateRatioByInstId,
    updateTakerFlowByInstId,
    updateFundingBaselineByInstId,
    updateMomentumBaselineByInstId,
    updateOpenInterestOpenByInstId,
  ])

  return null
}
