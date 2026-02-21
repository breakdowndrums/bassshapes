import { useState, useEffect, useMemo } from 'react'
import { KEYS, SCALES, TUNING_PRESETS, midiToLabel } from './music'
import { generateShapes } from './shapes'
import Fretboard from './Fretboard'

function dedupeByCoverage(shapes) {
  const bestBySig = new Map()
  for (const sh of shapes) {
    const sig = sh.sig ?? `${sh.box[0]}-${sh.box[1]}`
    const prev = bestBySig.get(sig)
    if (!prev) {
      bestBySig.set(sig, sh)
      continue
    }
    // prefer smaller span, then more-left, then name
    if ((sh.span ?? 4) < (prev.span ?? 4)) bestBySig.set(sig, sh)
    else if ((sh.span ?? 4) === (prev.span ?? 4)) {
      if (sh.box[0] < prev.box[0]) bestBySig.set(sig, sh)
      else if (sh.box[0] === prev.box[0] && sh.name < prev.name) bestBySig.set(sig, sh)
    }
  }
  return Array.from(bestBySig.values())
}

export default function App() {
  const [keyIdx, setKeyIdx] = useState(0)
  const [scaleIdx, setScaleIdx] = useState(0)
  const [shapeIdx, setShapeIdx] = useState(0)
  const [shapes, setShapes] = useState([])

  const [styleVariant, setStyleVariant] = useState('classic')

  // Finger labels only valid in classic
  const [labelMode, setLabelMode] = useState('notes')
 // notes | fingers | degrees

  const effectiveLabelMode =
    styleVariant === 'classic' ? labelMode : labelMode === 'fingers' ? 'notes' : labelMode

  const [openStringsMode, setOpenStringsMode] = useState('shapeOnly') // shapeOnly | inScale
  const [tuningMidis, setTuningMidis] = useState(TUNING_PRESETS[0].midis)
  const [tuningPresetIdx, setTuningPresetIdx] = useState(0)
  const [tuningOpen, setTuningOpen] = useState(false)
  const [displayActive, setDisplayActive] = useState(false)

  const key = KEYS[keyIdx]
  const scale = SCALES[scaleIdx]

  useEffect(() => {
    const s4 = generateShapes(keyIdx, scale, { span: 4, fretCount: 21, tuningMidis, prefer: key.prefer })
    const s5 = generateShapes(keyIdx, scale, { span: 5, fretCount: 21, tuningMidis, prefer: key.prefer })
    const merged = dedupeByCoverage([...s4, ...s5])

    // Left-to-right ordering on the fretboard
    const pitchRank = (di) => (di === 3 ? 0 : di === 2 ? 1 : di === 1 ? 2 : 3)
    merged.sort((a, b) => {
      if (a.box[0] !== b.box[0]) return a.box[0] - b.box[0]
      if ((a.span ?? 4) !== (b.span ?? 4)) return (a.span ?? 4) - (b.span ?? 4)
      const pr = pitchRank(a.root.stringIndex) - pitchRank(b.root.stringIndex)
      if (pr !== 0) return pr
      return a.root.fret - b.root.fret
    })

    // Preserve the same root if possible when recomputing shapes
    let newIndex = 0
    if (shapes.length && shapeIdx < shapes.length) {
      const prev = shapes[shapeIdx]
      const match = merged.findIndex(
        (sh) => sh.root.stringIndex === prev.root.stringIndex && sh.root.fret === prev.root.fret
      )
      if (match !== -1) newIndex = match
    }

    setShapes(merged)
    setShapeIdx(newIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyIdx, scaleIdx, tuningMidis])

  const shape = shapes[shapeIdx]

  const shapeLabel = useMemo(() => {
    if (!shape) return 'No Shape'
    return shape.name
  }, [shape])

  const keySelect = (
    <div className="flex items-center gap-2">
      <label className="text-sm text-neutral-300">Key</label>
      <select
        className={`bg-[#262626] border border-neutral-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-0 ${tuningPresetIdx < 0 ? "bg-neutral-900 border-neutral-800 text-neutral-400" : "bg-neutral-800 border-neutral-700 text-white"}` }
        value={keyIdx}
        onChange={(e) => setKeyIdx(Number(e.target.value))}
      >
        {KEYS.map((k, idx) => (
          <option key={k.name} value={idx}>
            {k.name}
          </option>
        ))}
      </select>
    </div>
  )

  const scaleSelect = (
    <div className="flex items-center gap-2">
      <label className="text-sm text-neutral-300">Scale</label>
      <select
        className="bg-[#262626] border border-neutral-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-0"
        value={scaleIdx}
        onChange={(e) => setScaleIdx(Number(e.target.value))}
      >
        {SCALES.map((s, idx) => (
          <option key={s.name} value={idx}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  )

  const shapeStepper = (
    <div className="flex items-stretch overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
      <button
        type="button"
        onClick={() => shapes.length && setShapeIdx((shapeIdx + shapes.length - 1) % shapes.length)}
        className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700 disabled:opacity-40"
        disabled={!shapes.length}
        aria-label="Decrease"
      >
        −
      </button>

      <div className="min-w-[56px] px-3 py-1 flex items-center justify-center text-sm text-white bg-neutral-800 border-l border-r border-neutral-700">
        {shapeLabel}
      </div>

      <button
        type="button"
        onClick={() => shapes.length && setShapeIdx((shapeIdx + 1) % shapes.length)}
        className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700 disabled:opacity-40"
        disabled={!shapes.length}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )

  const styleStepper = (
    <div className="flex items-center gap-2">
      <label className="text-sm text-neutral-300">Style</label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
        <button
          type="button"
          onClick={() => {
            const opts = ['classic', 'pentatonic', 'harmonic']
            const i = opts.indexOf(styleVariant)
            const next = opts[(i + opts.length - 1) % opts.length]
            if (next !== 'classic' && effectiveLabelMode === 'fingers') setLabelMode('notes')
            setStyleVariant(next)
          }}
          className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
          aria-label="Decrease"
        >
          −
        </button>

        <div className="min-w-[120px] px-3 py-1 flex items-center justify-center text-sm text-white bg-neutral-800 border-l border-r border-neutral-700 text-center">
          {styleVariant === 'classic' ? 'Classic' : styleVariant === 'pentatonic' ? 'Pentatonic' : 'Harmonic'}
        </div>

        <button
          type="button"
          onClick={() => {
            const opts = ['classic', 'pentatonic', 'harmonic']
            const i = opts.indexOf(styleVariant)
            const next = opts[(i + 1) % opts.length]
            if (next !== 'classic' && effectiveLabelMode === 'fingers') setLabelMode('notes')
            setStyleVariant(next)
          }}
          className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  )

  const labelsStepper = (
    <div className="flex items-center gap-2">
      <label className="text-sm text-neutral-300">Label</label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
        <button
          type="button"
          onClick={() => {
            const opts = styleVariant === 'classic' ? ['notes', 'degrees', 'fingers'] : ['notes', 'degrees']
            const i = opts.indexOf(effectiveLabelMode)
            setLabelMode(opts[(i + opts.length - 1) % opts.length])
          }}
          className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
          aria-label="Decrease"
        >
          −
        </button>

        <div className="min-w-[130px] px-3 py-1 flex items-center justify-center text-sm text-white bg-neutral-800 border-l border-r border-neutral-700 text-center">
          {effectiveLabelMode === 'notes' ? 'Note names' : effectiveLabelMode === 'fingers' ? 'Fingers' : 'Scale degrees'}
        </div>

        <button
          type="button"
          onClick={() => {
            const opts = ['notes', 'degrees', 'fingers']
            const i = opts.indexOf(effectiveLabelMode)
            setLabelMode(opts[(i + 1) % opts.length])
          }}
          className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  )

  const openStringsStepper = (
    <div className="flex items-center gap-2">
      <label className="text-sm text-neutral-300">Open strings</label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
        <button
          type="button"
          onClick={() => {
            const opts = ['shapeOnly', 'inScale']
            const i = opts.indexOf(openStringsMode)
            setOpenStringsMode(opts[(i + opts.length - 1) % opts.length])
          }}
          className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
          aria-label="Decrease"
        >
          −
        </button>

        <div className="min-w-[160px] px-3 py-1 flex items-center justify-center text-sm text-white bg-neutral-800 border-l border-r border-neutral-700 text-center">
          {openStringsMode === 'shapeOnly' ? 'Only if in shape' : 'Always if in scale'}
        </div>

        <button
          type="button"
          onClick={() => {
            const opts = ['shapeOnly', 'inScale']
            const i = opts.indexOf(openStringsMode)
            setOpenStringsMode(opts[(i + 1) % opts.length])
          }}
          className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-4 space-y-4" style={{ backgroundColor: '#171717' }}>
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-label)' }}>
          Bass Shapes
        </h1>

        <div className="flex items-center gap-4 flex-wrap">
          {keySelect}
          {scaleSelect}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDisplayActive((v) => !v)}
            className={`px-3 py-1.5 rounded border text-sm capitalize ${
              displayActive
                ? 'bg-neutral-800 border-neutral-600 text-white'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60'
            }`}
          >
            display
          </button>

          <button
            type="button"
            onClick={() => setTuningOpen(true)}
            className="px-3 py-1.5 rounded border text-sm capitalize bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60"
          >
            tuning
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300">Shape</span>
          {shapeStepper}
        </div>

        {styleStepper}

        {labelsStepper}

        {displayActive && (
          <>
            {openStringsStepper}
          </>
        )}
      </div>

      {shapes.length === 0 && <div className="text-red-400">No valid 3NPS shape found for this key and scale.</div>}


      {tuningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTuningOpen(false)} />
          <div className="relative w-full max-w-xl rounded-lg border border-neutral-800 bg-[#171717] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-200" style={{ fontFamily: 'var(--font-ui)' }}>
                Tuning
              </div>
              <button
                type="button"
                onClick={() => setTuningOpen(false)}
                className="text-neutral-300 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <label className="text-sm text-neutral-300">Preset</label>
              <select
                className={`border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-0 ${tuningPresetIdx < 0 ? "bg-neutral-900 border-neutral-800 text-neutral-400" : "bg-[#262626] border-neutral-700 text-white"}`}
                value={tuningPresetIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value)
                  setTuningPresetIdx(idx)
                  if (idx >= 0) {
                    setTuningMidis(TUNING_PRESETS[idx].midis)
                  }
                }}
              >
                <option value={-1}> </option>
                {TUNING_PRESETS.map((p, idx) => (
                  <option key={p.name} value={idx}>
                    {p.name}
                  </option>
                ))}
              </select>

              <label className="text-sm text-neutral-300 ml-2">Strings</label>
              <div className="flex items-stretch overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    const n = Math.max(4, tuningMidis.length - 1)
                    setTuningMidis((prev) => {
                      if (prev.length === n) return prev
                      if (prev.length > n) return prev.slice(0, n)
                      const out = [...prev]
                      while (out.length < n) {
                        const top = out[0]
                        out.unshift(top + 5)
                      }
                      return out
                    })
                    setTuningPresetIdx(-1)
                  }}
                  className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
                  aria-label="Decrease"
                >
                  −
                </button>

                <div className="min-w-[56px] px-3 py-1 flex items-center justify-center text-sm text-white bg-neutral-800 border-l border-r border-neutral-700">
                  {tuningMidis.length}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const n = Math.min(8, tuningMidis.length + 1)
                    setTuningMidis((prev) => {
                      if (prev.length === n) return prev
                      if (prev.length > n) return prev.slice(0, n)
                      const out = [...prev]
                      while (out.length < n) {
                        const top = out[0]
                        out.unshift(top + 5)
                      }
                      return out
                    })
                    setTuningPresetIdx(-1)
                  }}
                  className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-neutral-400">Top string first (highest pitch)</div>
              {tuningMidis.map((midi, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 text-sm text-neutral-300">{i + 1}</div>

                  <div className="flex items-stretch overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setTuningMidis((prev) => prev.map((x, idx) => (idx === i ? Math.max(0, x - 1) : x)))
                        setTuningPresetIdx(-1)
                      }}
                      className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
                      aria-label="Down semitone"
                    >
                      −
                    </button>

                    <div className="min-w-[140px] px-3 py-1 flex items-center justify-center text-sm text-white bg-neutral-800 border-l border-r border-neutral-700 text-center">
                      {midiToLabel(midi, key.prefer)}
                      <span className="ml-2 text-xs text-neutral-400">({midi})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTuningMidis((prev) => prev.map((x, idx) => (idx === i ? Math.min(127, x + 1) : x)))
                        setTuningPresetIdx(-1)
                      }}
                      className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
                      aria-label="Up semitone"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTuningOpen(false)}
                className="px-3 py-1.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800/60 text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <Fretboard
        keyIndex={keyIdx}
        scale={scale}
        prefer={key.prefer}
        shape={shape}
        styleVariant={styleVariant}
        labelMode={effectiveLabelMode}
        openStringsMode={openStringsMode}
        tuningMidis={tuningMidis}
      />
    </div>
  )
}
