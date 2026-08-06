import { OkxInstrument, OkxKline, Period } from '../types/okx'

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

/**
 * Everyone holding this contract, longs over shorts, counted by account.
 *
 * The `ccy` endpoint the card's chip reads hands one figure to every contract on
 * a coin, and caps at a hundred rows where that one runs to two days. Both of
 * those are wrong for a divergence: the crowd has to be the crowd in *this*
 * contract, and it has to be stamped with the same bars the elite series is.
 */
export const fetchOkxContractRatio = ({
  instId,
  period = '5m',
}: {
  instId: string
  period?: RubikPeriod
}): Promise<OkxRatio[]> =>
  okxProxyGet('/rubik/stat/contracts/long-short-account-ratio-contract', {
    instId,
    period,
  })

/**
 * The top traders' positions, longs over shorts, weighted by size.
 *
 * Weighted rather than counted, which is what makes it worth putting next to the
 * one above: the crowd figure is a show of hands and this one is a show of
 * money, so the two disagreeing is a real disagreement and not two views of the
 * same accounts.
 */
export const fetchOkxTopTraderPositionRatio = ({
  instId,
  period = '5m',
}: {
  instId: string
  period?: RubikPeriod
}): Promise<OkxRatio[]> =>
  okxProxyGet(
    '/rubik/stat/contracts/long-short-position-ratio-contract-top-trader',
    { instId, period },
  )

/**
 * `[ts, sellVol, buyVol]`, newest first, stamped with the bar's open. Sell
 * before buy is the exchange's order and not a typo — it is checked against the
 * candles for the same bars, where the second column is the one that moves with
 * the return.
 */
export type OkxTakerVolumeRow = [ts: string, sellVol: string, buyVol: string]

/**
 * Which side the market orders were on, per bar. The candle series says how much
 * changed hands and the price says which way it went, but neither says who was
 * crossing the spread to make it happen — a bar that rose on seventy percent
 * sell-side takers is somebody being absorbed, not somebody buying.
 *
 * Contract-level rather than the `ccy` endpoint next to it, so a USDT perpetual
 * and a USDC one are not handed the same reading. The head row is the bar
 * currently forming; 100 rows of five minutes is a little over eight hours,
 * which is the same window the momentum baseline is taken over.
 */
export const fetchOkxTakerVolume = ({
  instId,
  period = '5m',
  limit = 100,
}: {
  instId: string
  period?: RubikPeriod
  limit?: number
}): Promise<OkxTakerVolumeRow[]> =>
  okxProxyGet('/rubik/stat/taker-volume-contract', { instId, period, limit })

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

/**
 * Candles, newest first, the newest of them still forming.
 *
 * No session cut. It used to take an `openTime` and paginate from that
 * session's open, which made the series a different length at every hour of the
 * day — and the statistics read off it need a fixed number of bars, not a
 * fixed starting point. Whoever wants a session slices for one.
 */
export const fetchOkxKlines = ({
  instId,
  period = Period.MINUTE_15,
  limit = 96,
}: {
  instId: string
  period?: Period
  /** Capped at 300 by the endpoint. */
  limit?: number
}): Promise<OkxKline[]> =>
  okxGet('/market/candles', { instId, bar: period, limit })
