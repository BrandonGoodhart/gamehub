// Buzzered sound engine.
//
// Every effect is synthesized in real time with the Web Audio API so the app
// ships with zero binary audio assets. Each SoundDef knows how to schedule its
// own oscillators / noise bursts onto a shared, soft-limited master bus.

let ctx: AudioContext | null = null
let master: GainNode | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    ctx = new Ctor()
  }
  // Browsers start the context suspended until a user gesture occurs.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// iOS/Safari keeps audio muted until a buffer is played inside a real user
// gesture. On the first press we resume the context and fire a one-sample
// silent buffer to unlock output; without this, iPads stay silent.
let unlocked = false
function unlock(c: AudioContext): void {
  if (unlocked) return
  unlocked = true
  const buf = c.createBuffer(1, 1, 22050)
  const src = c.createBufferSource()
  src.buffer = buf
  src.connect(c.destination)
  try {
    src.start(0)
  } catch {
    /* some browsers throw on a zero-length start; safe to ignore */
  }
  void c.resume()
}

// Build a synthetic impulse response for the convolution reverb: white noise
// with an exponential decay tail. This gives every effect a sense of space and
// a natural-sounding tail so sounds feel fuller and ring out longer.
function makeImpulse(c: AudioContext, duration: number, decay: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * duration)
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  return buf
}

// Sounds connect to a shared bus that splits into a dry path and a reverb
// (wet) path, both summed through a soft limiter into the speakers.
function getMaster(c: AudioContext): GainNode {
  if (!master) {
    const bus = c.createGain()

    const comp = c.createDynamicsCompressor()
    comp.threshold.value = -10
    comp.knee.value = 20
    comp.ratio.value = 12
    comp.attack.value = 0.003
    comp.release.value = 0.25
    comp.connect(c.destination)

    const dry = c.createGain()
    dry.gain.value = 0.9
    bus.connect(dry).connect(comp)

    const reverb = c.createConvolver()
    reverb.buffer = makeImpulse(c, 2.2, 2.6)
    const wet = c.createGain()
    wet.gain.value = 0.28
    bus.connect(reverb).connect(wet).connect(comp)

    master = bus
  }
  return master
}

// Cache one second of white noise; we slice/loop it as needed.
let noise: AudioBuffer | null = null
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (!noise) {
    const len = c.sampleRate
    noise = c.createBuffer(1, len, c.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }
  return noise
}

type Filter = { type: BiquadFilterType; freq: number; q?: number }

interface OscOpts {
  type?: OscillatorType
  f0: number
  f1?: number
  t0?: number
  dur: number
  peak?: number
  atk?: number
  exp?: boolean // exponential pitch glide (default) vs linear
}

function osc(dest: AudioNode, c: AudioContext, now: number, o: OscOpts): void {
  const { type = 'sine', f0, f1, t0 = 0, dur, peak = 0.3, atk = 0.005, exp = true } = o
  const start = now + t0
  const node = c.createOscillator()
  const gain = c.createGain()
  node.type = type
  node.frequency.setValueAtTime(f0, start)
  if (f1 !== undefined) {
    if (exp) node.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), start + dur)
    else node.frequency.linearRampToValueAtTime(f1, start + dur)
  }
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + atk)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  node.connect(gain).connect(dest)
  node.start(start)
  node.stop(start + dur + 0.03)
}

interface NoiseOpts {
  t0?: number
  dur: number
  peak?: number
  atk?: number
  filter?: Filter
}

function noiseHit(dest: AudioNode, c: AudioContext, now: number, o: NoiseOpts): void {
  const { t0 = 0, dur, peak = 0.3, atk = 0.001, filter } = o
  const start = now + t0
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  src.loop = true
  let tail: AudioNode = src
  if (filter) {
    const f = c.createBiquadFilter()
    f.type = filter.type
    f.frequency.value = filter.freq
    if (filter.q !== undefined) f.Q.value = filter.q
    src.connect(f)
    tail = f
  }
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + atk)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  tail.connect(gain).connect(dest)
  src.start(start)
  src.stop(start + dur + 0.05)
}

