import { readSignalInput } from '../store/okxSignalInput'
import { readBackdrop } from '../store/okxBackdropInput'
import { useTickerStore } from '../store/useTickerStore'
import { collectSignals } from '../utils/detectors'
import { flagStateOf } from '../utils/signals'
import { useMessages } from '../i18n'

import { useOkxIndexPrice, useOkxSeriesChange } from './useOkxSeries'
import { useOkxSpreadRead } from './useOkxSpread'
import { useOkxLiquidationRead } from './useOkxLiquidation'
import { useOkxOpenInterest } from './useOkxOpenInterest'
import useOkxTicker from './useOkxTicker'
import {
  useBetaBaseline,
  useCoil,
  useDailyStats,
  useDivergence,
  useFundingBaseline,
  useFundingPrev,
  useFundingRate,
  useFundingShiftBaseline,
  useKlineData,
  useMomentumBaseline,
  useOiChangeBaseline,
  useRatio,
  useTakerFlow,
} from './useTickerField'

/**
 * Everything unusual about one instrument, and whether it adds up to a ring.
 *
 * The calls below are subscriptions and nothing else — their values are read
 * back off the store by `readSignalInput`, which is also how the alert pass gets
 * them. Assembling the inputs in one place is what keeps the ring and the alert
 * from being two implementations of the same rule, and taking the subscriptions
 * here is what makes a card redraw when one of those inputs moves.
 */
export default function useOkxSignals(instId: string) {
  const t = useMessages()

  useOkxTicker(instId)
  useOkxIndexPrice(instId)
  useDailyStats(instId)
  useKlineData(instId)
  useRatio(instId)
  useDivergence(instId)
  useTakerFlow(instId)
  useFundingRate(instId)
  useFundingBaseline(instId)
  useFundingShiftBaseline(instId)
  useFundingPrev(instId)
  useMomentumBaseline(instId)
  useBetaBaseline(instId)
  useCoil(instId)
  useOiChangeBaseline(instId)
  useOkxSeriesChange(instId)
  useOkxSpreadRead(instId)
  useOkxLiquidationRead(instId)
  useOkxOpenInterest(instId)
  // Recompute relative strength when a card moves to another peer group.
  useTickerStore((state) => state.symbolGroup[instId])
  useTickerStore((state) => state.groups)

  const signals = collectSignals(readSignalInput(instId), t)
  const backdropReadings = readBackdrop(instId, t).readings
  return { signals, flag: flagStateOf(signals, t, backdropReadings) }
}
