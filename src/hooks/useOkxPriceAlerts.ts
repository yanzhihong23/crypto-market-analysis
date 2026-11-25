import { useEffect } from 'react'

import { subscribeOkxLivePrice } from '../store/okxRealtimeTicker'
import { useAlertStore } from '../store/useAlertStore'
import { openOkxDetail } from '../store/useOkxDetailStore'
import { beep, isAway, showNotification } from '../utils/alarm'
import { formatNumber } from '../utils'
import { currentMessages } from '../i18n'

/**
 * Evaluates user-defined target price rules directly off arriving websocket
 * ticks so alerts fire promptly even when the tab is hidden and visual ticker
 * flushes are paused. Triggered rules are one-shot and flow through the exact
 * same bell, tape, notification and sound channels as statistical alerts.
 */
export default function useOkxPriceAlerts() {
  useEffect(() => {
    return subscribeOkxLivePrice((instId, last) => {
      const state = useAlertStore.getState()
      if (!state.priceRules.length) return

      const matched = state.priceRules.filter(
        (rule) =>
          rule.instId === instId &&
          (rule.direction === 'above'
            ? last >= rule.price
            : last <= rule.price),
      )
      if (!matched.length) return

      const t = currentMessages()
      const now = Date.now()
      const symbol = instId.split('-')[0]
      const lastText = formatNumber(last, 8)

      for (const rule of matched) {
        const targetText = formatNumber(rule.price, 8)
        const headline = t.priceAlert.triggeredHeadline(
          rule.direction === 'above',
          targetText,
        )
        const detail = [
          t.priceAlert.triggeredPrice(lastText),
          rule.note ? rule.note : null,
        ]
          .filter(Boolean)
          .join(' · ')

        state.removePriceRule(rule.id)
        state.push({
          id: `${rule.id}-${now}`,
          instId,
          at: now,
          headline,
          reasons: [
            {
              kind: 'price-level',
              label: `${rule.direction === 'above' ? '≥' : '≤'} ${targetText}`,
              detail,
            },
          ],
        })

        const { notificationsEnabled, soundEnabled, quietWhenPresent } =
          useAlertStore.getState()

        if (quietWhenPresent && !isAway()) continue

        if (notificationsEnabled) {
          showNotification(`${symbol} — ${headline}`, detail, rule.id, () =>
            openOkxDetail(instId),
          )
        }
        if (soundEnabled) beep()
      }
    })
  }, [])
}
