import { useCallback, useEffect, useRef, useState } from 'react'
import { playNote } from './audio'

/**
 * Plays a sequence of steps ({ midi, positions: ["string:fret", …] }) at a tempo,
 * and reports which positions are sounding so the fretboard can highlight them.
 */
export function usePlayer() {
  const [bpm, setBpm] = useState(100)
  const [loop, setLoop] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(() => new Set())

  const timers = useRef([])
  const stoppers = useRef([])
  const loopRef = useRef(loop)
  loopRef.current = loop

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    stoppers.current.forEach((s) => s())
    stoppers.current = []
  }

  const stop = useCallback(() => {
    clear()
    setPlaying(false)
    setActive(new Set())
  }, [])

  const play = useCallback((steps, tempo) => {
    clear()
    if (!steps.length) return
    const dt = 60 / tempo // one note per beat
    setPlaying(true)

    const run = () => {
      steps.forEach((step, i) => {
        stoppers.current.push(playNote(step.midi, { when: i * dt, duration: Math.max(dt * 1.6, 0.5) }))
        timers.current.push(setTimeout(() => setActive(new Set(step.positions)), i * dt * 1000))
      })
      timers.current.push(
        setTimeout(() => {
          if (loopRef.current) {
            timers.current = []
            stoppers.current = []
            run()
          } else {
            setPlaying(false)
            setActive(new Set())
          }
        }, steps.length * dt * 1000)
      )
    }
    run()
  }, [])

  // single note, e.g. clicking the fretboard; flashes the clicked position
  const flashTimer = useRef(null)
  const tap = useCallback(
    (midi, pos) => {
      playNote(midi)
      if (playing) return
      clearTimeout(flashTimer.current)
      setActive(new Set(pos ? [pos] : []))
      flashTimer.current = setTimeout(() => setActive(new Set()), 350)
    },
    [playing]
  )

  useEffect(() => () => clear(), [])

  return { bpm, setBpm, loop, setLoop, playing, active, play, stop, tap }
}

/** Up-then-down sequence from a list of { midi, pos } (duplicates by pitch are merged). */
export function upAndDown(notes) {
  const byMidi = new Map()
  for (const n of notes) {
    if (!byMidi.has(n.midi)) byMidi.set(n.midi, [])
    byMidi.get(n.midi).push(n.pos)
  }
  const up = [...byMidi.keys()].sort((a, b) => a - b).map((midi) => ({ midi, positions: byMidi.get(midi) }))
  return [...up, ...up.slice(0, -1).reverse()]
}
