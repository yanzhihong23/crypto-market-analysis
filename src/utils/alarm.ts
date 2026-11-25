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
  /** Peak gain for this note. */
  gain: number
}

interface ChimeProfile {
  waveform: OscillatorType
  /** Harmonic multiplier for shimmer overtone, plus its relative level. */
  overtoneMultiplier: number
  overtoneRatio: number
  notes: readonly ChimeNote[]
}

/**
 * Deliberately contrasting profiles so you can tell which kind of alert fired
 * without looking at the screen:
 * - `signal`: warm mid-register descending two-note pulse ("worth a glance").
 * - `price`: bright high-register ascending bell cadence ("target hit now").
 */
const CHIMES: Record<AlertTone, ChimeProfile> = {
  signal: {
    waveform: 'sine',
    overtoneMultiplier: 1.5,
    overtoneRatio: 0.18,
    notes: [
      { freq: 698.46, at: 0, duration: 0.22, gain: 0.36 }, // F5
      { freq: 587.33, at: 0.16, duration: 0.34, gain: 0.34 }, // D5
      { freq: 698.46, at: 0.62, duration: 0.22, gain: 0.36 }, // F5
      { freq: 587.33, at: 0.78, duration: 0.4, gain: 0.34 }, // D5
    ],
  },
  price: {
    waveform: 'triangle',
    overtoneMultiplier: 2,
    overtoneRatio: 0.35,
    notes: [
      { freq: 1046.5, at: 0, duration: 0.16, gain: 0.36 }, // C6
      { freq: 1318.51, at: 0.09, duration: 0.16, gain: 0.38 }, // E6
      { freq: 1567.98, at: 0.18, duration: 0.18, gain: 0.4 }, // G6
      { freq: 2093.0, at: 0.28, duration: 0.34, gain: 0.42 }, // C7
      { freq: 1046.5, at: 0.72, duration: 0.16, gain: 0.36 }, // C6
      { freq: 1318.51, at: 0.81, duration: 0.16, gain: 0.38 }, // E6
      { freq: 1567.98, at: 0.9, duration: 0.18, gain: 0.4 }, // G6
      { freq: 2093.0, at: 1.0, duration: 0.44, gain: 0.42 }, // C7
    ],
  },
}

function scheduleNote(
  ctx: AudioContext,
  destination: AudioNode,
  startTime: number,
  profile: ChimeProfile,
  note: ChimeNote,
) {
  const t0 = startTime + note.at
  const tEnd = t0 + note.duration

  const fundamental = ctx.createOscillator()
  const overtone = ctx.createOscillator()
  const fundGain = ctx.createGain()
  const overGain = ctx.createGain()

  fundamental.type = profile.waveform
  fundamental.frequency.setValueAtTime(note.freq, t0)
  overtone.type = 'sine'
  overtone.frequency.setValueAtTime(note.freq * profile.overtoneMultiplier, t0)

  // Ramped attack & exponential decay rather than switched on: avoids clicks.
  fundGain.gain.setValueAtTime(0.0001, t0)
  fundGain.gain.exponentialRampToValueAtTime(note.gain, t0 + 0.01)
  fundGain.gain.exponentialRampToValueAtTime(0.0001, tEnd)

  overGain.gain.setValueAtTime(0.0001, t0)
  overGain.gain.exponentialRampToValueAtTime(
    note.gain * profile.overtoneRatio,
    t0 + 0.008,
  )
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
    const profile = CHIMES[tone]

    const play = () => {
      // Soft compressor prevents clipping if multiple symbols fire together.
      const compressor = ctx.createDynamicsCompressor()
      compressor.connect(ctx.destination)
      const now = ctx.currentTime + 0.01
      for (const note of profile.notes) {
        scheduleNote(ctx, compressor, now, profile, note)
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
