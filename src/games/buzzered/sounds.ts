// Buzzered sound engine.
//
// Every effect is synthesized in real time with the Web Audio API so the app
// ships with zero binary audio assets. Each SoundDef knows how to schedule its
// own oscillators / noise bursts onto a shared, soft-limited master bus.

let ctx: AudioContext | null = null
let master: DynamicsCompressorNode | null = null

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

function getMaster(c: AudioContext): DynamicsCompressorNode {
  if (!master) {
    master = c.createDynamicsCompressor()
    // Gentle limiting so layered effects never clip or get harsh.
    master.threshold.value = -10
    master.knee.value = 20
    master.ratio.value = 12
    master.attack.value = 0.003
    master.release.value = 0.25
    master.connect(c.destination)
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
      // Soft two-note success chime.
      osc(d, c, t, { type: 'sine', f0: 1318.5, dur: 0.5, peak: 0.32, atk: 0.004 })
      osc(d, c, t, { type: 'sine', f0: 2637, dur: 0.4, peak: 0.08, atk: 0.004 })
      osc(d, c, t, { type: 'sine', f0: 1760, t0: 0.12, dur: 0.6, peak: 0.34, atk: 0.004 })
      osc(d, c, t, { type: 'sine', f0: 3520, t0: 0.12, dur: 0.45, peak: 0.07, atk: 0.004 })
    },
  },
  {
    id: 'crack',
    label: 'Crack',
    emoji: '⚡',
    color: '#a78bfa',
    play: (c, d, t) => {
      // Sharp whip-like snap.
      noiseHit(d, c, t, { dur: 0.05, peak: 0.7, filter: { type: 'highpass', freq: 2500 } })
      osc(d, c, t, { type: 'square', f0: 320, f1: 60, dur: 0.05, peak: 0.4 })
    },
  },
  {
    id: 'pop',
    label: 'Pop',
    emoji: '\u{1FAE7}',
    color: '#f472b6',
    play: (c, d, t) => {
      // Cork / bubble pop.
      osc(d, c, t, { type: 'sine', f0: 240, f1: 900, dur: 0.09, peak: 0.55, atk: 0.002 })
      noiseHit(d, c, t, { dur: 0.025, peak: 0.25, filter: { type: 'bandpass', freq: 1400, q: 1 } })
    },
  },
  {
    id: 'error',
    label: 'Error',
    emoji: '❌',
    color: '#f87171',
    play: (c, d, t) => {
      // Classic "wrong answer" double low buzz.
      osc(d, c, t, { type: 'square', f0: 196, dur: 0.18, peak: 0.3 })
      osc(d, c, t, { type: 'square', f0: 185, dur: 0.18, peak: 0.18 })
      osc(d, c, t, { type: 'square', f0: 147, t0: 0.22, dur: 0.42, peak: 0.3 })
      osc(d, c, t, { type: 'square', f0: 138, t0: 0.22, dur: 0.42, peak: 0.18 })
    },
  },
  {
    id: 'punch',
    label: 'Punch',
    emoji: '\u{1F44A}',
    color: '#fb923c',
    play: (c, d, t) => {
      // Low body thud plus impact transient.
      osc(d, c, t, { type: 'sine', f0: 180, f1: 45, dur: 0.18, peak: 0.7, atk: 0.002 })
      noiseHit(d, c, t, { dur: 0.06, peak: 0.4, filter: { type: 'lowpass', freq: 900 } })
    },
  },
  {
    id: 'moments-later',
    label: 'Moments Later',
    emoji: '⏳',
    color: '#fbbf24',
    play: (c, d, t) => {
      // Whimsical time-passing harp glissando upward.
      const notes = [392, 523.25, 659.25, 784, 1046.5]
      notes.forEach((f, i) => {
        osc(d, c, t, { type: 'triangle', f0: f, t0: i * 0.075, dur: 0.7 - i * 0.05, peak: 0.26, atk: 0.004 })
      })
    },
  },
  {
    id: 'ding',
    label: 'Ding',
    emoji: '\u{1F514}',
    color: '#fcd34d',
    play: (c, d, t) => {
      osc(d, c, t, { type: 'sine', f0: 1244.5, dur: 0.9, peak: 0.4, atk: 0.002 })
      osc(d, c, t, { type: 'sine', f0: 2489, dur: 0.5, peak: 0.1, atk: 0.002 })
    },
  },
  {
    id: 'correct',
    label: 'Correct',
    emoji: '✅',
    color: '#4ade80',
    play: (c, d, t) => {
      osc(d, c, t, { type: 'sine', f0: 783.99, dur: 0.16, peak: 0.34, atk: 0.003 })
      osc(d, c, t, { type: 'sine', f0: 1046.5, t0: 0.13, dur: 0.45, peak: 0.36, atk: 0.003 })
    },
  },
  {
    id: 'buzzer',
    label: 'Wrong Buzzer',
    emoji: '\u{1F6D1}',
    color: '#ef4444',
    play: (c, d, t) => {
      // Harsh game-show buzzer.
      osc(d, c, t, { type: 'sawtooth', f0: 110, dur: 0.7, peak: 0.32 })
      osc(d, c, t, { type: 'sawtooth', f0: 116, dur: 0.7, peak: 0.26 })
    },
  },
  {
    id: 'coin',
    label: 'Coin',
    emoji: '\u{1FA99}',
    color: '#facc15',
    play: (c, d, t) => {
      // Platformer coin pickup.
      osc(d, c, t, { type: 'square', f0: 987.77, dur: 0.07, peak: 0.3 })
      osc(d, c, t, { type: 'square', f0: 1318.5, t0: 0.07, dur: 0.4, peak: 0.3 })
    },
  },
  {
    id: 'laser',
    label: 'Laser',
    emoji: '\u{1F52B}',
    color: '#22d3ee',
    play: (c, d, t) => {
      osc(d, c, t, { type: 'sawtooth', f0: 1400, f1: 160, dur: 0.32, peak: 0.32 })
      osc(d, c, t, { type: 'square', f0: 700, f1: 80, dur: 0.32, peak: 0.12 })
    },
  },
  {
    id: 'boing',
    label: 'Boing',
    emoji: '\u{1F300}',
    color: '#818cf8',
    play: (c, d, t) => {
      // Cartoon spring: pitch drop with a vibrato wobble.
      const node = c.createOscillator()
      const gain = c.createGain()
      const lfo = c.createOscillator()
      const lfoGain = c.createGain()
      node.type = 'sine'
      node.frequency.setValueAtTime(600, t)
      node.frequency.exponentialRampToValueAtTime(120, t + 0.5)
      lfo.frequency.setValueAtTime(18, t)
      lfo.frequency.exponentialRampToValueAtTime(7, t + 0.5)
      lfoGain.gain.value = 90
      lfo.connect(lfoGain).connect(node.frequency)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.45, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
      node.connect(gain).connect(d)
      node.start(t)
      lfo.start(t)
      node.stop(t + 0.58)
      lfo.stop(t + 0.58)
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
      f.frequency.setValueAtTime(300, t)
      f.frequency.exponentialRampToValueAtTime(3000, t + 0.22)
      f.frequency.exponentialRampToValueAtTime(500, t + 0.5)
      const gain = c.createGain()
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.5, t + 0.18)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      src.connect(f).connect(gain).connect(d)
      src.start(t)
      src.stop(t + 0.55)
    },
  },
  {
    id: 'click',
    label: 'Click',
    emoji: '\u{1F446}',
    color: '#94a3b8',
    play: (c, d, t) => {
      noiseHit(d, c, t, { dur: 0.015, peak: 0.4, filter: { type: 'highpass', freq: 3000 } })
      osc(d, c, t, { type: 'square', f0: 1800, dur: 0.012, peak: 0.2 })
    },
  },
  {
    id: 'bell',
    label: 'Bell',
    emoji: '\u{1F6CE}️',
    color: '#fde68a',
    play: (c, d, t) => {
      // Service bell ring with inharmonic overtones.
      ;[1, 2.76, 5.4].forEach((mult, i) => {
        osc(d, c, t, {
          type: 'sine',
          f0: 1318.5 * mult,
          dur: 1.2 - i * 0.3,
          peak: 0.3 / (i + 1),
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
      // Ba-dum-tss.
      const drum = (t0: number) => {
        osc(d, c, t, { type: 'sine', f0: 180, f1: 80, t0, dur: 0.12, peak: 0.5 })
        noiseHit(d, c, t, { t0, dur: 0.06, peak: 0.2, filter: { type: 'lowpass', freq: 1200 } })
      }
      drum(0)
      drum(0.16)
      noiseHit(d, c, t, { t0: 0.32, dur: 0.45, peak: 0.3, filter: { type: 'highpass', freq: 6000 } })
    },
  },
  {
    id: 'air-horn',
    label: 'Air Horn',
    emoji: '\u{1F4E2}',
    color: '#fb7185',
    play: (c, d, t) => {
      const blast = (t0: number, dur: number) => {
        ;[1, 1.5, 2.01].forEach((m) => {
          osc(d, c, t, { type: 'sawtooth', f0: 220 * m, t0, dur, peak: 0.18, atk: 0.01 })
        })
      }
      blast(0, 0.18)
      blast(0.24, 0.5)
    },
  },
  {
    id: 'bonk',
    label: 'Bonk',
    emoji: '\u{1F528}',
    color: '#d6d3d1',
    play: (c, d, t) => {
      osc(d, c, t, { type: 'sine', f0: 300, f1: 90, dur: 0.22, peak: 0.55, atk: 0.002 })
      osc(d, c, t, { type: 'triangle', f0: 600, f1: 180, dur: 0.1, peak: 0.2 })
    },
  },
  {
    id: 'zap',
    label: 'Zap',
    emoji: '⚡',
    color: '#67e8f9',
    play: (c, d, t) => {
      osc(d, c, t, { type: 'sawtooth', f0: 80, f1: 1600, dur: 0.12, peak: 0.3, exp: false })
      noiseHit(d, c, t, { dur: 0.12, peak: 0.25, filter: { type: 'bandpass', freq: 2500, q: 0.7 } })
      osc(d, c, t, { type: 'square', f0: 1600, f1: 200, t0: 0.1, dur: 0.1, peak: 0.2 })
    },
  },
  {
    id: 'tada',
    label: 'Ta-da!',
    emoji: '\u{1F389}',
    color: '#c084fc',
    play: (c, d, t) => {
      // Fanfare: quick arpeggio resolving to a held major chord.
      ;[523.25, 659.25, 783.99].forEach((f, i) => {
        osc(d, c, t, { type: 'triangle', f0: f, t0: i * 0.06, dur: 0.18, peak: 0.26 })
      })
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f) => {
        osc(d, c, t, { type: 'triangle', f0: f, t0: 0.18, dur: 0.7, peak: 0.2, atk: 0.01 })
      })
    },
  },
  {
    id: 'camera',
    label: 'Camera',
    emoji: '\u{1F4F8}',
    color: '#cbd5e1',
    play: (c, d, t) => {
      // Shutter: two crisp clicks.
      noiseHit(d, c, t, { dur: 0.02, peak: 0.45, filter: { type: 'highpass', freq: 2000 } })
      noiseHit(d, c, t, { t0: 0.09, dur: 0.03, peak: 0.4, filter: { type: 'highpass', freq: 1500 } })
    },
  },
  {
    id: 'notification',
    label: 'Notification',
    emoji: '\u{1F4F1}',
    color: '#60a5fa',
    play: (c, d, t) => {
      osc(d, c, t, { type: 'sine', f0: 880, dur: 0.2, peak: 0.32, atk: 0.003 })
      osc(d, c, t, { type: 'sine', f0: 1174.7, t0: 0.11, dur: 0.4, peak: 0.32, atk: 0.003 })
    },
  },
]

// Play a sound by id. Safe to call on every press; the AudioContext is shared.
export function playSound(id: string): void {
  const def = SOUNDS.find((s) => s.id === id)
  if (!def) return
  const c = getCtx()
  const dest = getMaster(c)
  def.play(c, dest, c.currentTime)
}
