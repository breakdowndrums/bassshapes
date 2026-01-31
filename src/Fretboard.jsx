
import { getNoteName } from './music'

const FINGER_COLORS = {
  0: '#F93B41', // open string
  1: '#FAB101',
  2: '#FB6500',
  3: '#745BFB',
  4: '#01A5FA',
}

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

export default function Fretboard({ keyIndex, scale, prefer, shape, styleVariant, openStringsMode = 'shapeOnly', labelMode = 'notes' }) {
  const scaleNotes = scale.intervals.map(i => (keyIndex + i) % 12)
  const fretCount = 21

  function isScaleNote(noteIndex) {
    return scaleNotes.includes(noteIndex)
  }

  function openIsInShape(stringIndex) {
    if (!shape) return false
    if (shape.box[0] !== 0) return false
    const noteIndex = STRINGS[stringIndex].note
    return isScaleNote(noteIndex)
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

  
  // Fingering for displaying finger numbers inside the selected shape.
  // This mirrors the shape-generation fingering rules (without the naming-only 'no finger 3' rule).
  function chooseOpenDoubleBassMode() {
    if (!shape) return 'none'
    if (shape.box[0] !== 0) return 'none'
    if (shape.box[1] < 4) return 'none'

    // Compare how many scale-note positions are on frets 1&2 vs 3&4
    const countOnFrets = (frets) => {
      let c = 0
      STRINGS.forEach((s) => {
        frets.forEach((fret) => {
          const note = (s.note + fret) % 12
          if (scaleNotes.includes(note)) c++
        })
      })
      return c
    }
    const low = countOnFrets([1,2])
    const high = countOnFrets([3,4])
    if (low < high) return 'index'
    if (high < low) return 'pinky'
    return 'index'
  }

  function fingerForOpenDoubleBass(openMode, fret) {
    // open string itself isn't shown in the grid; keep for completeness
    if (fret === 0) return 0
    if (shape.span === 4) {
      if (fret === 1) return 1
      if (fret === 2) return 2
      return 4 // fret 3
    }
    // span 5 (0..4)
    if (openMode === 'pinky') {
      if (fret === 1) return 1
      if (fret === 2) return 2
      return 4 // frets 3&4
    }
    // index mode
    if (fret === 1) return 1
    if (fret === 2) return 1
    if (fret === 3) return 2
    return 4
  }

  function fingerForFiveFret(mode, fret) {
    const boxStart = shape.box[0]
    const offset = fret - boxStart // 0..4
    if (mode === 'index') {
      if (offset <= 1) return 1
      if (offset === 2) return 2
      if (offset === 3) return 3
      return 4
    }
    // pinky mode
    if (offset === 0) return 1
    if (offset === 1) return 2
    if (offset === 2) return 3
    return 4
  }

  
  function getScaleDegree(noteIndex) {
    const idx = scaleNotes.indexOf(noteIndex)
    if (idx === -1) return ''
    return String(idx + 1)
  }

function fingerForDisplayedFret(fret) {
    if (!shape) return ''
    const boxStart = shape.box[0]
    if (boxStart === 0) {
      const openMode = chooseOpenDoubleBassMode()
      const finger = fingerForOpenDoubleBass(openMode, fret)
      return finger ? String(finger) : ''
    }
    if (shape.span === 4) {
      return String((fret - boxStart) + 1)
    }
    // span 5
    return String(fingerForFiveFret(shape.mode, fret))
  }
function isAnyRoot(noteIndex) {
    return noteIndex === keyIndex
  }

  function classForInShapeNote(noteIndex) {
    // For dots/labels that are IN the shape
    if (styleVariant === 'fingers') {
      // background color is applied inline; keep roots distinct
      return isAnyRoot(noteIndex) ? 'ring-2 ring-neutral-300 ring-inset border-[0.5px] border-neutral-300' : ''
    }

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
      return "text-neutral-300 font-bold"
    }

    const showCircle = (openStringsMode === 'inScale') || openIsInShape(stringIndex)
    if (!showCircle) {
      // In scale, but we only show open strings when they are part of the shape
      return "text-neutral-300 font-bold"
    }

    // Circle for open string label
    const size = isAnyRoot(noteIndex) ? "w-8 h-8" : "w-7 h-7"
    const extra = styleVariant === 'fingers' ? (isAnyRoot(noteIndex) ? "ring-2 ring-neutral-300 ring-inset border-[0.5px] border-neutral-300" : "") : classForInShapeNote(noteIndex)
    return `${size} rounded-full ${extra} text-white flex items-center justify-center font-bold text-xs`
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
                style={
                  styleVariant === 'fingers' && isScaleNote(s.note) && ((openStringsMode === 'inScale') || openIsInShape(si))
                    ? { backgroundColor: FINGER_COLORS[0], opacity: isAnyRoot(s.note) ? 1 : 0.75 }
                    : undefined
                }
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
                <div key={fret} className="border border-neutral-700 h-12 flex items-center justify-center">
                  {isScale && (
                    <div
                      className={bigDotClass({ inShape, noteIndex })}
                      style={
                        styleVariant === 'fingers' && (inShape || fret === 0)
                          ? {
                              backgroundColor: fret === 0 ? FINGER_COLORS[0] : FINGER_COLORS[Number(fingerForDisplayedFret(fret))],
                              opacity: 1,
                            }
                          : undefined
                      }
                    >
                      {inShape && (labelMode === 'fingers' ? fingerForDisplayedFret(fret) : labelMode === 'degrees' ? getScaleDegree(noteIndex) : getNoteName(noteIndex, prefer))}
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
