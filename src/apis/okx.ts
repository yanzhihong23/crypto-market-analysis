import { proxyGet } from './util'
import urlcat from 'urlcat'

const baseUrl = 'https://www.okx.com'

type OkxRatio = [ts: string, ratio: string]

interface RatioResponse {
  code: string
  data: OkxRatio[]
  msg: string
}

export const fetchOkxRatio = ({
  coin,
  period = '5m'
}: {
  coin: string
  period: '5m' | '1H' | '1D'
}): Promise<RatioResponse> => {
  const url = urlcat(
    baseUrl,
    '/api/v5/rubik/stat/contracts/long-short-account-ratio',
    { ccy: coin.toUpperCase(), period }
  )

  return proxyGet(url)
}
