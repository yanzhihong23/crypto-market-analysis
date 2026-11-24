import { useEffect } from 'react'

import useOkxInstrumentsUpdater from '../hooks/useOkxInstrumentsUpdater'
import useOkxKlinesUpdater from '../hooks/useOkxKlinesUpdater'
import useOkxRatioUpdater from '../hooks/useOkxRatioUpdater'
import useOkxTakerFlowUpdater from '../hooks/useOkxTakerFlowUpdater'
import useOkxDivergenceUpdater from '../hooks/useOkxDivergenceUpdater'
import useOkxFundingBaselineUpdater from '../hooks/useOkxFundingBaselineUpdater'
import useOkxMomentumBaselineUpdater from '../hooks/useOkxMomentumBaselineUpdater'
import useOkxDailyStatsUpdater from '../hooks/useOkxDailyStatsUpdater'
import useOkxOpenInterestUpdater from '../hooks/useOkxOpenInterestUpdater'
import useOkxAlerts from '../hooks/useOkxAlerts'
import { useOkxTickers } from '../hooks/useOkxTickers'
import { okxTickerActions } from '../okx/okxTickerActions'
import { settleWithConcurrency } from '../utils/settleWithConcurrency'

/** Cap concurrent REST fills for one newly added symbol. */
const ADD_REST_CONCURRENCY = 3

export default function OkxDataSync() {
  useOkxInstrumentsUpdater()
  const { add, remove } = useOkxTickers()
  useOkxKlinesUpdater()
  const { updateRatioByInstId } = useOkxRatioUpdater()
  const { updateTakerFlowByInstId } = useOkxTakerFlowUpdater()
  const { updateDivergenceByInstId } = useOkxDivergenceUpdater()
  const { updateFundingBaselineByInstId } = useOkxFundingBaselineUpdater()
  const { updateMomentumBaselineByInstId } = useOkxMomentumBaselineUpdater()
  const { updateDailyStatsByInstId } = useOkxDailyStatsUpdater()
  const { updateOpenInterestOpenByInstId } = useOkxOpenInterestUpdater()
  useOkxAlerts()

  useEffect(() => {
    okxTickerActions.add = async (instId: string) => {
      // WS subscribe returns once the message is sent (or no-ops if the socket
      // is down — the next open resubscribes the whole watchlist).
      await add(instId)

      // REST fills chips as each field lands (`common.missing` until then).
      // Do not hold this action open for the whole suite: seven serial awaits
      // left half-empty cards for a long stretch and queued rapid adds.
      void settleWithConcurrency(
        [
          () => updateRatioByInstId(instId),
          () => updateTakerFlowByInstId(instId),
          () => updateDivergenceByInstId(instId),
          () => updateFundingBaselineByInstId(instId),
          () => updateMomentumBaselineByInstId(instId),
          () => updateDailyStatsByInstId(instId),
          () => updateOpenInterestOpenByInstId(instId),
        ],
        ADD_REST_CONCURRENCY,
      )
    }
    okxTickerActions.remove = remove
  }, [
    add,
    remove,
    updateRatioByInstId,
    updateTakerFlowByInstId,
    updateDivergenceByInstId,
    updateFundingBaselineByInstId,
    updateMomentumBaselineByInstId,
    updateDailyStatsByInstId,
    updateOpenInterestOpenByInstId,
  ])

  return null
}
