import { pathcat } from 'pathcat'

import { OkxInstrument, OkxKline, OpenTime, Period } from '../types/okx'
import { sessionStartMs } from '../utils/session'

import { proxyGet } from './util'

const baseUrl = 'https://www.okx.com'

type OkxRatio = [ts: string, ratio: string]

export const fetchOkxRatio = ({
  coin,
  period = '5m',
}: {
  coin: string
  period: '5m' | '1H' | '1D'
}): Promise<OkxRatio[]> => {
  const url = pathcat(
    baseUrl,
    '/api/v5/rubik/stat/contracts/long-short-account-ratio',
    { ccy: coin.toUpperCase(), period },
  )

  return proxyGet(url)
}

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
}): Promise<OkxFundingRateHistoryRow[]> => {
  const url = pathcat(baseUrl, '/api/v5/public/funding-rate-history', {
    instId,
    limit,
  })

  return proxyGet(url)
}

/** `[ts, oi, oiCcy, oiUsd]`, newest first. */
type OkxOpenInterestHistoryRow = [
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
 */
export const fetchOkxOpenInterestHistory = ({
  instId,
  period = '1H',
  limit = 100,
}: {
  instId: string
  period?: '5m' | '1H' | '1D'
  limit?: number
}): Promise<OkxOpenInterestHistoryRow[]> => {
  const url = pathcat(
    baseUrl,
    '/api/v5/rubik/stat/contracts/open-interest-history',
    {
      instId,
      period,
      limit,
    },
  )

  return proxyGet(url)
}

export const fetchOkxInstruments = (): Promise<OkxInstrument[]> => {
  const url = pathcat(baseUrl, '/api/v5/public/instruments?instType=SWAP')

  return proxyGet(url)
}

export const fetchOkxKlines = ({
  instId,
  period = Period.MINUTE_15,
  openTime,
}: {
  instId: string
  period?: Period
  openTime?: OpenTime
}): Promise<OkxKline[]> => {
  // 减去1秒，确保获取到开盘时间的k线
  const before =
    openTime && openTime !== OpenTime.OPEN24H
      ? sessionStartMs(openTime) - 1000
      : undefined

  const url = pathcat(baseUrl, '/api/v5/market/candles', {
    instId,
    bar: period,
    before,
    limit: 96,
  })

  return proxyGet(url)
}
