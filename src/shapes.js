
const STRINGS_DISPLAY = [
  { name:'G', note:7 }, // display index 0
  { name:'D', note:2 }, // 1
  { name:'A', note:9 }, // 2
  { name:'E', note:4 }, // 3
]

// Pitch order (lowest to highest) for choosing the "lower" root
const STRINGS_PITCH = [
  { name:'E', note:4, displayIndex:3, pitchRank:0 },
  { name:'A', note:9, displayIndex:2, pitchRank:1 },
  { name:'D', note:2, displayIndex:1, pitchRank:2 },
  { name:'G', note:7, displayIndex:0, pitchRank:3 },
]

function collectScaleNotesInBox(scaleNotes, boxStart, boxEnd, fretCount) {
  const found = new Set()
  for (let di = 0; di < STRINGS_DISPLAY.length; di++) {
    const open = STRINGS_DISPLAY[di].note
    for (let fret = boxStart; fret <= boxEnd; fret++) {
      if (fret < 1 || fret > fretCount) continue
      const note = (open + fret) % 12
      if (scaleNotes.includes(note)) found.add(note)
    }
  }
  return found
}

function findLowestRootInBox(keyIndex, boxStart, boxEnd, fretCount) {
  // "Lowest" means lowest-pitched string first (E->A->D->G), then lowest fret.
  let best = null
  for (const s of STRINGS_PITCH) {
    for (let fret = boxStart; fret <= boxEnd; fret++) {
      if (fret < 1 || fret > fretCount) continue
      const note = (s.note + fret) % 12
      if (note !== keyIndex) continue
      // Candidate found; because we iterate in pitch then fret order, first match is best.
      best = { displayIndex: s.displayIndex, fret, stringName: s.name }
      return best
    }
  }
  return null
}

export function generateShapes(keyIndex, scale, opts = {}) {
  const fretCount = opts.fretCount ?? 21
  const span = opts.span ?? 4 // 4 or 5
  const scaleNotes = scale.intervals.map(i => (keyIndex + i) % 12)
  const requiredCount = scaleNotes.length
  const shapes = []

  // Enumerate boxes instead of root placements, then derive canonical root for naming.
  for (let boxStart = 1; boxStart <= fretCount - span + 1; boxStart++) {
    const boxEnd = boxStart + (span - 1)

    // Box must contain ALL pitch classes of the scale
    const found = collectScaleNotesInBox(scaleNotes, boxStart, boxEnd, fretCount)
    if (found.size !== requiredCount) continue

    const lowestRoot = findLowestRootInBox(keyIndex, boxStart, boxEnd, fretCount)
    if (!lowestRoot) continue

    // Finger is relative to boxStart (1..span). We only name fingers 1..4.
    const finger = (lowestRoot.fret - boxStart) + 1
    if (finger < 1 || finger > 4) continue

    shapes.push({
      name: `${lowestRoot.stringName}${finger}`,
      root: { stringIndex: lowestRoot.displayIndex, fret: lowestRoot.fret, finger },
      box: [boxStart, boxEnd],
      span
    })
  }

  // Sort by lowest root fret, then by pitch (E lowest)
  shapes.sort((a,b)=>{
    if (a.root.fret !== b.root.fret) return a.root.fret - b.root.fret
    // map display index to pitch rank
    const rank = (di) => (di===3?0:di===2?1:di===1?2:3)
    return rank(a.root.stringIndex) - rank(b.root.stringIndex)
  })

  return shapes
}
