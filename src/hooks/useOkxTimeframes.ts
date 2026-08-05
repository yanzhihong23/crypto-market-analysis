import { useEffect, useMemo, useState } from 'react'

import { fetchOkxKlines } from '../apis'
import { useMessages } from '../i18n'
import { OkxKline } from '../types/okx'
import {
  TIMEFRAMES,
  TIMEFRAME_BARS,
  type TimeframeRead,
  timeframeReadOf,
} from '../utils/timeframes'

import useOkxTicker from './useOkxTicker'

export interface Timeframes {
  reads: TimeframeRead[]
  loading: boolean
  failed: boolean
}

interface Fetched {
  series: OkxKline[][]
  loading: boolean
  failed: boolean
}

/**
 * Four series, fetched when the dialog opens and not before.
 *
 * Per symbol on demand rather than on the board's polling loop, which is what
 * makes four requests affordable at all: a watchlist of thirty would be a
 * hundred and twenty of them a pass, to answer a question nobody asks of a card.
 * They go straight to the exchange rather than through the statistics limiter —
 * candles are not one of its paths — so all four go at once.
 *
 * Not refreshed on a timer, and it does not need to be. What these candles are
 * for is the yardstick — the spread of a period's moves, the size of its bars,
 * how quiet the last stretch was — and none of that changes until a bar closes.
 * What does change is the move each period has made so far, and that is
 * measured against the live price rather than refetched, the same arrangement
 * the momentum baseline and its five-minute move have run on all along.
 *
 * Getting that division wrong is what this hook was doing: it handed the
 * readings only closed bars, so the `1d` row reported a move that had finished
 * up to a day earlier while the price at the top of the same dialog was live.
 *
 * The candles are held and the readings derived from them on the way out, so
 * that switching language rewrites the sentences without spending four requests
 * on candles that have not changed. This is the opposite of the bargain the
 * alert list makes, and both are right: a stored alert has to keep the words it
 * fired in, and a live panel has to be in the language being read.
 */
export default function useOkxTimeframes(
  instId: string,
  enabled: boolean,
): Timeframes {
  const t = useMessages()
  const [fetched, setFetched] = useState<Fetched>({
    series: [],
    loading: false,
    failed: false,
  })

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    setFetched((previous) => ({ ...previous, loading: true, failed: false }))

    void Promise.all(
      TIMEFRAMES.map((period) =>
        fetchOkxKlines({ instId, period, limit: TIMEFRAME_BARS }),
      ),
    )
      .then((series) => {
        if (cancelled) return
        setFetched({ series, loading: false, failed: false })
      })
      .catch((error) => {
        console.error('Failed to fetch the timeframe candles:', error)
        if (cancelled) return
        setFetched({ series: [], loading: false, failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [instId, enabled])

  const last = Number(useOkxTicker(instId).last)

  const reads = useMemo(
    () =>
      fetched.series.length
        ? TIMEFRAMES.map((period, index) =>
            timeframeReadOf(period, fetched.series[index], last, t),
          )
        : [],
    [fetched.series, last, t],
  )

  return { reads, loading: fetched.loading, failed: fetched.failed }
}
