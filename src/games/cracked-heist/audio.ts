// Tiny Web Audio system: countdown beeps + a single slow, melancholic
// instrumental loop. All sound runs through a master gain so muting
// kills everything.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
let musicStop: (() => void) | null = null
let listeners = new Set<() => void>()

const STORAGE_KEY = 'crackedHeist:muted'

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  try {
    const C =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new C()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1.0
    master.connect(ctx.destination)
  } catch {
    ctx = null
  }
  return ctx
}

export function initAudio() {
  try {
    if (localStorage.getItem(STORAGE_KEY) === '1') muted = true
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
    master.gain.setTargetAtTime(m ? 0 : 1.0, c.currentTime, 0.05)
  }
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
  beep(587.33, 0.1, 'sine', 0.22)
  setTimeout(() => beep(880, 0.18, 'sine', 0.22), 110)
}

export function sfxWrong() {
  beep(150, 0.35, 'sawtooth', 0.18)
}

export function sfxWin() {
  beep(523.25, 0.18, 'sine', 0.25)
  setTimeout(() => beep(659.25, 0.18, 'sine', 0.25), 180)
  setTimeout(() => beep(783.99, 0.3, 'sine', 0.25), 360)
}

// ---- Background music: Cyber Pulse ----
// Driving electronic with a steady four-on-the-floor kick, a syncopated
// bassline, atmospheric pad, and bright square-wave stabs. ~100 bpm
// in A minor. Original composition, hacker-terminal vibe.

const BEAT_MS = 600 // ~100 bpm
const STEP_MS = BEAT_MS / 4 // 16th notes

// 16-step bass pattern in A minor. Notes are Hz; null = rest.
// Pattern: 1-_-_-_-1-_-1-_-b6-_-_-_-b7-_-1-_  (kind of a "Stranger Things" pulse)
const BASS_PATTERN: (number | null)[] = [
  110.0, null,  null,  null,  110.0, null,  110.0, null,
  87.31, null,  null,  null,  98.0,  null,  110.0, null,
]

// Square-wave lead — minor pentatonic riff that loops every 4 bars
const LEAD_PATTERN: (number | null)[] = [
  // bar 1
  null, null, 659.25, null,  null, null, 587.33, null,  523.25, null, 440.0,  null,  null, null, 523.25, null,
  // bar 2
  null, null, 587.33, null,  null, null, 659.25, null,  783.99, null, 659.25, null,  null, null, 587.33, null,
  // bar 3
  null, null, 440.0,  null,  null, null, 523.25, null,  587.33, null, 523.25, null,  null, null, 440.0,  null,
  // bar 4
  392.0, null, null, null,   523.25, null, null, null,  659.25, null, 587.33, null,  523.25, 440.0, 392.0, null,
]

// Atmospheric pad — sustained minor chord that shifts every 4 bars
const PAD_CHORDS = [
  [220.0, 261.63, 329.63], // Am
  [196.0, 246.94, 293.66], // G
  [174.61, 220.0, 261.63], // F
  [196.0, 246.94, 293.66], // G
]

function playKick(c: AudioContext, out: GainNode) {
  const osc = c.createOscillator()
  osc.type = 'sine'
  const g = c.createGain()
  const now = c.currentTime
  osc.frequency.setValueAtTime(140, now)
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.12)
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(0.5, now + 0.003)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  osc.connect(g).connect(out)
  osc.start(now)
  osc.stop(now + 0.25)
}

function playHat(c: AudioContext, out: GainNode) {
  const buf = c.createBuffer(1, 2200, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * 0.4
  const noise = c.createBufferSource()
  noise.buffer = buf
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6000
  const g = c.createGain()
  const now = c.currentTime
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(0.08, now + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
  noise.connect(hp).connect(g).connect(out)
  noise.start(now)
  noise.stop(now + 0.08)
}

function playBassNote(c: AudioContext, out: GainNode, freq: number) {
  const osc = c.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = freq
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 800
  lp.Q.value = 6
  const g = c.createGain()
  const now = c.currentTime
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(0.22, now + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  osc.connect(lp).connect(g).connect(out)
  osc.start(now)
  osc.stop(now + 0.25)
}

function playLeadNote(c: AudioContext, out: GainNode, freq: number) {
  const osc = c.createOscillator()
  osc.type = 'square'
  osc.frequency.value = freq
  const g = c.createGain()
  const now = c.currentTime
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(0.08, now + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
  osc.connect(g).connect(out)
  osc.start(now)
  osc.stop(now + 0.2)
}

function playPadChord(c: AudioContext, out: GainNode, chord: number[], durationSec: number) {
  chord.forEach((freq) => {
    const osc = c.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1200
    const g = c.createGain()
    const now = c.currentTime
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.05, now + 0.4)
    g.gain.setValueAtTime(0.05, now + durationSec - 0.4)
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)
    osc.connect(lp).connect(g).connect(out)
    osc.start(now)
    osc.stop(now + durationSec + 0.05)
  })
}

export function startMusic() {
  const c = ensureCtx()
  if (!c || !master) return
  if (c.state === 'suspended') c.resume()
  if (musicStop) return

  let step = 0 // 16th-note step counter (within a bar, 0..15)
  let leadStep = 0 // step within the 4-bar lead pattern (0..63)
  let bar = 0 // bar counter

  const stepTimer = setInterval(() => {
    if (!ctx || !master) return

    // Kick on every beat (steps 0, 4, 8, 12)
    if (step % 4 === 0) playKick(ctx, master)
    // Hat on off-beats (steps 2, 6, 10, 14)
    if (step % 4 === 2) playHat(ctx, master)

    // Bass pattern
    const bassNote = BASS_PATTERN[step]
    if (bassNote != null) playBassNote(ctx, master, bassNote)

    // Lead pattern (loops over 4 bars = 64 steps)
    const leadNote = LEAD_PATTERN[leadStep]
    if (leadNote != null) playLeadNote(ctx, master, leadNote)

    step = (step + 1) % 16
    leadStep = (leadStep + 1) % LEAD_PATTERN.length
    if (step === 0) bar++
  }, STEP_MS)

  // Pad chord every 4 bars (16 beats = 64 steps)
  const padDuration = (STEP_MS * 16) / 1000
  const playNextPad = () => {
    if (!ctx || !master) return
    playPadChord(ctx, master, PAD_CHORDS[bar % PAD_CHORDS.length], padDuration)
  }
  playNextPad() // first pad immediately
  const padTimer = setInterval(playNextPad, STEP_MS * 16)

  musicStop = () => {
    clearInterval(stepTimer)
    clearInterval(padTimer)
  }
}

export function stopMusic() {
  if (musicStop) {
    musicStop()
    musicStop = null
  }
}
