/**
 * How an alert reaches someone who is not looking at the page. Both channels
 * are deliberately quiet by default: a board that pings on its own the first
 * time you open it is a board people mute.
 */

/**
 * The window is "away" whenever it is not the thing being looked at. Tab
 * visibility alone is not enough — a board left open on a second monitor behind
 * the editor is visible by that measure and unwatched by any other.
 */
export function isAway() {
  return document.visibilityState === 'hidden' || !document.hasFocus()
}

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission():
  NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported' as const
  return Notification.requestPermission()
}

export function showNotification(title: string, body: string, tag: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  // Tagged per instrument so a symbol that fires again replaces its own
  // notification rather than stacking a second one behind it.
  new Notification(title, { body, tag, icon: '/logo.svg' })
}

let audioContext: AudioContext | null = null

/**
 * A short tone rather than an audio file: nothing to ship, nothing to fail to
 * load, and it cannot be mistaken for a notification from another app. Built on
 * demand because a context created before a user gesture starts out suspended.
 */
export function beep() {
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()

    const now = audioContext.currentTime
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now)
    // Ramped rather than switched on: a square edge on a sine reads as a click.
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

    oscillator.connect(gain).connect(audioContext.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.31)
  } catch (error) {
    console.error('Failed to play the alert tone:', error)
  }
}
