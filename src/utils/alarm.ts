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

export function showNotification(
  title: string,
  body: string,
  tag: string,
  onClick?: () => void,
) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  // Tagged per instrument so a symbol that fires again replaces its own
  // notification rather than stacking a second one behind it.
  const notification = new Notification(title, { body, tag, icon: '/logo.svg' })
  if (onClick) {
    notification.onclick = () => {
      window.focus()
      onClick()
      notification.close()
    }
  }
}

let audioContext: AudioContext | null = null

export type AlertTone = 'signal' | 'price'

interface ChimeNote {
  freq: number
  /** Start offset in seconds from the start of the chime. */
  at: number
  /** Ring duration in seconds. */
  duration: number
}

// A-major intervals (A5 / C#6 / E6): cuts through ambient room noise on both
// laptop and phone speakers without the harshness of a raw buzzer. Two pulses
// separated by a short beat so a single ping is never lost while typing.
const CHIMES: Record<AlertTone, readonly ChimeNote[]> = {
  signal: [
    { freq: 880, at: 0, duration: 0.24 },
    { freq: 1108.73, at: 0.13, duration: 0.34 },
    { freq: 880, at: 0.54, duration: 0.24 },
    { freq: 1108.73, at: 0.67, duration: 0.4 },
  ],
  // Three-note ascending triad, repeated once, so hitting a user-set price
  // target sounds immediately distinct from an automatic anomaly alert.
  price: [
    { freq: 880, at: 0, duration: 0.2 },
    { freq: 1108.73, at: 0.11, duration: 0.2 },
    { freq: 1318.51, at: 0.22, duration: 0.34 },
    { freq: 880, at: 0.64, duration: 0.2 },
    { freq: 1108.73, at: 0.75, duration: 0.2 },
    { freq: 1318.51, at: 0.86, duration: 0.44 },
  ],
}

function scheduleNote(
  ctx: AudioContext,
  destination: AudioNode,
  startTime: number,
  note: ChimeNote,
) {
  const t0 = startTime + note.at
  const tEnd = t0 + note.duration

  // Triangle fundamental carries gentle odd harmonics that stay audible on
  // small speakers (a bare sine at 0.12 was nearly silent); a quiet octave
  // sine overtone adds bell-like clarity.
  const fundamental = ctx.createOscillator()
  const overtone = ctx.createOscillator()
  const fundGain = ctx.createGain()
  const overGain = ctx.createGain()

  fundamental.type = 'triangle'
  fundamental.frequency.setValueAtTime(note.freq, t0)
  overtone.type = 'sine'
  overtone.frequency.setValueAtTime(note.freq * 2, t0)

  // Ramped attack & exponential decay rather than switched on: avoids clicks.
  fundGain.gain.setValueAtTime(0.0001, t0)
  fundGain.gain.exponentialRampToValueAtTime(0.36, t0 + 0.012)
  fundGain.gain.exponentialRampToValueAtTime(0.0001, tEnd)

  overGain.gain.setValueAtTime(0.0001, t0)
  overGain.gain.exponentialRampToValueAtTime(0.1, t0 + 0.01)
  overGain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.duration * 0.65)

  fundamental.connect(fundGain).connect(destination)
  overtone.connect(overGain).connect(destination)

  fundamental.start(t0)
  overtone.start(t0)
  fundamental.stop(tEnd + 0.02)
  overtone.stop(tEnd + 0.02)
}

/**
 * Synthesised multi-note chime rather than an audio file: nothing to ship,
 * nothing to fail to load, and distinct from generic OS notifications. Built
 * on demand because a context created before a user gesture starts suspended.
 */
export function beep(tone: AlertTone = 'signal') {
  try {
    audioContext ??= new AudioContext()
    const ctx = audioContext

    const play = () => {
      // Soft compressor prevents clipping if multiple symbols fire together.
      const compressor = ctx.createDynamicsCompressor()
      compressor.connect(ctx.destination)
      const now = ctx.currentTime + 0.01
      for (const note of CHIMES[tone]) {
        scheduleNote(ctx, compressor, now, note)
      }
    }

    if (ctx.state === 'suspended') {
      void ctx.resume().then(play)
    } else {
      play()
    }
  } catch (error) {
    console.error('Failed to play the alert tone:', error)
  }
}
