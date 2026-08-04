import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxContractRatio, fetchOkxTopTraderPositionRatio } from '../apis'
import type { OkxRatio } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { baselineOf, deviationFrom } from '../utils/signals'

const POLL_INTERVAL_MS = 1000 * 60 * 5

/**
 * How far apart the money and the show of hands are sitting, against how far
 * apart they usually sit.
 *
 * The board already carries what everybody holds. What it could not say is
 * whether the accounts holding the most agree with them, and that is the pair
 * worth watching: the crowd figure counts heads and the elite figure weighs
 * size, so when they part it is the people with something at stake taking the
 * other side rather than the same accounts described twice.
 *
 * As a difference of logs, because these are ratios: a crowd at 2.0 against
 * elites at 1.0 is the same disagreement as 1.0 against 0.5, and only in logs
 * does it come out as the same number. The level of that gap is per instrument
 * and nothing like zero — BTC sits around -0.47 and DOGE around -1.81, because
 * heads and size are not the same measure and the crowd is structurally the
 * longer of the two. So it is the departure from this contract's own gap that is
 * the reading, which is what the baseline is for.
 */
export default function useOkxDivergenceUpdater() {
  const setDivergence = useTickerStore((state) => state.setDivergence)
  const instIds = useTickerStore((state) => state.instIds)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})

  const updateByInstId = useCallback(
    async (instId: string) => {
      const divergence = useTickerStore.getState().divergence
      if (
        divergence[instId]?.updatedAt &&
        divergence[instId].updatedAt > Date.now() - POLL_INTERVAL_MS
      ) {
        return
      }

      // In parallel, and paired by timestamp rather than by position: the two
      // endpoints publish independently and their newest rows are routinely a
      // bar apart, so lining them up by index would compare each bar with the
      // one before it on half the polls.
      const [crowd, elite] = await Promise.all([
        fetchOkxContractRatio({ instId, period: '5m' }),
        fetchOkxTopTraderPositionRatio({ instId, period: '5m' }),
      ])
      if (!crowd?.length || !elite?.length) return

      const eliteAt = new Map(elite.map(([ts, ratio]: OkxRatio) => [ts, ratio]))
      const gaps: number[] = []
      for (const [ts, crowdRatio] of crowd) {
        const eliteRatio = Number(eliteAt.get(ts))
        if (!(eliteRatio > 0) || !(Number(crowdRatio) > 0)) continue
        gaps.push(Math.log(eliteRatio) - Math.log(Number(crowdRatio)))
      }
      if (!gaps.length) return

      // Newest first out of the endpoint and so newest first here: the head is
      // where the two stand now, and everything behind it is how far apart they
      // have been standing.
      const [gap, ...history] = gaps
      setDivergence(instId, gap, deviationFrom(gap, baselineOf(history)))
    },
    [setDivergence],
  )

  const updateAll = useCallback(async () => {
    try {
      for (const instId of instIds) {
        await updateByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch the crowd and elite ratios:', error)
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      void updateAllRef.current()
    }, POLL_INTERVAL_MS)
  }, [instIds, updateByInstId])

  updateAllRef.current = updateAll

  useEffect(() => {
    void updateAllRef.current()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { updateDivergenceByInstId: updateByInstId }
}
