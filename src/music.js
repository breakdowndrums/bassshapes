export const NOTES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export const NOTES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

export const KEYS = [
  { name:'C', prefer:'sharp' },
  { name:'Db', prefer:'flat' },
  { name:'D', prefer:'sharp' },
  { name:'Eb', prefer:'flat' },
  { name:'E', prefer:'sharp' },
  { name:'F', prefer:'flat' },
  { name:'Gb', prefer:'flat' },
  { name:'G', prefer:'sharp' },
  { name:'Ab', prefer:'flat' },
  { name:'A', prefer:'sharp' },
  { name:'Bb', prefer:'flat' },
  { name:'B', prefer:'sharp' },
]

export const SCALES = [
// Major scale modes (parent: Ionian)
  { name: 'Major (Ionian)', intervals: [0,2,4,5,7,9,11
]
},
  { name: 'Dorian', intervals: [0,2,3,5,7,9,10] },
  { name: 'Phrygian', intervals: [0,1,3,5,7,8,10] },
  { name: 'Lydian', intervals: [0,2,4,6,7,9,11] },
  { name: 'Mixolydian', intervals: [0,2,4,5,7,9,10] },
  { name: 'Natural Minor (Aeolian)', intervals: [0,2,3,5,7,8,10] },
  { name: 'Locrian', intervals: [0,1,3,5,6,8,10] },

  // Melodic minor and modes
  { name: 'Melodic minor', intervals: [0,2,3,5,7,9,11] },
  { name: 'Dorian ♭9', intervals: [0,1,3,5,7,9,10] },
  { name: 'Lydian ♯5', intervals: [0,2,4,6,8,9,11] },
  { name: 'Mixolydian ♯11', intervals: [0,2,4,6,7,9,10] },
  { name: 'Mixolydian ♭13', intervals: [0,2,4,5,7,8,10] },
  { name: 'Locrian ♮9', intervals: [0,2,3,5,6,8,10] },
  { name: 'Altered', intervals: [0,1,3,4,6,8,10] },
]

export function getNoteName(index, prefer) {
  return prefer === 'flat' ? NOTES_FLAT[index] : NOTES_SHARP[index]
}
