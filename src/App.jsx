
import { useState, useEffect, useMemo } from 'react'
import { KEYS, SCALES } from './music'
import { generateShapes } from './shapes'
import Fretboard from './Fretboard'

export default function App() {
  const [keyIdx, setKeyIdx] = useState(0)
  const [scaleIdx, setScaleIdx] = useState(0)
  const [shapeIdx, setShapeIdx] = useState(0)
  const [shapes, setShapes] = useState([])
  const [span, setSpan] = useState(4) // 4 or 5 frets
  const [styleVariant, setStyleVariant] = useState('classic') // classic | harmonic

  const key = KEYS[keyIdx]
  const scale = SCALES[scaleIdx]

  
  useEffect(()=>{
    const s = generateShapes(keyIdx, scale, { span, fretCount: 21 })

    // Try to keep the same root (string + fret) when switching span
    let newIndex = 0
    if (shapes.length && shapeIdx < shapes.length) {
      const prevShape = shapes[shapeIdx]
      const match = s.findIndex(sh =>
        sh.root.stringIndex === prevShape.root.stringIndex &&
        sh.root.fret === prevShape.root.fret
      )
      if (match !== -1) newIndex = match
    }

    setShapes(s)
    setShapeIdx(newIndex)
  },[keyIdx, scaleIdx, span])


  const shape = shapes[shapeIdx]

  const shapeLabel = useMemo(() => {
    if (!shape) return 'No Shape'
    return `${shape.name} (${span}-fret)`
  }, [shape, span])

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-6 items-center">

        {/* Key dropdown */}
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

        {/* Scale dropdown */}
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

        {/* Shape cycler: fixed width label so arrows don't shift */}
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

        {/* Box span toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-300">Box span</span>
          <div className="inline-flex rounded-lg overflow-hidden border border-zinc-700">
            <button
              className={"px-3 py-1 text-sm " + (span===4 ? "bg-zinc-700" : "bg-zinc-900")}
              onClick={()=>setSpan(4)}
            >
              4
            </button>
            <button
              className={"px-3 py-1 text-sm " + (span===5 ? "bg-zinc-700" : "bg-zinc-900")}
              onClick={()=>setSpan(5)}
            >
              5
            </button>
          </div>
        </div>

        {/* Style dropdown (moved to the right of box span) */}
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
          No valid shape fits within a {span}-fret span for this key and scale.
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
