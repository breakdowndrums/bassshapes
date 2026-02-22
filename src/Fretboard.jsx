
import { getNoteName } from './music'

const PENT_MAJOR = new Set([0, 2, 4, 7, 9])
const PENT_MINOR = new Set([0, 3, 5, 7, 10])

const FINGER_COLORS = {
  0: '#F93B41', // open string
  1: '#FAB101',
  2: '#FB6500',
  3: '#745BFB',
  4: '#01A5FA',
}

const MARKERS = [3,5,7,9,12,15,17,19]

function degreeForNote(noteIndex, keyIndex, scale) {
  const scaleNotes = scale.intervals.map(i => (keyIndex + i) % 12)

  const idx = scaleNotes.indexOf(noteIndex)
  return idx === -1 ? null : (idx + 1)
}

export default function Fretboard({ keyIndex, scale, prefer, shape, styleVariant, openStringsMode = 'shapeOnly', labelMode = 'notes', tuningMidis = [43,38,33,28]   ,
  allScaleMode = false
}) {
  const scaleNotes = scale.intervals.map(i => (keyIndex + i) % 12)
  const fretCount = 21

  const strings = tuningMidis.map((midi) => {
    const pc = ((midi % 12) + 12) % 12
    const octave = Math.floor(midi / 12) - 1
    return {
      openMidi: midi,
      openPc: pc,
      label: `${getNoteName(pc, prefer)}${octave}`,
      short: getNoteName(pc, prefer),
    }
  })


  function isScaleNote(noteIndex) {
    return scaleNotes.includes(noteIndex)
  }

  function openIsInShape(stringIndex) {
    if (!shape) return false
    if (shape.box[0] !== 0) return false
    const noteIndex = strings[stringIndex].openPc
    return isScaleNote(noteIndex)
  }

  function isInShape(stringIndex, fret) {
    const str = strings[stringIndex]
    const note = (str.openPc + fret) % 12

    // In "All" mode we treat every scale tone as "in shape"
    if (allScaleMode) return isScaleNote(note)

    if (!shape) return false
    const [boxStart, boxEnd] = shape.box
    if (fret < boxStart || fret > boxEnd) return false

    // Selected shapes are defined by the box + scale membership (3NPS constraint is used at generation time)
    return isScaleNote(note)
  }

  
function openInShape(stringIndex) {
    const openPc = strings[stringIndex].openPc
    if (!isScaleNote(openPc)) return false

    if (allScaleMode) return true
    if (!shape) return false

    const [boxStart] = shape.box
    return boxStart === 0
  }

  
function chooseOpenDoubleBassMode() {
    if (!shape) return 'none'
    if (shape.box[0] !== 0) return 'none'
    if (shape.box[1] < 4) return 'none'

    // Compare how many scale-note positions are on frets 1&2 vs 3&4
    const countOnFrets = (frets) => {
      let c = 0
      strings.forEach((s) => {
        frets.forEach((fret) => {
          const note = (s.openPc + fret) % 12
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
    // When label = fingers, use finger-color palette regardless of the selected style
    if (labelMode === 'fingers') {
      // background color is applied inline (finger palette)
      return isAnyRoot(noteIndex) ? 'ring-2 ring-neutral-300 ring-inset border-[0.5px] border-neutral-300' : ''
    }

    if (styleVariant === 'classic') {
      if (isAnyRoot(noteIndex)) return 'bg-red-500'
      return 'bg-blue-500'
    }

    if (styleVariant === 'harmonic') {
      const deg = degreeForNote(noteIndex, keyIndex, scale)
      if (isAnyRoot(noteIndex)) return 'bg-red-500'
      if (deg === 3 || deg === 5) return 'bg-blue-500'
      return 'bg-zinc-700'
    }

    if (styleVariant === 'pentatonic') {
      // Highlight 5 pentatonic tones inside the selected 7-note scale
      const rel = (noteIndex - (keyIndex % 12) + 12) % 12
      const hasMaj3 = scale.intervals.includes(4)
      const pentMajor = new Set([0, 2, 4, 7, 9])
      const pentMinor = new Set([0, 3, 5, 7, 10])
      const activeSet = hasMaj3 ? pentMajor : pentMinor
      if (isAnyRoot(noteIndex)) return 'bg-red-500'
      if (activeSet.has(rel)) return 'bg-blue-500'
      return 'bg-zinc-700'
    }

    return 'bg-zinc-700'
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
    const noteIndex = strings[stringIndex].openPc
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
    const extra = labelMode === 'fingers' ? (isAnyRoot(noteIndex) ? "ring-2 ring-neutral-300 ring-inset border-[0.5px] border-neutral-300" : "") : classForInShapeNote(noteIndex)
    return `${size} rounded-full ${extra} text-white flex items-center justify-center font-bold text-xs`
  }

  return (
    <div className="overflow-x-hidden">
      <div className="w-full">
        {/* fret markers */}
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${fretCount}, minmax(0,1fr))` }}>
          <div></div>
                  {Array.from({length:fretCount}).map((_,i)=>{
                    const fret=i+1
                    return (
                      <div key={fret} className="text-center text-xs text-zinc-400">
                        {MARKERS.includes(fret) ? (fret===12?'●●':'●') : ''}
                      </div>
                    )
                  })}
        </div>

        {/* strings + notes */}
        <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${fretCount}, minmax(0,1fr))` }}>
          {/* vertical fret lines (flush with string lines) */}
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: '56px',
              right: 0,
              top: '24px',
              bottom: '24px',
            }}
          >
            {Array.from({ length: fretCount + 1 }).map((_, i) => (
              <div
                key={i}
                className={
                  i === 0
                    ? 'absolute top-0 bottom-0 w-[2px] bg-neutral-400'
                    : 'absolute top-0 bottom-0 w-px bg-neutral-700'
                }
                style={{ left: `${(i / fretCount) * 100}%`, transform: i === 0 ? undefined : 'translateX(-0.5px)' }}
              />
            ))}
          </div>

        {strings.map((s,si)=>(
                  <>
                    <div className="relative flex items-center justify-center pr-3">
                      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-600 z-0" />
                      <div
                        className={`relative z-20 ${stringLabelChipClass(si)}` }
                        style={
                          labelMode === 'fingers' && isScaleNote(s.openPc) && ((openStringsMode === 'inScale') || openIsInShape(si))
                            ? { backgroundColor: FINGER_COLORS[0], opacity: isAnyRoot(s.openPc) ? 1 : 0.75 }
                            : undefined
                        }
                        title={isScaleNote(s.openPc) ? "Open string is in the scale" : "Open string not in scale"}
                      >
                        {s.label ?? s.short ?? ''}
                      </div>
                    </div>
        
                    {Array.from({length:fretCount}).map((_,i)=>{
                      const fret=i+1
                      const noteIndex = (s.openPc + fret) % 12
                      const isScale = isScaleNote(noteIndex)
                      const inShape = isInShape(si,fret)
        
                      return (
                        <div key={fret} className="relative h-12 flex items-center justify-center">
                          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-600 z-0" />
                          {isScale && (
                            <div
                              className={`relative z-20 ${bigDotClass({ inShape, noteIndex })}` }
                              style={
                                labelMode === 'fingers' && (inShape || fret === 0)
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
        </div>

        {/* fret numbers */}
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${fretCount}, minmax(0,1fr))` }}>
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
    </div>
  )
}
