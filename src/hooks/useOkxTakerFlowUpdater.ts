import { useCallback, useEffect, useRef } from 'react'

import { fetchOkxTakerVolume } from '../apis'
import type { OkxTakerVolumeRow } from '../apis'
import { useTickerStore } from '../store/useTickerStore'
import { baselineOf, deviationFrom, medianOf } from '../utils/signals'

const POLL_INTERVAL_MS = 1000 * 60 * 5

/**
 * How much of a normal bar's takers the forming bar has to have seen before its
 * split is worth reading. Twenty seconds into a five-minute bar the split is
 * whatever the last three trades did, and every instrument on the board would
 * take turns reporting a hundred percent of one side. The same fifth of a bar
 * the volume surge waits for, for the same reason.
 */
const MIN_FORMING_SHARE = 0.2

/** Signed share of the bar's market orders: +1 all buying, -1 all selling. */
const imbalanceOf = ([, sell, buy]: OkxTakerVolumeRow) => {
  const total = Number(sell) + Number(buy)
  return total > 0 ? (Number(buy) - Number(sell)) / total : NaN
}

const totalOf = ([, sell, buy]: OkxTakerVolumeRow) => Number(sell) + Number(buy)

/**
 * Which side has been crossing the spread, and whether that is unusual for this
 * instrument.
 *
 * The board could already say that a symbol had traded three times its usual
 * volume, and could not say who was doing it — the side was being inferred from
 * what the price did afterwards, which is a different claim. This measures it.
 *
 * Polled on the same five minutes as the account ratio and off the same kind of
 * endpoint: a hundred bars arrive in one request, so the yardstick is complete
 * on the first poll rather than after twenty minutes of watching.
 */
export default function useOkxTakerFlowUpdater() {
  const setTakerFlow = useTickerStore((state) => state.setTakerFlow)
  const instIds = useTickerStore((state) => state.instIds)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const updateAllRef = useRef<() => Promise<void>>(async () => {})

  const updateByInstId = useCallback(
    async (instId: string) => {
      const takerFlow = useTickerStore.getState().takerFlow
      if (
        takerFlow[instId]?.updatedAt &&
        takerFlow[instId].updatedAt > Date.now() - POLL_INTERVAL_MS
      ) {
        return
      }

      const res = await fetchOkxTakerVolume({ instId, period: '5m' })
      if (!res?.length) return

      // Newest first, and the head is the bar still forming. It is the reading
      // worth having when it has filled enough to mean anything, and the bar
      // behind it — five minutes stale at worst — when it has not.
      //
      // With nothing behind it to say what a full bar looks like, the forming
      // one is not trusted: falling back to zero there made the test `total >=
      // 0`, which every bar passes, so the one case the floor exists for was
      // the one case it was absent from.
      const typical = medianOf(res.slice(1).map(totalOf))
      const index =
        typical !== null && totalOf(res[0]) >= typical * MIN_FORMING_SHARE
          ? 0
          : 1

      const reading = res[index]
      if (!reading) return

      const imbalance = imbalanceOf(reading)
      if (!Number.isFinite(imbalance)) return

      // Everything behind the reading, so the split being judged is not also
      // part of what counts as normal.
      const history = res.slice(index + 1).map(imbalanceOf)
      setTakerFlow(
        instId,
        imbalance,
        deviationFrom(imbalance, baselineOf(history)),
      )
    },
    [setTakerFlow],
  )

  const updateAll = useCallback(async () => {
    try {
      for (const instId of instIds) {
        await updateByInstId(instId)
      }
    } catch (error) {
      console.error('Failed to fetch taker volume:', error)
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

  return { updateTakerFlowByInstId: updateByInstId }
}
