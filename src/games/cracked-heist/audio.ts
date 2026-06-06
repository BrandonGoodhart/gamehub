// Tiny Web Audio system: countdown beeps + ambient hacker-theme music loop.
// All sound runs through a single master gain so muting kills everything.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
let musicNodes: { osc: OscillatorNode; gain: GainNode }[] = []
let musicInterval: ReturnType<typeof setInterval> | null = null
let listeners = new Set<() => void>()

const STORAGE_KEY = 'crackedHeist:muted'

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  try {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new C()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.6
    master.connect(ctx.destination)
  } catch {
    ctx = null
  }
  return ctx
}

export function initAudio() {
  // Read saved mute state
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === '1') muted = true
  } catch {
    // ignore
  }
  ensureCtx()
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem(STORAGE_KEY, m ? '1' : '0')
  } catch {
    // ignore
  }
  const c = ensureCtx()
  if (master && c) {
    if (c.state === 'suspended') c.resume()
    master.gain.cancelScheduledValues(c.currentTime)
    master.gain.setTargetAtTime(m ? 0 : 0.6, c.currentTime, 0.05)
  }
  // Unmuting after page load: make sure the music has actually started
  if (!m) startMusic()
  listeners.forEach((cb) => cb())
}

export function toggleMute() {
  setMuted(!muted)
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// ---- Sound effects ----

function beep(frequency: number, duration = 0.12, type: OscillatorType = 'square', volume = 0.25) {
  const c = ensureCtx()
  if (!c || !master) return
  // Resume context if needed (browsers suspend until user gesture)
  if (c.state === 'suspended') c.resume()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = frequency
  const now = c.currentTime
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(volume, now + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(g).connect(master)
  osc.start(now)
  osc.stop(now + duration + 0.05)
}

export function sfxCountdown(value: number) {
  // 3 / 2 / 1 = low beep; 0 / "GO" = higher chord
  if (value > 0) beep(420, 0.15, 'square', 0.22)
  else {
    beep(660, 0.25, 'square', 0.28)
    beep(880, 0.32, 'sine', 0.18)
  }
}

export function sfxCorrect() {
  const c = ensureCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume()
  beep(587.33, 0.1, 'sine', 0.22) // D5
  setTimeout(() => beep(880, 0.18, 'sine', 0.22), 110) // A5
}

export function sfxWrong() {
  beep(150, 0.35, 'sawtooth', 0.18)
}

export function sfxWin() {
  beep(523.25, 0.18, 'sine', 0.25) // C5
  setTimeout(() => beep(659.25, 0.18, 'sine', 0.25), 180) // E5
  setTimeout(() => beep(783.99, 0.3, 'sine', 0.25), 360) // G5
}

// ---- Background music ----
// Loop: a low droning bass + slow arpeggio in A minor pentatonic.
// Hacker-ish vibe, no lyrics, sits softly under speech.

const ARP_NOTES = [220.0, 261.63, 329.63, 440.0, 329.63, 261.63] // A3, C4, E4, A4, E4, C4
const ARP_INTERVAL_MS = 700

export function startMusic() {
  const c = ensureCtx()
  if (!c || !master) return
  if (c.state === 'suspended') c.resume()
  if (musicNodes.length > 0) return // already playing

  // Drone
  const drone1 = c.createOscillator()
  drone1.type = 'sine'
  drone1.frequency.value = 110 // A2
  const drone1g = c.createGain()
  drone1g.gain.value = 0.05
  drone1.connect(drone1g).connect(master)
  drone1.start()
  musicNodes.push({ osc: drone1, gain: drone1g })

  const drone2 = c.createOscillator()
  drone2.type = 'triangle'
  drone2.frequency.value = 164.81 // E3
  const drone2g = c.createGain()
  drone2g.gain.value = 0.025
  drone2.connect(drone2g).connect(master)
  drone2.start()
  musicNodes.push({ osc: drone2, gain: drone2g })

  // Slow detune on drone2 for movement
  let detunePhase = 0
  const detuneTimer = setInterval(() => {
    detunePhase += 0.4
    if (!ctx || !drone2) return
    drone2.detune.setTargetAtTime(Math.sin(detunePhase) * 12, ctx.currentTime, 0.5)
  }, 800)

  // Arpeggio
  let i = 0
  musicInterval = setInterval(() => {
    if (!ctx || !master) return
    if (ctx.state === 'suspended') return
    const note = ARP_NOTES[i]
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = note
    const g = ctx.createGain()
    const now = ctx.currentTime
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.025, now + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
    osc.connect(g).connect(master)
    osc.start(now)
    osc.stop(now + 0.65)
    i = (i + 1) % ARP_NOTES.length
  }, ARP_INTERVAL_MS)

  // Bundle the detune timer with music nodes so stopMusic clears it
  ;(musicNodes as unknown as { detuneTimer?: ReturnType<typeof setInterval> }).detuneTimer = detuneTimer
}

export function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval)
    musicInterval = null
  }
  const dt = (musicNodes as unknown as { detuneTimer?: ReturnType<typeof setInterval> }).detuneTimer
  if (dt) clearInterval(dt)
  musicNodes.forEach((n) => {
    try {
      n.osc.stop()
    } catch {
      // ignore
    }
  })
  musicNodes = []
}
