// Tiny Web Audio system: countdown beeps + ambient music with selectable styles.
// All sound runs through a single master gain so muting kills everything.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
let musicStop: (() => void) | null = null
let currentStyle: MusicStyle = 'cyber'
let listeners = new Set<() => void>()

const STORAGE_KEY = 'crackedHeist:muted'
const STYLE_KEY = 'crackedHeist:musicStyle'

export type MusicStyle = 'cyber' | 'synthwave' | 'lofi' | 'chiptune'

export const MUSIC_STYLES: { key: MusicStyle; label: string; desc: string }[] = [
  { key: 'cyber', label: 'Cyber', desc: 'Low drone + slow arpeggio (hacker vibe)' },
  { key: 'synthwave', label: 'Synthwave', desc: 'Bouncy 80s bassline + bright arp' },
  { key: 'lofi', label: 'Lo-fi', desc: 'Chill kick + soft mellow melody' },
  { key: 'chiptune', label: 'Chiptune', desc: '8-bit square-wave game melody' },
]

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
    const savedStyle = localStorage.getItem(STYLE_KEY) as MusicStyle | null
    if (savedStyle && MUSIC_STYLES.some((s) => s.key === savedStyle)) {
      currentStyle = savedStyle
    }
  } catch {
    // ignore
  }
  ensureCtx()
}

export function isMuted(): boolean {
  return muted
}

export function getStyle(): MusicStyle {
  return currentStyle
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

export function setStyle(s: MusicStyle) {
  currentStyle = s
  try {
    localStorage.setItem(STYLE_KEY, s)
  } catch {
    // ignore
  }
  // Restart music with new style
  stopMusic()
  if (!muted) startMusic()
  listeners.forEach((cb) => cb())
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

// ---- Background music ----

export function startMusic() {
  const c = ensureCtx()
  if (!c || !master) return
  if (c.state === 'suspended') c.resume()
  if (musicStop) return // already playing

  switch (currentStyle) {
    case 'cyber':
      musicStop = startCyber(c, master)
      break
    case 'synthwave':
      musicStop = startSynthwave(c, master)
      break
    case 'lofi':
      musicStop = startLofi(c, master)
      break
    case 'chiptune':
      musicStop = startChiptune(c, master)
      break
  }
}

export function stopMusic() {
  if (musicStop) {
    musicStop()
    musicStop = null
  }
}

// --- Style 1: Cyber (drone + slow arp) ---
function startCyber(c: AudioContext, out: GainNode): () => void {
  const oscs: OscillatorNode[] = []
  const timers: ReturnType<typeof setInterval>[] = []

  const drone1 = c.createOscillator()
  drone1.type = 'sine'
  drone1.frequency.value = 110
  const drone1g = c.createGain()
  drone1g.gain.value = 0.18
  drone1.connect(drone1g).connect(out)
  drone1.start()
  oscs.push(drone1)

  const drone2 = c.createOscillator()
  drone2.type = 'triangle'
  drone2.frequency.value = 164.81
  const drone2g = c.createGain()
  drone2g.gain.value = 0.10
  drone2.connect(drone2g).connect(out)
  drone2.start()
  oscs.push(drone2)

  let detunePhase = 0
  timers.push(
    setInterval(() => {
      detunePhase += 0.4
      drone2.detune.setTargetAtTime(Math.sin(detunePhase) * 12, c.currentTime, 0.5)
    }, 800),
  )

  const ARP = [220.0, 261.63, 329.63, 440.0, 329.63, 261.63]
  let i = 0
  timers.push(
    setInterval(() => {
      const osc = c.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = ARP[i]
      const g = c.createGain()
      const now = c.currentTime
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.12, now + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
      osc.connect(g).connect(out)
      osc.start(now)
      osc.stop(now + 0.65)
      i = (i + 1) % ARP.length
    }, 700),
  )

  return () => {
    timers.forEach(clearInterval)
    oscs.forEach((o) => {
      try { o.stop() } catch { /* ignore */ }
    })
  }
}

// --- Style 2: Synthwave (driving bassline + bright arp) ---
function startSynthwave(c: AudioContext, out: GainNode): () => void {
  const timers: ReturnType<typeof setInterval>[] = []
  const persistentOscs: OscillatorNode[] = []

  // Pulsing bass: 8th notes at ~110bpm
  const BASS = [82.41, 82.41, 110.0, 82.41, 92.50, 92.50, 123.47, 92.50] // E2/A2/F#2/B2 pattern
  let bIdx = 0
  const bassInterval = 280
  timers.push(
    setInterval(() => {
      const osc = c.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = BASS[bIdx]
      const g = c.createGain()
      const now = c.currentTime
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.18, now + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
      osc.connect(g).connect(out)
      osc.start(now)
      osc.stop(now + 0.3)
      bIdx = (bIdx + 1) % BASS.length
    }, bassInterval),
  )

  // Bright lead arpeggio — 16th notes
  const LEAD = [329.63, 415.30, 493.88, 659.25, 493.88, 415.30] // E4 G#4 B4 E5 B4 G#4
  let lIdx = 0
  timers.push(
    setInterval(() => {
      const osc = c.createOscillator()
      osc.type = 'square'
      osc.frequency.value = LEAD[lIdx]
      const g = c.createGain()
      const now = c.currentTime
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.07, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
      osc.connect(g).connect(out)
      osc.start(now)
      osc.stop(now + 0.2)
      lIdx = (lIdx + 1) % LEAD.length
    }, 140),
  )

  return () => {
    timers.forEach(clearInterval)
    persistentOscs.forEach((o) => {
      try { o.stop() } catch { /* ignore */ }
    })
  }
}

// --- Style 3: Lo-fi (kick + soft melody) ---
function startLofi(c: AudioContext, out: GainNode): () => void {
  const timers: ReturnType<typeof setInterval>[] = []

  // Soft kick on every beat (~90bpm)
  const kickInterval = 667
  timers.push(
    setInterval(() => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      const g = c.createGain()
      const now = c.currentTime
      osc.frequency.setValueAtTime(120, now)
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15)
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.4, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
      osc.connect(g).connect(out)
      osc.start(now)
      osc.stop(now + 0.3)
    }, kickInterval),
  )

  // Soft hi-hat ticks on off-beats
  timers.push(
    setInterval(() => {
      const noise = c.createBufferSource()
      const buf = c.createBuffer(1, 4410, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * 0.5
      noise.buffer = buf
      const g = c.createGain()
      const now = c.currentTime
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.06, now + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
      noise.connect(g).connect(out)
      noise.start(now)
      noise.stop(now + 0.1)
    }, kickInterval),
  )

  // Mellow melody — gentle E minor pentatonic
  const MEL = [329.63, 392.00, 440.0, 493.88, 440.0, 392.00, 329.63, 293.66]
  let mIdx = 0
  timers.push(
    setInterval(() => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = MEL[mIdx]
      const g = c.createGain()
      const now = c.currentTime
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.18, now + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)
      osc.connect(g).connect(out)
      osc.start(now)
      osc.stop(now + 0.9)
      mIdx = (mIdx + 1) % MEL.length
    }, 1000),
  )

  return () => {
    timers.forEach(clearInterval)
  }
}

