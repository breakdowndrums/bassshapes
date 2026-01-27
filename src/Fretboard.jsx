
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

  function isInShape(stringIndex, fret) {
    if (!shape) return false
    if (fret < shape.box[0] || fret > shape.box[1]) return false
    const string = STRINGS[stringIndex]
    const note = (string.note + fret) % 12
    return scaleNotes.includes(note)
  }

  function isAnyRoot(noteIndex) {
    return noteIndex === keyIndex
  }

  function bigDotClass({ inShape, noteIndex }) {
    // Variant 1 (classic):
    // - faint scale dots across neck (grey)
    // - shape notes blue
    // - ANY root note inside shape = red
    if (styleVariant === 'classic') {
      if (!inShape) return "w-5 h-5 rounded-full bg-zinc-500 opacity-40"
      if (isAnyRoot(noteIndex)) return "w-8 h-8 rounded-full bg-red-500 text-xs flex items-center justify-center"
      return "w-7 h-7 rounded-full bg-blue-500 text-xs flex items-center justify-center"
    }

    // Variant 2 (harmonic highlights):
    // - all shape notes dark grey
    // - all root notes red
    // - 3rd and 5th in blue
    // - faint scale dots still visible
    if (styleVariant === 'harmonic') {
      if (!inShape) return "w-5 h-5 rounded-full bg-zinc-500 opacity-40"

      const deg = degreeForNote(noteIndex, keyIndex, scale)
      if (isAnyRoot(noteIndex)) {
        return "w-8 h-8 rounded-full bg-red-500 text-xs flex items-center justify-center"
      }
      if (deg === 3 || deg === 5) {
        return "w-7 h-7 rounded-full bg-blue-500 text-xs flex items-center justify-center"
      }
      return "w-7 h-7 rounded-full bg-zinc-700 text-xs flex items-center justify-center"
    }

    return "w-5 h-5 rounded-full bg-zinc-500 opacity-40"
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid" style={{gridTemplateColumns:`40px repeat(${fretCount}, minmax(40px,1fr))`}}>
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
            <div className="flex items-center justify-center font-bold">{s.name}</div>
            {Array.from({length:fretCount}).map((_,i)=>{
              const fret=i+1
              const noteIndex = (s.note + fret) % 12
              const isScale = scaleNotes.includes(noteIndex)
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
