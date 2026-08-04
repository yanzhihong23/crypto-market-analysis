import { readSignalInput } from '../store/okxSignalInput'
import { collectSignals } from '../utils/detectors'
import { flagStateOf } from '../utils/signals'
import { useMessages } from '../i18n'

import { useOkxSeriesChange } from './useOkxSeries'
import { useOkxSpreadRead } from './useOkxSpread'
import { useOkxLiquidationRead } from './useOkxLiquidation'
import { useOkxOpenInterest } from './useOkxOpenInterest'
import {
  useCoil,
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
 *
 * Not memoised: the whole set is a dozen pieces of arithmetic over a candle
 * summary that is itself cached, which is cheaper than the comparisons a
 * dependency list this wide would cost. The result is a fresh array every render
 * as a consequence, so it is a thing to read, not a thing to put in a
 * dependency list.
 *
 * That also means the sentences come out in whatever language is current
 * without anything having to invalidate them: switching language is a render,
 * and a render is when these are written.
 */
export default function useOkxSignals(instId: string) {
  const t = useMessages()

  useKlineData(instId)
  useRatio(instId)
  useDivergence(instId)
  useTakerFlow(instId)
  useFundingRate(instId)
  useFundingBaseline(instId)
  useFundingShiftBaseline(instId)
  useFundingPrev(instId)
  useMomentumBaseline(instId)
  useCoil(instId)
  useOiChangeBaseline(instId)
  useOkxSeriesChange(instId)
  useOkxSpreadRead(instId)
  useOkxLiquidationRead(instId)
  useOkxOpenInterest(instId)

  const signals = collectSignals(readSignalInput(instId), t)
  return { signals, flag: flagStateOf(signals, t) }
}
