import { KEYS, SCALES } from './music'

// Which "family" (parent scale) a SCALES entry belongs to, by its index.
// Used only for grouping/sorting labels in the finder.
function familyOf(scaleIdx) {
  return scaleIdx < 7 ? 'Major' : 'Melodic minor'
}

// Scales whose names learners reach for first get a small ranking bonus.
const COMMON = new Set(['Major (Ionian)', 'Natural Minor (Aeolian)', 'Dorian', 'Mixolydian'])

/**
 * Find every key + scale that contains all selected pitch classes.
 *
 * Matches are grouped by their note set: C Ionian, D Dorian, E Phrygian …
 * contain the same seven notes, so they appear as one group with several
 * possible roots. The groups are ranked so the most useful answer comes first.
 *
 * @param {number[]} selectedPcs  pitch classes (0–11), unique
 * @param {object}   opts
 * @param {number|null} opts.rootPc  if set, only scales with this root are kept
 * @param {number|null} opts.lowestPc  pitch class of the lowest selected note (ranking hint)
 */
export function findScales(selectedPcs, { rootPc = null, lowestPc = null } = {}) {
  if (!selectedPcs.length) return []
  const groups = new Map()

  KEYS.forEach((key, keyIdx) => {
    SCALES.forEach((scale, scaleIdx) => {
      if (rootPc !== null && keyIdx !== rootPc) return
      const notes = scale.intervals.map((i) => (keyIdx + i) % 12)
      if (!selectedPcs.every((pc) => notes.includes(pc))) return

      const setKey = [...notes].sort((a, b) => a - b).join(',')
      if (!groups.has(setKey)) {
        groups.set(setKey, { setKey, notes: [...notes].sort((a, b) => a - b), family: familyOf(scaleIdx), matches: [] })
      }
      groups.get(setKey).matches.push({
        keyIdx,
        scaleIdx,
        keyName: key.name,
        prefer: key.prefer,
        scaleName: scale.name,
        notes,
        missing: notes.filter((n) => !selectedPcs.includes(n)),
        rootIsLowest: lowestPc !== null && keyIdx === lowestPc,
        rootSelected: selectedPcs.includes(keyIdx),
      })
    })
  })

  const score = (m) =>
    (m.rootIsLowest ? 100 : 0) + (m.rootSelected ? 10 : 0) + (COMMON.has(m.scaleName) ? 3 : 0) + (m.scaleIdx < 7 ? 1 : 0)

  const out = [...groups.values()].map((g) => {
    g.matches.sort((a, b) => score(b) - score(a) || a.keyIdx - b.keyIdx)
    g.best = g.matches[0]
    g.score = score(g.best)
    return g
  })

  out.sort((a, b) => b.score - a.score || (a.family === b.family ? 0 : a.family === 'Major' ? -1 : 1) || a.best.keyIdx - b.best.keyIdx)
  return out
}

// Interval name relative to a root, for showing what each selected note "is" in a scale.
const DEGREE_NAMES = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7']
export function degreeName(pc, rootPc) {
  return DEGREE_NAMES[(pc - rootPc + 12) % 12]
}
