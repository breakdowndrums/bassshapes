import { getNoteName } from './music'
import { fingerAt } from './shapes'
import FretGrid from './FretGrid'

const FINGER_COLORS = {
  0: '#F93B41', // open string
  1: '#FAB101',
  2: '#FB6500',
  3: '#745BFB',
  4: '#01A5FA',
}

const PENT_MAJOR = new Set([0, 2, 4, 7, 9])
const PENT_MINOR = new Set([0, 3, 5, 7, 10])
const FRET_COUNT = 21

export default function Fretboard({
  keyIndex,
  scale,
  prefer,
  shape,
  styleVariant,
  openStringsMode = 'shapeOnly',
  labelMode = 'notes',
  tuningMidis = [43, 38, 33, 28],
  allScaleMode = false,
  vertical = false,
  active = new Set(), // "string:fret" positions currently sounding
  onNoteClick, // (midi, "string:fret") => void
}) {
  const scaleNotes = scale.intervals.map((i) => (keyIndex + i) % 12)

  const strings = tuningMidis.map((midi) => {
    const pc = ((midi % 12) + 12) % 12
    return { openMidi: midi, openPc: pc, label: `${getNoteName(pc, prefer)}${Math.floor(midi / 12) - 1}` }
  })

  const isScaleNote = (pc) => scaleNotes.includes(pc)
  const isRoot = (pc) => pc === keyIndex
  const degreeOf = (pc) => {
    const i = scaleNotes.indexOf(pc)
    return i === -1 ? '' : String(i + 1)
  }

  function isInShape(fret, pc) {
    if (!isScaleNote(pc)) return false
    if (allScaleMode) return true
    if (!shape) return false
    return fret >= shape.box[0] && fret <= shape.box[1]
  }

  // open strings: shown as a note when they're part of the shape, or always (if the user chose that)
  function openShown(pc) {
    if (!isScaleNote(pc)) return false
    if (openStringsMode === 'inScale') return true
    return !!shape && shape.box[0] === 0
  }

  function colorClass(pc) {
    if (labelMode === 'fingers') return isRoot(pc) ? 'ring-2 ring-neutral-300 ring-inset' : ''
    if (isRoot(pc)) return 'bg-red-500'
    if (styleVariant === 'harmonic') {
      const deg = scaleNotes.indexOf(pc) + 1
      return deg === 3 || deg === 5 ? 'bg-blue-500' : 'bg-zinc-700'
    }
    if (styleVariant === 'pentatonic') {
      const rel = (pc - keyIndex + 12) % 12
      const set = scale.intervals.includes(4) ? PENT_MAJOR : PENT_MINOR
      return set.has(rel) ? 'bg-blue-500' : 'bg-zinc-700'
    }
    return 'bg-blue-500'
  }

  function label(pc, si, fret) {
    if (labelMode === 'fingers') return fret === 0 ? '0' : String(fingerAt(shape, si, fret) ?? '')
    if (labelMode === 'degrees') return degreeOf(pc)
    return getNoteName(pc, prefer)
  }

  const activeRing = (si, fret) =>
    active.has(`${si}:${fret}`) ? 'ring-4 ring-white scale-110 shadow-lg shadow-white/30' : ''

  function renderCell(si, fret) {
    const s = strings[si]
    const pc = (s.openPc + fret) % 12
    const sounding = active.has(`${si}:${fret}`)

    if (fret === 0) {
      if (!openShown(pc)) {
        return (
          <div
            className={`relative z-20 font-bold text-neutral-300 text-sm rounded-full px-1 transition ${
              sounding ? 'ring-4 ring-white' : ''
            }`}
          >
            {s.label}
          </div>
        )
      }
      const size = isRoot(pc) ? 'w-8 h-8' : 'w-7 h-7'
      return (
        <div
          className={`relative z-20 ${size} rounded-full ${colorClass(pc)} ${activeRing(si, 0)} transition text-white flex items-center justify-center font-bold text-xs`}
          style={labelMode === 'fingers' ? { backgroundColor: FINGER_COLORS[0], opacity: isRoot(pc) ? 1 : 0.75 } : undefined}
          title="Open string"
        >
          {s.label}
        </div>
      )
    }

    if (!isScaleNote(pc)) {
      return sounding ? <div className="relative z-20 w-5 h-5 rounded-full ring-4 ring-white" /> : null
    }

    if (!isInShape(fret, pc)) {
      return (
        <div
          className={`relative z-20 w-5 h-5 rounded-full bg-zinc-500 transition ${
            sounding ? 'opacity-100 ring-4 ring-white' : 'opacity-40'
          }`}
        />
      )
    }

    const size = isRoot(pc) ? 'w-8 h-8' : 'w-7 h-7'
    const finger = labelMode === 'fingers' ? fingerAt(shape, si, fret) : null
    return (
      <div
        className={`relative z-20 ${size} rounded-full ${colorClass(pc)} ${activeRing(si, fret)} transition text-xs text-white flex items-center justify-center`}
        style={finger != null ? { backgroundColor: FINGER_COLORS[finger] } : undefined}
      >
        {label(pc, si, fret)}
      </div>
    )
  }

  return (
    <FretGrid
      strings={strings}
      fretCount={FRET_COUNT}
      vertical={vertical}
      renderCell={renderCell}
      cellLabel={(si, f) => `${strings[si].label} string, ${f === 0 ? 'open' : `fret ${f}`}`}
      onCellClick={(si, f) => onNoteClick?.(strings[si].openMidi + f, `${si}:${f}`)}
    />
  )
}
