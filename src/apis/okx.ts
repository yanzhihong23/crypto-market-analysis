import { OkxInstrument, OkxKline, OpenTime, Period } from '../types/okx'
import { sessionStartMs } from '../utils/session'

import { okxGet, okxProxyGet } from './util'

/** The three sample sizes every rubik statistics endpoint is cut to. */
export type RubikPeriod = '5m' | '1H' | '1D'

export type OkxRatio = [ts: string, ratio: string]

export const fetchOkxRatio = ({
  coin,
  period = '5m',
}: {
  coin: string
  period: RubikPeriod
}): Promise<OkxRatio[]> =>
  okxProxyGet('/rubik/stat/contracts/long-short-account-ratio', {
    ccy: coin.toUpperCase(),
    period,
  })

type OkxFundingRateHistoryRow = {
  instId: string
  fundingRate: string
  realizedRate: string
  fundingTime: string
}

/**
 * Realised funding, newest first. The live channel only carries the current
 * rate, so this is what says whether that rate is normal for this instrument:
 * 100 rows at one settlement every eight hours is roughly a month.
 */
export const fetchOkxFundingRateHistory = ({
  instId,
  limit = 100,
}: {
  instId: string
  limit?: number
}): Promise<OkxFundingRateHistoryRow[]> =>
  okxGet('/public/funding-rate-history', { instId, limit })

/** `[ts, oi, oiCcy, oiUsd]`, newest first. */
export type OkxOpenInterestHistoryRow = [
  ts: string,
  oi: string,
  oiCcy: string,
  oiUsd: string,
]

/**
 * Open interest per settlement bar, newest first. The live channel carries only
 * the current figure, and a level on its own says nothing — it is the change
 * across the session that says whether a price move is new money or an exit.
 *
 * Hourly, because the reference point is a session open and every open the
 * board offers falls on the hour. 100 rows is a little over four days, which
 * covers the longest window (24h) with room for a gap in the series.
 *
 * The endpoint caps at 100 rows whatever is asked for, so a window longer than
 * 100 bars of the requested period has to be asked for at a coarser one.
 */
export const fetchOkxOpenInterestHistory = ({
  instId,
  period = '1H',
  limit = 100,
}: {
  instId: string
  period?: RubikPeriod
  limit?: number
}): Promise<OkxOpenInterestHistoryRow[]> =>
  okxProxyGet('/rubik/stat/contracts/open-interest-history', {
    instId,
    period,
    limit,
  })

export const fetchOkxInstruments = (): Promise<OkxInstrument[]> =>
  okxGet('/public/instruments', { instType: 'SWAP' })

export const fetchOkxKlines = ({
  instId,
  period = Period.MINUTE_15,
  openTime,
  limit = 96,
}: {
  instId: string
  period?: Period
  openTime?: OpenTime
  /** Capped at 300 by the endpoint. */
  limit?: number
}): Promise<OkxKline[]> => {
  // 减去1秒，确保获取到开盘时间的k线
  const before =
    openTime && openTime !== OpenTime.OPEN24H
      ? sessionStartMs(openTime) - 1000
      : undefined

  return okxGet('/market/candles', { instId, bar: period, before, limit })
}
