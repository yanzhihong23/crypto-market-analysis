import axios, { AxiosInstance, AxiosResponse } from 'axios'

const http: AxiosInstance = axios.create({
  baseURL: 'https://fapi.binance.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.response.use((res: AxiosResponse) => {
  return res.data
})

interface Params {
  symbol: string
  interval?: string
  period?: string
  limit: number
}

export interface Ratio {
  symbol: string
  longAccount: string
  longShortRatio: string
  shortAccount: string
  timestamp: number
  [key: string]: string | number
}

/**
 *
 * @param params
 * @param params.symbol eg. BTCUSDT
 * @param params.period eg. 15m
 * @param params.limit eg. 96
 * @returns
 */
export const fetchBinanceRatio = async ({
  symbol,
  period = '15m',
  limit = 1,
}: {
  symbol: string
  period?: string
  limit?: number
}): Promise<Ratio[]> => {
  return http.get('/futures/data/globalLongShortAccountRatio', {
    params: {
      symbol: symbol.toUpperCase(),
      period,
      limit,
    },
  })
}

export interface ExchangeInfo {
  symbols: { symbol: string }[]
}

export const fetchBinanceExchangeInfo = (): Promise<ExchangeInfo> => {
  return http.get('/fapi/v1/exchangeInfo')
}

type Kline = [
  openTime: number,
  open: string,
  high: string,
  low: string,
  close: string,
  closeTime: number,
  trades: number,
  takerBaseVolume: string,
  takerQuoteVolume: string,
]

export const fetchBinanceKlines = (params: Params): Promise<Kline[]> => {
  return http.get('fapi/v1/klines', { params })
}

export interface OpenInterestHist {
  symbol: string
  sumOpenInterest: string
  sumOpenInterestValue: string
  timestamp: string
}

export const fetchBinanceOpenInterestHist = (
  params: Params,
): Promise<OpenInterestHist[]> => {
  return http.get('/futures/data/openInterestHist', { params })
}
