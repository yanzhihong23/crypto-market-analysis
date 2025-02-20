import urlcat from 'urlcat'

import { OkxInstrument } from '../types/okx'

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
  const url = urlcat(
    baseUrl,
    '/api/v5/rubik/stat/contracts/long-short-account-ratio',
    { ccy: coin.toUpperCase(), period },
  )

  return proxyGet(url)
}

export const fetchOkxInstruments = (): Promise<OkxInstrument[]> => {
  const url = urlcat(baseUrl, '/api/v5/public/instruments?instType=SWAP')

  return proxyGet(url)
}
