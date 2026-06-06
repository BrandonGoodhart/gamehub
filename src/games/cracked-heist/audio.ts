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

// ---- Background music: slow sad-pop instrumental ----
// ~70 bpm in A minor. A wandering Am - F - C - G chord loop with a soft
// piano-ish melody on top, a sub bass note per chord, and a gentle kick
// pulse. Original composition — vibe similar to slow melancholy pop.

const BEAT_MS = 857 // ~70bpm
const A2 = 110
const F2 = 87.31
const C3 = 130.81
const G2 = 98.0

const CHORDS = [
  { root: A2, triad: [220.0, 261.63, 329.63] }, // Am
  { root: F2, triad: [174.61, 220.0, 261.63] }, // F
  { root: C3, triad: [261.63, 329.63, 392.0] }, // C
  { root: G2, triad: [196.0, 246.94, 293.66] }, // G
]

// 8 melody notes per chord (16th-ish), wandering A minor pentatonic.
// Each row is one bar; nulls = rest.
const MELODY: (number | null)[][] = [
  // over Am
  [659.25, null, 523.25, 440.0, null, 523.25, 587.33, null],
  // over F
  [523.25, null, 440.0, 349.23, null, 440.0, 523.25, null],
  // over C
  [659.25, null, 783.99, 659.25, null, 523.25, 587.33, null],
  // over G
  [587.33, null, 493.88, 440.0, null, 493.88, 587.33, 659.25],
]

function playChord(c: AudioContext, out: GainNode, chord: number[], duration: number) {
  // Soft piano-ish: triangle with quick attack, slow decay
  chord.forEach((freq) => {
    const osc = c.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const g = c.createGain()
    const now = c.currentTime
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.07, now + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(g).connect(out)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  })
}

function playBass(c: AudioContext, out: GainNode, freq: number, duration: number) {
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  const g = c.createGain()
  const now = c.currentTime
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(0.22, now + 0.04)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(g).connect(out)
  osc.start(now)
  osc.stop(now + duration + 0.05)
}

function playMelodyNote(c: AudioContext, out: GainNode, freq: number, duration: number) {
  // Sine-y piano top voice
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  const g = c.createGain()
  const now = c.currentTime
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(0.16, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(g).connect(out)
  osc.start(now)
  osc.stop(now + duration + 0.05)
}

function playKick(c: AudioContext, out: GainNode) {
  const osc = c.createOscillator()
  osc.type = 'sine'
  const g = c.createGain()
  const now = c.currentTime
  osc.frequency.setValueAtTime(120, now)
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.18)
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(0.35, now + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
  osc.connect(g).connect(out)
  osc.start(now)
  osc.stop(now + 0.32)
}

export function startMusic() {
  const c = ensureCtx()
  if (!c || !master) return
  if (c.state === 'suspended') c.resume()
  if (musicStop) return

  let bar = 0 // index into CHORDS / MELODY

  // Chord + bass every 4 beats
  const chordTimer = setInterval(() => {
    if (!ctx || !master) return
    const idx = bar % CHORDS.length
    const ch = CHORDS[idx]
    const dur = (BEAT_MS * 4) / 1000
    playChord(ctx, master, ch.triad, dur)
    playBass(ctx, master, ch.root, dur)
    bar++
  }, BEAT_MS * 4)

  // Fire first chord immediately so we don't wait 3.4s for music to start
  const firstIdx = 0
  const firstDur = (BEAT_MS * 4) / 1000
  playChord(c, master, CHORDS[firstIdx].triad, firstDur)
  playBass(c, master, CHORDS[firstIdx].root, firstDur)
  bar = 1

  // Soft kick every 2 beats (beats 1 and 3 of each bar)
  const kickTimer = setInterval(() => {
    if (!ctx || !master) return
    playKick(ctx, master)
  }, BEAT_MS * 2)
  // First kick now
  playKick(c, master)

  // Melody — fire one note every half-beat (16 notes per bar, but we
  // only have 8 in MELODY[bar] so play one every half-beat aligned).
  let melStep = 0
  const noteInterval = BEAT_MS / 2 // half-beat
  const melTimer = setInterval(() => {
    if (!ctx || !master) return
    const barIdx = Math.floor(melStep / 8) % MELODY.length
    const posInBar = melStep % 8
    const note = MELODY[barIdx][posInBar]
    if (note != null) {
      playMelodyNote(ctx, master, note, 0.55)
    }
    melStep++
  }, noteInterval)

  musicStop = () => {
    clearInterval(chordTimer)
    clearInterval(kickTimer)
    clearInterval(melTimer)
  }
}

export function stopMusic() {
  if (musicStop) {
    musicStop()
    musicStop = null
  }
}
