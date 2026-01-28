
import { useState, useEffect, useMemo } from 'react'
import { KEYS, SCALES } from './music'
import { generateShapes } from './shapes'
import Fretboard from './Fretboard'

function dedupeByCoverage(shapes) {
  // Dedupe by coverage signature; if duplicates exist, keep the smaller span version.
  const bestBySig = new Map()
  for (const sh of shapes) {
    const sig = sh.sig ?? `${sh.box[0]}-${sh.box[1]}`
    const prev = bestBySig.get(sig)
    if (!prev) {
      bestBySig.set(sig, sh)
      continue
    }
    // Prefer smaller span; if tie, prefer the one with lower boxStart, then lexicographic name
    if (sh.span < prev.span) bestBySig.set(sig, sh)
    else if (sh.span === prev.span) {
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
  const [styleVariant, setStyleVariant] = useState('classic') // classic | harmonic

  const key = KEYS[keyIdx]
  const scale = SCALES[scaleIdx]

  useEffect(()=>{
    const s4 = generateShapes(keyIdx, scale, { span: 4, fretCount: 21 })
    const s5 = generateShapes(keyIdx, scale, { span: 5, fretCount: 21 })
    const merged = dedupeByCoverage([...s4, ...s5])

    // Order shapes left-to-right on the fretboard:
    // 1) smaller boxStart first (moves along the neck)
    // 2) then smaller span first (prefer tighter box)
    // 3) then lower-pitched root string (E->A->D->G)
    // 4) then lower root fret (tie-breaker)
    const pitchRank = (di) => (di===3?0:di===2?1:di===1?2:3)
    merged.sort((a,b)=>{
      if (a.box[0] !== b.box[0]) return a.box[0] - b.box[0]
      if ((a.span ?? 4) !== (b.span ?? 4)) return (a.span ?? 4) - (b.span ?? 4)
      const pr = pitchRank(a.root.stringIndex) - pitchRank(b.root.stringIndex)
      if (pr !== 0) return pr
      return a.root.fret - b.root.fret
    })

    // Try to keep the same root (string + fret) across refreshes
    let newIndex = 0
    if (shapes.length && shapeIdx < shapes.length) {
      const prevShape = shapes[shapeIdx]
      const match = merged.findIndex(sh =>
        sh.root.stringIndex === prevShape.root.stringIndex &&
        sh.root.fret === prevShape.root.fret
      )
      if (match !== -1) newIndex = match
    }

    setShapes(merged)
    setShapeIdx(newIndex)
  },[keyIdx, scaleIdx])

  const shape = shapes[shapeIdx]

  const shapeLabel = useMemo(() => {
    if (!shape) return 'No Shape'
    return `${shape.name} (${shape.span}-fret)`
  }, [shape])

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-6 items-center">

        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-300">Key</label>
          <select
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            value={keyIdx}
            onChange={(e)=>setKeyIdx(Number(e.target.value))}
          >
            {KEYS.map((k, idx) => (
              <option key={k.name} value={idx}>{k.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-300">Scale</label>
          <select
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            value={scaleIdx}
            onChange={(e)=>setScaleIdx(Number(e.target.value))}
          >
            {SCALES.map((s, idx) => (
              <option key={s.name} value={idx}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <button
            onClick={()=>shapes.length && setShapeIdx((shapeIdx+shapes.length-1)%shapes.length)}
            className="px-2 py-1 rounded-md border border-zinc-700 disabled:opacity-40"
            disabled={!shapes.length}
            aria-label="Decrement shape"
          >
            -
          </button>

          <div className="mx-2 px-3 py-1 border border-zinc-700 rounded-md text-sm font-bold text-center min-w-[160px]">
            {shapeLabel}
          </div>

          <button
            onClick={()=>shapes.length && setShapeIdx((shapeIdx+1)%shapes.length)}
            className="px-2 py-1 rounded-md border border-zinc-700 disabled:opacity-40"
            disabled={!shapes.length}
            aria-label="Increment shape"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-300">Style</label>
          <select
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            value={styleVariant}
            onChange={(e)=>setStyleVariant(e.target.value)}
          >
            <option value="classic">Classic (shape blue, roots red)</option>
            <option value="harmonic">Harmonic (roots red, 3rd/5th blue)</option>
          </select>
        </div>
      </div>

      {shapes.length === 0 && (
        <div className="text-red-400">
          No valid shape found (4-fret or 5-fret) for this key and scale.
        </div>
      )}

      <Fretboard 
        keyIndex={keyIdx} 
        scale={scale} 
        prefer={key.prefer}
        shape={shape}
        styleVariant={styleVariant}
      />
    </div>
  )
}