export interface SoundDef {
  id: string
  label: string
  emoji: string
  // Tailwind-ish base color used to tint the 3D buzzer cap.
  color: string
  play: (c: AudioContext, dest: AudioNode, now: number) => void
}

export const SOUNDS: SoundDef[] = [
  {
    id: 'apple-pay',
    label: 'Apple Pay',
    emoji: '',
    color: '#34d399',
    play: (c, d, t) => {
      // Soft two-note success chime with long bell-like ring-out.
      osc(d, c, t, { type: 'sine', f0: 1318.5, dur: 1.1, peak: 0.32, atk: 0.004 })
      osc(d, c, t, { type: 'sine', f0: 2637, dur: 0.8, peak: 0.08, atk: 0.004 })
      osc(d, c, t, { type: 'sine', f0: 1760, t0: 0.14, dur: 1.5, peak: 0.34, atk: 0.004 })
      osc(d, c, t, { type: 'sine', f0: 3520, t0: 0.14, dur: 1.0, peak: 0.07, atk: 0.004 })
      osc(d, c, t, { type: 'sine', f0: 2637, t0: 0.14, dur: 1.6, peak: 0.12, atk: 0.004 })
    },
  },
  {
    id: 'crack',
    label: 'Crack',
    emoji: '⚡',
    color: '#a78bfa',
    play: (c, d, t) => {
      // Sharp whip snap, then a debris/rumble tail so it rings out.
      noiseHit(d, c, t, { dur: 0.06, peak: 0.8, filter: { type: 'highpass', freq: 2500 } })
      osc(d, c, t, { type: 'square', f0: 360, f1: 50, dur: 0.07, peak: 0.45 })
      noiseHit(d, c, t, { t0: 0.04, dur: 0.6, peak: 0.18, filter: { type: 'lowpass', freq: 700 } })
    },
  },
  {
    id: 'pop',
    label: 'Pop',
    emoji: '\u{1FAE7}',
    color: '#f472b6',
    play: (c, d, t) => {
      // Cork pop with a hollow resonant ring afterward.
      osc(d, c, t, { type: 'sine', f0: 240, f1: 1000, dur: 0.11, peak: 0.6, atk: 0.002 })
      noiseHit(d, c, t, { dur: 0.03, peak: 0.3, filter: { type: 'bandpass', freq: 1400, q: 1 } })
      osc(d, c, t, { type: 'sine', f0: 620, t0: 0.06, dur: 0.5, peak: 0.22, atk: 0.004 })
    },
  },
  {
    id: 'error',
    label: 'Error',
    emoji: '❌',
    color: '#f87171',
    play: (c, d, t) => {
      // Classic "wrong answer" descending double buzz, drawn out.
      osc(d, c, t, { type: 'square', f0: 196, dur: 0.32, peak: 0.3 })
      osc(d, c, t, { type: 'square', f0: 185, dur: 0.32, peak: 0.18 })
      osc(d, c, t, { type: 'square', f0: 147, t0: 0.34, dur: 0.85, peak: 0.3 })
      osc(d, c, t, { type: 'square', f0: 138, t0: 0.34, dur: 0.85, peak: 0.18 })
    },
  },
  {
    id: 'punch',
    label: 'Punch',
    emoji: '\u{1F44A}',
    color: '#fb923c',
    play: (c, d, t) => {
      // Snappy impact over a deep boom that rolls off slowly.
      osc(d, c, t, { type: 'sine', f0: 200, f1: 45, dur: 0.3, peak: 0.7, atk: 0.002 })
      noiseHit(d, c, t, { dur: 0.08, peak: 0.45, filter: { type: 'lowpass', freq: 900 } })
      osc(d, c, t, { type: 'sine', f0: 70, f1: 35, t0: 0.02, dur: 0.7, peak: 0.4, atk: 0.004 })
    },
  },
  {
    id: 'moments-later',
    label: 'Moments Later',
    emoji: '⏳',
    color: '#fbbf24',
    play: (c, d, t) => {
      // Whimsical time-passing harp run that resolves to a held chord.
      const notes = [349.23, 440, 523.25, 659.25, 783.99, 1046.5]
      notes.forEach((f, i) => {
        osc(d, c, t, { type: 'triangle', f0: f, t0: i * 0.1, dur: 1.4 - i * 0.08, peak: 0.24, atk: 0.005 })
      })
      // Sustained resolving chord underneath the final notes.
      ;[349.23, 523.25, 659.25].forEach((f) => {
        osc(d, c, t, { type: 'sine', f0: f, t0: 0.6, dur: 1.3, peak: 0.12, atk: 0.04 })
      })
    },
  },
  {
    id: 'ding',
    label: 'Ding',
    emoji: '\u{1F514}',
    color: '#fcd34d',
    play: (c, d, t) => {
      osc(d, c, t, { type: 'sine', f0: 1244.5, dur: 1.8, peak: 0.4, atk: 0.002 })
      osc(d, c, t, { type: 'sine', f0: 2489, dur: 1.0, peak: 0.1, atk: 0.002 })
      osc(d, c, t, { type: 'sine', f0: 3733, dur: 0.6, peak: 0.04, atk: 0.002 })
    },
  },
  {
    id: 'correct',
    label: 'Correct',
    emoji: '✅',
    color: '#4ade80',
    play: (c, d, t) => {
      // Rising three-note "ta-da-daa" with a held last note.
      osc(d, c, t, { type: 'sine', f0: 783.99, dur: 0.22, peak: 0.34, atk: 0.003 })
      osc(d, c, t, { type: 'sine', f0: 1046.5, t0: 0.16, dur: 0.26, peak: 0.34, atk: 0.003 })
      osc(d, c, t, { type: 'sine', f0: 1318.5, t0: 0.33, dur: 1.1, peak: 0.36, atk: 0.003 })
      osc(d, c, t, { type: 'sine', f0: 2637, t0: 0.33, dur: 0.7, peak: 0.08, atk: 0.003 })
    },
  },
  {
    id: 'buzzer',
    label: 'Wrong Buzzer',
    emoji: '\u{1F6D1}',
    color: '#ef4444',
    play: (c, d, t) => {
      // Harsh, sustained game-show buzzer.
      osc(d, c, t, { type: 'sawtooth', f0: 110, dur: 1.3, peak: 0.32, atk: 0.008 })
      osc(d, c, t, { type: 'sawtooth', f0: 116, dur: 1.3, peak: 0.26, atk: 0.008 })
      osc(d, c, t, { type: 'square', f0: 55, dur: 1.3, peak: 0.18, atk: 0.008 })
    },
  },
  {
    id: 'coin',
    label: 'Coin',
    emoji: '\u{1FA99}',
    color: '#facc15',
    play: (c, d, t) => {
      // Platformer coin pickup with a long shimmering tail.
      osc(d, c, t, { type: 'square', f0: 987.77, dur: 0.09, peak: 0.3 })
      osc(d, c, t, { type: 'square', f0: 1318.5, t0: 0.08, dur: 0.9, peak: 0.3 })
      osc(d, c, t, { type: 'sine', f0: 2637, t0: 0.08, dur: 0.9, peak: 0.08 })
    },
  },
  {
    id: 'laser',
    label: 'Laser',
    emoji: '\u{1F52B}',
    color: '#22d3ee',
    play: (c, d, t) => {
      // Descending zap with a lingering low tail.
      osc(d, c, t, { type: 'sawtooth', f0: 1600, f1: 120, dur: 0.6, peak: 0.32 })
      osc(d, c, t, { type: 'square', f0: 800, f1: 60, dur: 0.6, peak: 0.12 })
      osc(d, c, t, { type: 'sine', f0: 120, t0: 0.4, dur: 0.5, peak: 0.15, atk: 0.01 })
    },
  },
  {
    id: 'boing',
    label: 'Boing',
    emoji: '\u{1F300}',
    color: '#818cf8',
    play: (c, d, t) => {
      // Cartoon spring: pitch drop with a vibrato wobble that rattles out.
      const node = c.createOscillator()
      const gain = c.createGain()
      const lfo = c.createOscillator()
      const lfoGain = c.createGain()
      node.type = 'sine'
      node.frequency.setValueAtTime(700, t)
      node.frequency.exponentialRampToValueAtTime(110, t + 0.9)
      lfo.frequency.setValueAtTime(22, t)
      lfo.frequency.exponentialRampToValueAtTime(5, t + 0.9)
      lfoGain.gain.value = 110
      lfo.connect(lfoGain).connect(node.frequency)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.45, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.0)
      node.connect(gain).connect(d)
      node.start(t)
      lfo.start(t)
      node.stop(t + 1.05)
      lfo.stop(t + 1.05)
    },
  },
  {
    id: 'whoosh',
    label: 'Whoosh',
    emoji: '\u{1F4A8}',
    color: '#38bdf8',
    play: (c, d, t) => {
      const src = c.createBufferSource()
      src.buffer = noiseBuffer(c)
      src.loop = true
      const f = c.createBiquadFilter()
      f.type = 'bandpass'
      f.Q.value = 1.2
      f.frequency.setValueAtTime(250, t)
      f.frequency.exponentialRampToValueAtTime(3200, t + 0.4)
      f.frequency.exponentialRampToValueAtTime(400, t + 0.9)
      const gain = c.createGain()
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.35)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
      src.connect(f).connect(gain).connect(d)
      src.start(t)
      src.stop(t + 0.95)
    },
  },
  {
    id: 'click',
    label: 'Click',
    emoji: '\u{1F446}',
    color: '#94a3b8',
    play: (c, d, t) => {
      // Crisp mechanical click with a short resonant tick.
      noiseHit(d, c, t, { dur: 0.02, peak: 0.45, filter: { type: 'highpass', freq: 3000 } })
      osc(d, c, t, { type: 'square', f0: 1800, dur: 0.02, peak: 0.22 })
      osc(d, c, t, { type: 'sine', f0: 900, t0: 0.015, dur: 0.12, peak: 0.12 })
    },
  },
  {
    id: 'bell',
    label: 'Bell',
    emoji: '\u{1F6CE}️',
    color: '#fde68a',
    play: (c, d, t) => {
      // Service bell with long inharmonic ring.
      ;[1, 2.76, 5.4, 8.9].forEach((mult, i) => {
        osc(d, c, t, {
          type: 'sine',
          f0: 1318.5 * mult,
          dur: 2.4 - i * 0.45,
          peak: 0.32 / (i + 1),
          atk: 0.002,
        })
      })
    },
  },
  {
    id: 'rimshot',
    label: 'Rimshot',
    emoji: '\u{1F941}',
    color: '#f59e0b',
    play: (c, d, t) => {
      // Ba-dum-tss with a long cymbal wash.
      const drum = (t0: number) => {
        osc(d, c, t, { type: 'sine', f0: 190, f1: 80, t0, dur: 0.16, peak: 0.5 })
        noiseHit(d, c, t, { t0, dur: 0.08, peak: 0.2, filter: { type: 'lowpass', freq: 1200 } })
      }
      drum(0)
      drum(0.18)
      noiseHit(d, c, t, { t0: 0.36, dur: 1.1, peak: 0.32, filter: { type: 'highpass', freq: 6000 } })
    },
  },
  {
    id: 'air-horn',
    label: 'Air Horn',
    emoji: '\u{1F4E2}',
    color: '#fb7185',
    play: (c, d, t) => {
      // Two reggae-style blasts, the second held long.
      const blast = (t0: number, dur: number) => {
        ;[1, 1.5, 2.01, 2.5].forEach((m) => {
          osc(d, c, t, { type: 'sawtooth', f0: 220 * m, t0, dur, peak: 0.16, atk: 0.012 })
        })
      }
      blast(0, 0.22)
      blast(0.3, 1.0)
    },
  },
  {
    id: 'bonk',
    label: 'Bonk',
    emoji: '\u{1F528}',
    color: '#d6d3d1',
    play: (c, d, t) => {
      // Hollow wood-block bonk with a ringing tail.
      osc(d, c, t, { type: 'sine', f0: 320, f1: 90, dur: 0.35, peak: 0.55, atk: 0.002 })
      osc(d, c, t, { type: 'triangle', f0: 640, f1: 180, dur: 0.18, peak: 0.2 })
      osc(d, c, t, { type: 'sine', f0: 180, t0: 0.05, dur: 0.5, peak: 0.18, atk: 0.006 })
    },
  },
  {
    id: 'zap',
    label: 'Zap',
    emoji: '⚡',
    color: '#67e8f9',
    play: (c, d, t) => {
      // Electric discharge with a crackling tail.
      osc(d, c, t, { type: 'sawtooth', f0: 80, f1: 1700, dur: 0.18, peak: 0.3, exp: false })
      noiseHit(d, c, t, { dur: 0.45, peak: 0.22, filter: { type: 'bandpass', freq: 2500, q: 0.7 } })
      osc(d, c, t, { type: 'square', f0: 1700, f1: 150, t0: 0.12, dur: 0.4, peak: 0.18 })
    },
  },
  {
    id: 'tada',
    label: 'Ta-da!',
    emoji: '\u{1F389}',
    color: '#c084fc',
    play: (c, d, t) => {
      // Fanfare: quick arpeggio resolving to a long held major chord.
      ;[523.25, 659.25, 783.99].forEach((f, i) => {
        osc(d, c, t, { type: 'triangle', f0: f, t0: i * 0.07, dur: 0.2, peak: 0.26 })
      })
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f) => {
        osc(d, c, t, { type: 'triangle', f0: f, t0: 0.21, dur: 1.5, peak: 0.2, atk: 0.012 })
      })
    },
  },
  {
    id: 'camera',
    label: 'Camera',
    emoji: '\u{1F4F8}',
    color: '#cbd5e1',
    play: (c, d, t) => {
      // Shutter clicks followed by a soft motor wind.
      noiseHit(d, c, t, { dur: 0.025, peak: 0.45, filter: { type: 'highpass', freq: 2000 } })
      noiseHit(d, c, t, { t0: 0.1, dur: 0.035, peak: 0.4, filter: { type: 'highpass', freq: 1500 } })
      noiseHit(d, c, t, { t0: 0.14, dur: 0.4, peak: 0.12, filter: { type: 'bandpass', freq: 1200, q: 2 } })
    },
  },
  {
    id: 'notification',
    label: 'Notification',
    emoji: '\u{1F4F1}',
    color: '#60a5fa',
    play: (c, d, t) => {
      // Pleasant marimba-like two-note alert with ring-out.
      osc(d, c, t, { type: 'sine', f0: 880, dur: 0.4, peak: 0.32, atk: 0.003 })
      osc(d, c, t, { type: 'sine', f0: 1174.7, t0: 0.13, dur: 0.9, peak: 0.32, atk: 0.003 })
      osc(d, c, t, { type: 'sine', f0: 2349.3, t0: 0.13, dur: 0.5, peak: 0.06, atk: 0.003 })
    },
  },
]

// Play a sound by id. Safe to call on every press; the AudioContext is shared.
export function playSound(id: string): void {
  const def = SOUNDS.find((s) => s.id === id)
  if (!def) return
  const c = getCtx()
  unlock(c)
  const dest = getMaster(c)
  // Small lead so events aren't scheduled in the past while the context is
  // still spinning up from a suspended state (another iOS quirk).
  def.play(c, dest, c.currentTime + 0.02)
}
