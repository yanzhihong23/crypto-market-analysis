import { readSignalInput } from '../store/okxSignalInput'
import { collectSignals } from '../utils/detectors'
import { flagStateOf } from '../utils/signals'

import { useOkxSeriesChange } from './useOkxSeries'
import {
  useFundingBaseline,
  useFundingPrev,
  useFundingRate,
  useFundingShiftBaseline,
  useKlineData,
  useMomentumBaseline,
  useOiChangeBaseline,
  useRatio,
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
 */
export default function useOkxSignals(instId: string) {
  useKlineData(instId)
  useRatio(instId)
  useFundingRate(instId)
  useFundingBaseline(instId)
  useFundingShiftBaseline(instId)
  useFundingPrev(instId)
  useMomentumBaseline(instId)
  useOiChangeBaseline(instId)
  useOkxSeriesChange(instId)

  const signals = collectSignals(readSignalInput(instId))
  return { signals, flag: flagStateOf(signals) }
}
