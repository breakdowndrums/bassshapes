
import { getNoteName } from './music'

const STRINGS = [
  { name:'G', note:7 },
  { name:'D', note:2 },
  { name:'A', note:9 },
  { name:'E', note:4 },
]

const MARKERS = [3,5,7,9,12,15,17,19]

function degreeForNote(noteIndex, keyIndex, scale) {
  const scaleNotes = scale.intervals.map(i => (keyIndex + i) % 12)
  const idx = scaleNotes.indexOf(noteIndex)
  return idx === -1 ? null : (idx + 1)
}

export default function Fretboard({ keyIndex, scale, prefer, shape, styleVariant }) {
  const scaleNotes = scale.intervals.map(i => (keyIndex + i) % 12)
  const fretCount = 21

  function isScaleNote(noteIndex) {
    return scaleNotes.includes(noteIndex)
  }

  function isInShape(stringIndex, fret) {
    if (!shape) return false
    if (fret < shape.box[0] || fret > shape.box[1]) return false
    const string = STRINGS[stringIndex]
    const note = (string.note + fret) % 12
    return isScaleNote(note)
  }

  function openInShape(stringIndex) {
    if (!shape) return false
    // open string is fret 0; only possible if box starts at 0
    if (shape.box[0] !== 0) return false
    const noteIndex = STRINGS[stringIndex].note
    return isScaleNote(noteIndex) // open note must be in scale
  }

  function isAnyRoot(noteIndex) {
    return noteIndex === keyIndex
  }

  function classForInShapeNote(noteIndex) {
    // For dots/labels that are IN the shape
    if (styleVariant === 'classic') {
      if (isAnyRoot(noteIndex)) return "bg-red-500"
      return "bg-blue-500"
    }

    if (styleVariant === 'harmonic') {
      const deg = degreeForNote(noteIndex, keyIndex, scale)
      if (isAnyRoot(noteIndex)) return "bg-red-500"
      if (deg === 3 || deg === 5) return "bg-blue-500"
      return "bg-zinc-700"
    }

    return "bg-zinc-700"
  }

  function bigDotClass({ inShape, noteIndex }) {
    // faint scale dots across neck (grey)
    if (!inShape) return "w-5 h-5 rounded-full bg-zinc-500 opacity-40"
    // in-shape dots
    const color = classForInShapeNote(noteIndex)
    const size = isAnyRoot(noteIndex) ? "w-8 h-8" : "w-7 h-7"
    return `${size} rounded-full ${color} text-xs flex items-center justify-center`
  }

  
  
  
  function stringLabelChipClass(stringIndex) {
    const noteIndex = STRINGS[stringIndex].note
    const inScale = isScaleNote(noteIndex)

    // If open string isn't in the scale: no circle, just plain text
    if (!inScale) {
      return "text-zinc-300 font-bold"
    }

    // Color open strings exactly like in-shape notes (same size + same color logic).
    const color = classForInShapeNote(noteIndex)
    const size = isAnyRoot(noteIndex) ? "w-8 h-8" : "w-7 h-7"
    return `${size} rounded-full ${color} text-white flex items-center justify-center font-bold text-xs`
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid" style={{gridTemplateColumns:`56px repeat(${fretCount}, minmax(40px,1fr))`}}>
        <div></div>
        {Array.from({length:fretCount}).map((_,i)=>{
          const fret=i+1
          return (
            <div key={fret} className="text-center text-xs text-zinc-400">
              {MARKERS.includes(fret) ? (fret===12?'●●':'●') : ''}
            </div>
          )
        })}

        {STRINGS.map((s,si)=>(
          <>
            <div className="flex items-center justify-center pr-2">
              <div
                className={stringLabelChipClass(si)}
                title={isScaleNote(s.note) ? "Open string is in the scale" : "Open string not in scale"}
              >
                {s.name}
              </div>
            </div>

            {Array.from({length:fretCount}).map((_,i)=>{
              const fret=i+1
              const noteIndex = (s.note + fret) % 12
              const isScale = isScaleNote(noteIndex)
              const inShape = isInShape(si,fret)

              return (
                <div key={fret} className="border border-zinc-700 h-12 flex items-center justify-center">
                  {isScale && (
                    <div className={bigDotClass({ inShape, noteIndex })}>
                      {inShape && getNoteName(noteIndex, prefer)}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ))}

        <div></div>
        {Array.from({length:fretCount}).map((_,i)=>{
          const fret=i+1
          return (
            <div key={fret} className="text-center text-xs text-zinc-400">
              {fret}
            </div>
          )
        })}
      </div>
    </div>
  )
}
