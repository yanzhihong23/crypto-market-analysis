import { pathcat } from 'pathcat'

import { OkxInstrument, OkxKline, OpenTime, Period } from '../types/okx'

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
  const now = new Date()
  const currentHour = now.getUTCHours()

  let before =
    openTime === OpenTime.UTC0
      ? currentHour >= 0
        ? now.setUTCHours(0, 0, 0, 0)
        : new Date(now).setUTCHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000
      : openTime === OpenTime.UTC8
        ? currentHour >= 16
          ? now.setUTCHours(16, 0, 0, 0)
          : new Date(now).setUTCHours(16, 0, 0, 0) - 24 * 60 * 60 * 1000
        : undefined

  if (before) {
    before = before - 1000 // 减去1秒，确保获取到开盘时间的k线
  }

  const url = pathcat(baseUrl, '/api/v5/market/candles', {
    instId,
    bar: period,
    before,
    limit: 96,
  })

  return proxyGet(url)
}
