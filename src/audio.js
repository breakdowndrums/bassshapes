// Tiny Web Audio bass synth — no samples, no dependencies.

let ctx = null
let master = null

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
    const comp = ctx.createDynamicsCompressor()
    master = ctx.createGain()
    master.gain.value = 0.8
    master.connect(comp)
    comp.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12)

/**
 * Play one plucked bass note.
 * @returns a function that stops the note early (used when playback is cancelled)
 */
export function playNote(midi, { when = 0, duration = 1.4, velocity = 0.9 } = {}) {
  const c = audio()
  const t = c.currentTime + when + 0.01
  const f = midiToFreq(midi)

  // Sawtooth gives the harmonics that make low notes audible on small speakers;
  // the sine adds body. A falling low-pass filter makes it sound plucked.
  const saw = c.createOscillator()
  saw.type = 'sawtooth'
  saw.frequency.value = f
  const sine = c.createOscillator()
  sine.type = 'sine'
  sine.frequency.value = f

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 3
  filter.frequency.setValueAtTime(Math.min(f * 14, 5000), t)
  filter.frequency.exponentialRampToValueAtTime(Math.max(f * 2.5, 180), t + 0.4)

  const sineGain = c.createGain()
  sineGain.gain.value = 0.7

  const amp = c.createGain()
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(0.4 * velocity, t + 0.006)
  amp.gain.exponentialRampToValueAtTime(0.12 * velocity, t + 0.25)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration)

  saw.connect(filter)
  sine.connect(sineGain)
  sineGain.connect(filter)
  filter.connect(amp)
  amp.connect(master)

  saw.start(t)
  sine.start(t)
  saw.stop(t + duration + 0.05)
  sine.stop(t + duration + 0.05)

  return () => {
    const now = c.currentTime
    try {
      amp.gain.cancelScheduledValues(now)
      amp.gain.setValueAtTime(Math.max(amp.gain.value, 0.0001), now)
      amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
      saw.stop(now + 0.06)
      sine.stop(now + 0.06)
    } catch {
      /* already stopped */
    }
  }
}
