import { useState, useEffect, useMemo } from 'react'
import { KEYS, SCALES } from './music'
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

  const [styleVariant, setStyleVariant] = useState('classic') // classic | harmonic | fingers
  const [labelMode, setLabelMode] = useState('notes') // notes | fingers | degrees
  const [prevNonFingerLabelMode, setPrevNonFingerLabelMode] = useState('notes')
  const [openStringsMode, setOpenStringsMode] = useState('shapeOnly') // shapeOnly | inScale
  const [displayActive, setDisplayActive] = useState(false)
useEffect(() => {
    if (styleVariant === 'fingers') {
      setPrevNonFingerLabelMode((prev) => (labelMode === 'fingers' ? prev : labelMode))
      setLabelMode('fingers')
    } else {
      setLabelMode((cur) => (cur === 'fingers' ? prevNonFingerLabelMode : cur))
    }
  }, [styleVariant])

  const key = KEYS[keyIdx]
  const scale = SCALES[scaleIdx]

  useEffect(() => {
    const s4 = generateShapes(keyIdx, scale, { span: 4, fretCount: 21 })
    const s5 = generateShapes(keyIdx, scale, { span: 5, fretCount: 21 })
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
  }, [keyIdx, scaleIdx])

  const shape = shapes[shapeIdx]

  const shapeLabel = useMemo(() => {
    if (!shape) return 'No Shape'
    return shape.name
  }, [shape])

  const keySelect = (
    <div className="flex items-center gap-2">
      <label className="text-sm text-neutral-300">Key</label>
      <select
        className="bg-[#262626] border border-neutral-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-0"
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
            const opts = ['classic', 'harmonic', 'pentatonic', 'fingers']
            const i = opts.indexOf(styleVariant)
            setStyleVariant(opts[(i + opts.length - 1) % opts.length])
          }}
          className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
          aria-label="Decrease"
        >
          −
        </button>

        <div className="min-w-[120px] px-3 py-1 flex items-center justify-center text-sm text-white bg-neutral-800 border-l border-r border-neutral-700 text-center">
          {styleVariant === 'classic' ? 'Classic' : styleVariant === 'harmonic' ? 'Harmonic' : styleVariant === 'pentatonic' ? 'Pentatonic' : 'Finger colors'}
        </div>

        <button
          type="button"
          onClick={() => {
            const opts = ['classic', 'harmonic', 'pentatonic', 'fingers']
            const i = opts.indexOf(styleVariant)
            setStyleVariant(opts[(i + 1) % opts.length])
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
            const opts = ['notes', 'fingers', 'degrees']
            const i = opts.indexOf(labelMode)
            setLabelMode(opts[(i + opts.length - 1) % opts.length])
          }}
          className="px-2 text-base leading-none text-neutral-200 hover:bg-neutral-700/60 active:bg-neutral-700"
          aria-label="Decrease"
        >
          −
        </button>

        <div className="min-w-[130px] px-3 py-1 flex items-center justify-center text-sm text-white bg-neutral-800 border-l border-r border-neutral-700 text-center">
          {labelMode === 'notes' ? 'Note names' : labelMode === 'fingers' ? 'Fingers' : 'Scale degrees'}
        </div>

        <button
          type="button"
          onClick={() => {
            const opts = ['notes', 'fingers', 'degrees']
            const i = opts.indexOf(labelMode)
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
        </div>
      </div>

      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300">Shape</span>
          {shapeStepper}
        </div>

        {styleStepper}

        {displayActive && (
          <>
            {labelsStepper}
            {openStringsStepper}
          </>
        )}
      </div>

      {shapes.length === 0 && <div className="text-red-400">No valid 3NPS shape found for this key and scale.</div>}

      <Fretboard
        keyIndex={keyIdx}
        scale={scale}
        prefer={key.prefer}
        shape={shape}
        styleVariant={styleVariant}
        labelMode={labelMode}
        openStringsMode={openStringsMode}
      />
    </div>
  )
}
