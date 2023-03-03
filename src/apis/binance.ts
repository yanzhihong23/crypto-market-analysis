import axios, { AxiosInstance } from 'axios'

const http: AxiosInstance = axios.create({
  baseURL: 'https://fapi.binance.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

interface Ratio {
  symbol: string
  longAccount: string
  longShortRatio: string
  shortAccount: string
  timestamp: number
}

/**
 *
 * @param params
 * @param params.symbol eg. BTCUSDT
 * @returns
 */
export const fetchBinanceRatio = async ({
  symbol,
  period = '15m',
  limit = 1
}: {
  symbol: string
  period?: string
  limit?: number
}): Promise<Ratio[]> => {
  return http.get('/futures/data/globalLongShortAccountRatio', {
    params: {
      symbol: symbol.toUpperCase(),
      period,
      limit
    }
  })
}
