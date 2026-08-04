/**
 * One instrument's readings, gathered from the three places they live.
 *
 * They live in three places for good reasons — the fast ones stay out of the
 * persisted store, the slow yardsticks stay in it, the five-minute buffer is its
 * own thing — and a caller that had to know which was which would be a caller
 * that could get it wrong. Both callers there are come through here instead, so
 * the ring a card draws and the alert that interrupts you are computed from
 * identical inputs by definition rather than by review.
 */

import { SignalInput } from '../utils/detectors'

import {
  boardMedianPricePercent,
  getOkxIndexPrice,
  getOkxSeriesChange,
  indexInstIdOf,
} from './okxRealtimeSeries'
import { getOkxSpread } from './okxRealtimeSpread'
import { getOkxTickerSnapshot } from './okxRealtimeTicker'
import { useTickerStore } from './useTickerStore'

export function readSignalInput(
  instId: string,
  {
    boardPercent,
    now = Date.now(),
  }: { boardPercent?: number | null; now?: number } = {},
): SignalInput {
  const state = useTickerStore.getState()
  const ticker = getOkxTickerSnapshot(instId)
  const change = getOkxSeriesChange(instId)
  const spread = getOkxSpread(instId)

  return {
    last: Number(ticker?.last),
    high24h: Number(ticker?.high24h),
    low24h: Number(ticker?.low24h),
    klines: state.klineData[instId],
    pricePercent: change?.pricePercent,
    oiPercent: change?.oiPercent,
    // Taken over the board when the caller has not already done it once for the
    // whole pass, which is the difference between a sort per symbol and one sort.
    boardPercent: boardPercent ?? boardMedianPricePercent(state.instIds),
    momentumBaseline: state.momentumBaseline[instId],
    coil: state.coil[instId],
    oiChangeBaseline: state.oiChangeBaseline[instId],
    ratioDeviation: state.ratio[instId]?.deviation,
    divergenceDeviation: state.divergence[instId]?.deviation,
    takerImbalance: state.takerFlow[instId]?.imbalance,
    takerDeviation: state.takerFlow[instId]?.deviation,
    spreadBps: spread?.bps,
    spreadBaseline: spread?.baseline,
    fundingRate: state.fundingRate[instId],
    fundingBaseline: state.fundingBaseline[instId],
    fundingShiftBaseline: state.fundingShiftBaseline[instId],
    fundingPrev: state.fundingPrev[instId],
    indexPrice: getOkxIndexPrice(indexInstIdOf(instId)),
    now,
  }
}
