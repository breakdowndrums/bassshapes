
const STRINGS_DISPLAY = [
  { name:'G', note:7 }, // display index 0
  { name:'D', note:2 }, // 1
  { name:'A', note:9 }, // 2
  { name:'E', note:4 }, // 3
]

// Pitch order (lowest to highest) for choosing the "lowest" root
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
      if (fret < 0 || fret > fretCount) continue
      const note = (open + fret) % 12
      if (scaleNotes.includes(note)) found.add(note)
    }
  }
  return found
}

function findLowestRootInBox(keyIndex, boxStart, boxEnd, fretCount) {
  // Lowest means lowest-pitched string first (E->A->D->G), then lowest fret.
  for (const s of STRINGS_PITCH) {
    for (let fret = boxStart; fret <= boxEnd; fret++) {
      if (fret < 0 || fret > fretCount) continue
      const note = (s.note + fret) % 12
      if (note !== keyIndex) continue
      return { displayIndex: s.displayIndex, fret, stringName: s.name }
    }
  }
  return null
}

function fingerFromBox(boxStart, rootFret) {
  // Normal boxes: boxStart..boxStart+span-1 maps to fingers 1..span (up to 4)
  // Special case when boxStart==0: fret 0 is open string (no finger),
  // so fret 1 => finger 1, fret 2 => finger 2, etc.
  if (boxStart === 0) {
    if (rootFret === 0) return 1 // treat open root as index for naming
    return rootFret // fret number equals finger number
  }
  return (rootFret - boxStart) + 1
}

export function generateShapes(keyIndex, scale, opts = {}) {
  const fretCount = opts.fretCount ?? 21 // highest fret shown in grid (1..21); open is 0
  const span = opts.span ?? 4 // 4 or 5
  const scaleNotes = scale.intervals.map(i => (keyIndex + i) % 12)
  const requiredCount = scaleNotes.length
  const shapes = []

  // Enumerate boxes, allowing boxStart = 0 (open string included)
  for (let boxStart = 0; boxStart <= fretCount - span + 1; boxStart++) {
    const boxEnd = boxStart + (span - 1)

    // Box must contain ALL pitch classes of the scale
    const found = collectScaleNotesInBox(scaleNotes, boxStart, boxEnd, fretCount)
    if (found.size !== requiredCount) continue

    const lowestRoot = findLowestRootInBox(keyIndex, boxStart, boxEnd, fretCount)
    if (!lowestRoot) continue

    const finger = fingerFromBox(boxStart, lowestRoot.fret)
    if (finger < 1 || finger > 4) continue

    shapes.push({
      name: `${lowestRoot.stringName}${finger}`,
      root: { stringIndex: lowestRoot.displayIndex, fret: lowestRoot.fret, finger },
      box: [boxStart, boxEnd],
      span
    })
  }

  shapes.sort((a,b)=>{
    if (a.root.fret !== b.root.fret) return a.root.fret - b.root.fret
    const rank = (di) => (di===3?0:di===2?1:di===1?2:3)
    return rank(a.root.stringIndex) - rank(b.root.stringIndex)
  })

  return shapes
}
