const STRINGS_DISPLAY = [
  { name:'G', note:7 },
  { name:'D', note:2 },
  { name:'A', note:9 },
  { name:'E', note:4 },
]

const STRINGS_PITCH = [
  { name:'E', note:4, displayIndex:3 },
  { name:'A', note:9, displayIndex:2 },
  { name:'D', note:2, displayIndex:1 },
  { name:'G', note:7, displayIndex:0 },
]

function coverageSignature(scaleNotes, boxStart, boxEnd, fretCount) {
  const out = []
  STRINGS_DISPLAY.forEach((s, si) => {
    for (let fret = boxStart; fret <= boxEnd; fret++) {
      if (fret < 0 || fret > fretCount) continue
      const note = (s.note + fret) % 12
      if (scaleNotes.includes(note)) out.push(`${si}:${fret}`)
    }
  })
  return out.sort().join(',')
}

function countNotesPerString(scaleNotes, boxStart, boxEnd, fretCount) {
  const counts = Array(STRINGS_DISPLAY.length).fill(0)
  STRINGS_DISPLAY.forEach((s, si) => {
    for (let fret = boxStart; fret <= boxEnd; fret++) {
      if (fret < 0 || fret > fretCount) continue
      const note = (s.note + fret) % 12
      if (scaleNotes.includes(note)) counts[si]++
    }
  })
  return counts
}

function countScaleNotesOnFrets(scaleNotes, frets, fretCount) {
  // counts positions (string,fret) for the given frets that are scale notes
  let c = 0
  STRINGS_DISPLAY.forEach((s) => {
    for (const fret of frets) {
      if (fret < 0 || fret > fretCount) continue
      const note = (s.note + fret) % 12
      if (scaleNotes.includes(note)) c++
    }
  })
  return c
}

function chooseFiveFretMode(scaleNotes, boxStart, fretCount) {
  // 5-fret boxes: default to INDEX covering two frets (easier on bass).
  // Switch to PINKY covering the two highest frets only when the highest fret has relatively few notes.
  //
  // Rule:
  // c4  = number of scale-note positions on the highest fret (boxStart+4)
  // c34 = number of scale-note positions on the two highest frets (boxStart+3 and boxStart+4)
  // If c4 is less than half of c34 (i.e. c4*2 < c34), use PINKY; otherwise use INDEX.
  const c4 = countScaleNotesOnFrets(scaleNotes, [boxStart + 4], fretCount)
  const c34 = countScaleNotesOnFrets(scaleNotes, [boxStart + 3, boxStart + 4], fretCount)
  if (c4 * 2 < c34) return 'pinky'
  return 'index'
}

function chooseOpenDoubleBassMode(scaleNotes, boxStart, boxEnd, fretCount) {
  // Open-string double bass fingering:
  // - fingers used: 1,2,4 (skip 3)
  // - if box needs 4 fretted frets (1..4), one finger covers two frets:
  //   A) index covers frets 1&2   OR   B) pinky covers frets 3&4
  //
  // Rule: choose the option with the least number of scale-note positions on the doubled frets.
  // Tie-break: prefer INDEX (matches your C major example expectation).
  const needsFourFrettedFrets = (boxStart === 0 && boxEnd >= 4)
  if (!needsFourFrettedFrets) return 'none'
  const indexCount = countScaleNotesOnFrets(scaleNotes, [1, 2], fretCount)
  const pinkyCount = countScaleNotesOnFrets(scaleNotes, [3, 4], fretCount)
  if (indexCount < pinkyCount) return 'index'
  if (pinkyCount < indexCount) return 'pinky'
  return 'index'
}

function fingerForOpenDoubleBass(span, openMode, fret) {
  // Open string itself (fret 0) has no finger; for naming we treat it as finger 1 if it's the root.
  if (fret === 0) return 1

  // 0..3 boxes (frets 1..3): standard double bass fingering 1-2-4 across 3 frets
  if (span === 4) {
    if (fret === 1) return 1
    if (fret === 2) return 2
    return 4 // fret 3
  }

  // 0..4 boxes (frets 1..4): need one doubled finger
  if (openMode === 'pinky') {
    // fret1 -> 1, fret2 -> 2, fret3 -> 4, fret4 -> 4
    if (fret === 1) return 1
    if (fret === 2) return 2
    return 4
  }

  // default/index mode:
  // fret1 -> 1, fret2 -> 1, fret3 -> 2, fret4 -> 4
  if (fret === 1) return 1
  if (fret === 2) return 1
  if (fret === 3) return 2
  return 4
}

function fingerForFret(boxStart, boxEnd, span, mode, openMode, fret) {
  // OPEN STRING SHAPES → double bass fingering (boxStart == 0)
  if (boxStart === 0) {
    return fingerForOpenDoubleBass(span, openMode, fret)
  }

  // span 4: straight one-fret-per-finger
  if (span === 4) {
    return (fret - boxStart) + 1
  }

  // span 5: choose index vs pinky covering 2 frets
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

function findLowestRootInBox(keyIndex, boxStart, boxEnd, fretCount) {
  for (const s of STRINGS_PITCH) {
    for (let fret = boxStart; fret <= boxEnd; fret++) {
      if (fret < 0 || fret > fretCount) continue
      const note = (s.note + fret) % 12
      if (note === keyIndex) {
        return { displayIndex: s.displayIndex, fret, stringName: s.name }
      }
    }
  }
  return null
}

export function generateShapes(keyIndex, scale, opts = {}) {
  const fretCount = opts.fretCount ?? 21
  const span = opts.span ?? 4
  const scaleNotes = scale.intervals.map(i => (keyIndex + i) % 12)
  const requiredCount = scaleNotes.length
  const shapes = []

  for (let boxStart = 0; boxStart <= fretCount - span + 1; boxStart++) {
    const boxEnd = boxStart + (span - 1)

    // must contain all pitch classes of the scale (across all strings) within the box
    const found = new Set()
    STRINGS_DISPLAY.forEach((s) => {
      for (let fret = boxStart; fret <= boxEnd; fret++) {
        if (fret < 0 || fret > fretCount) continue
        const note = (s.note + fret) % 12
        if (scaleNotes.includes(note)) found.add(note)
      }
    })
    if (found.size !== requiredCount) continue

    // 3NPS constraint
    const counts = countNotesPerString(scaleNotes, boxStart, boxEnd, fretCount)
    if (!counts.every(c => c === 3)) continue

    const root = findLowestRootInBox(keyIndex, boxStart, boxEnd, fretCount)
    if (!root) continue

    const usesDoubleBass = (boxStart === 0)
    const openMode = usesDoubleBass ? chooseOpenDoubleBassMode(scaleNotes, boxStart, boxEnd, fretCount) : 'none'
    const mode = (!usesDoubleBass && span === 5) ? chooseFiveFretMode(scaleNotes, boxStart, fretCount) : 'none'

    let finger = fingerForFret(boxStart, boxEnd, span, mode, openMode, root.fret)
    
    shapes.push({
      name: usesDoubleBass
        ? `${root.stringName}${finger}`
        : `${root.stringName}${finger}`,
      root: { stringIndex: root.displayIndex, fret: root.fret, finger },
      box: [boxStart, boxEnd],
      span,
      mode,
      openMode,
      doubleBass: usesDoubleBass,
      sig: coverageSignature(scaleNotes, boxStart, boxEnd, fretCount),
    })
  }

  return shapes
}
