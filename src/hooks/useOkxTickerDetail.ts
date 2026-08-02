import { useEffect, useState } from 'react'

import {
  fetchOkxFundingRateHistory,
  fetchOkxKlines,
  fetchOkxOpenInterestHistory,
  fetchOkxRatio,
  type RubikPeriod,
} from '../apis'
import { Period } from '../types/okx'

export enum DetailWindow {
  DAY = '24H',
  THREE_DAYS = '3D',
  MONTH = '30D',
}

const HOUR_MS = 1000 * 60 * 60
const DAY_MS = HOUR_MS * 24

/**
 * One window covers every series it governs, so those charts are always
 * describing the same stretch of time. Each series is asked for at the finest
 * sampling that covers the window: the statistics endpoints cap at 100 rows
 * whatever is requested, so a longer window has to be asked for coarser rather
 * than simply asked for more of.
 */
const WINDOWS: Record<
  DetailWindow,
  {
    ms: number
    klinePeriod: Period
    klineLimit: number
    ratioPeriod: RubikPeriod
    openInterestPeriod: RubikPeriod
    /** Axis labels only need what changes across the window. */
    tickFormat: string
  }
> = {
  [DetailWindow.DAY]: {
    ms: DAY_MS,
    klinePeriod: Period.MINUTE_15,
    klineLimit: 96,
    ratioPeriod: '5m',
    openInterestPeriod: '1H',
    tickFormat: 'HH:mm',
  },
  [DetailWindow.THREE_DAYS]: {
    ms: DAY_MS * 3,
    klinePeriod: Period.HOUR_1,
    klineLimit: 72,
    ratioPeriod: '1H',
    openInterestPeriod: '1H',
    tickFormat: 'dd HH:mm',
  },
  [DetailWindow.MONTH]: {
    ms: DAY_MS * 30,
    klinePeriod: Period.HOUR_4,
    klineLimit: 180,
    ratioPeriod: '1D',
    openInterestPeriod: '1D',
    tickFormat: 'MM-dd',
  },
}

/**
 * Funding settles on the exchange's own schedule — every eight hours on most
 * instruments, every four on some — so it is the one series the window does not
 * govern. Thirty settlements is ten days on the slow schedule, which is enough
 * to see whether the current rate is a departure.
 */
const FUNDING_SETTLEMENTS = 30

/** Settlements are far enough apart to name by the hour they landed on. */
export const FUNDING_TICK_FORMAT = 'MM-dd HH:mm'

export interface SeriesPoint {
  // Recharts is addressed by key name, so the chart's prop type is an index
  // signature; the two named fields are what this app's charts actually use.
  [key: string]: number
  /**
   * The raw milliseconds, and the x value itself rather than a label: the three
   * window charts sample at different rates, so a cursor shared between them
   * has to be carried across by time and not by position in the array.
   */
  time: number
  value: number
}

export interface TickerDetail {
  price: SeriesPoint[]
  ratio: SeriesPoint[]
  funding: SeriesPoint[]
  openInterest: SeriesPoint[]
  /**
   * The pattern the series in this state are labelled with. It travels with
   * them so a window change cannot label the previous window's data with the
   * new window's format in the moment before the fetch lands.
   */
  tickFormat: string
  loading: boolean
  failed: boolean
}

const EMPTY: TickerDetail = {
  price: [],
  ratio: [],
  funding: [],
  openInterest: [],
  tickFormat: WINDOWS[DetailWindow.DAY].tickFormat,
  loading: false,
  failed: false,
}

/** Rows arrive newest first everywhere; charts read oldest to newest. */
const toSeries = (
  rows: Array<[ts: string, ...rest: string[]]>,
  valueIndex: number,
  since: number,
) =>
  rows
    .filter((row) => Number(row[0]) >= since)
    .map((row) => ({
      time: Number(row[0]),
      value: Number(row[valueIndex]),
    }))
    .reverse()

export default function useOkxTickerDetail(
  instId: string,
  detailWindow: DetailWindow,
  enabled: boolean,
) {
  const [detail, setDetail] = useState<TickerDetail>(EMPTY)

  useEffect(() => {
    if (!enabled) return

    const config = WINDOWS[detailWindow]
    const since = Date.now() - config.ms
    let cancelled = false

    setDetail((previous) => ({ ...previous, loading: true, failed: false }))

    // In parallel: four sequential round trips through the proxy is most of a
    // second of an empty dialog, and none of them depends on another.
    void Promise.all([
      fetchOkxKlines({
        instId,
        period: config.klinePeriod,
        limit: config.klineLimit,
      }),
      fetchOkxRatio({ coin: instId.split('-')[0], period: config.ratioPeriod }),
      fetchOkxFundingRateHistory({ instId, limit: FUNDING_SETTLEMENTS }),
      fetchOkxOpenInterestHistory({
        instId,
        period: config.openInterestPeriod,
      }),
    ])
      .then(([klines, ratio, funding, openInterest]) => {
        if (cancelled) return
        setDetail({
          // Close, index 4 of the candle.
          price: toSeries(klines ?? [], 4, since),
          ratio: toSeries(ratio ?? [], 1, since),
          // Settlements are their own window, and in the unit the card shows.
          funding: (funding ?? [])
            .map((row) => ({
              time: Number(row.fundingTime),
              value: Number(row.realizedRate || row.fundingRate) * 10000,
            }))
            .reverse(),
          // Coin rather than USD: a notional series rises with the price even
          // when not one contract has changed hands.
          openInterest: toSeries(openInterest ?? [], 2, since),
          tickFormat: config.tickFormat,
          loading: false,
          failed: false,
        })
      })
      .catch((error) => {
        console.error('Failed to fetch the ticker detail:', error)
        if (cancelled) return
        setDetail({ ...EMPTY, failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [instId, detailWindow, enabled])

  return detail
}