// --- Style 4: Chiptune (8-bit square melody + bass) ---
function startChiptune(c: AudioContext, out: GainNode): () => void {
  const timers: ReturnType<typeof setInterval>[] = []

  // Bouncy bass — root + fifth
  const BASS = [130.81, 130.81, 196.0, 196.0, 174.61, 174.61, 220.0, 220.0] // C3 G3 F3 A3
  let bIdx = 0
  timers.push(
    setInterval(() => {
      const osc = c.createOscillator()
      osc.type = 'square'
      osc.frequency.value = BASS[bIdx]
      const g = c.createGain()
      const now = c.currentTime
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.12, now + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
      osc.connect(g).connect(out)
      osc.start(now)
      osc.stop(now + 0.2)
      bIdx = (bIdx + 1) % BASS.length
    }, 250),
  )

  // 8-bit melody — C major pentatonic loop
  const MEL = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.0]
  let mIdx = 0
  timers.push(
    setInterval(() => {
      const osc = c.createOscillator()
      osc.type = 'square'
      osc.frequency.value = MEL[mIdx]
      const g = c.createGain()
      const now = c.currentTime
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.10, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
      osc.connect(g).connect(out)
      osc.start(now)
      osc.stop(now + 0.25)
      mIdx = (mIdx + 1) % MEL.length
    }, 250),
  )

  return () => {
    timers.forEach(clearInterval)
  }
}
