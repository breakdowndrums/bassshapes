
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
  { name:'Major', intervals:[0,2,4,5,7,9,11] },
  { name:'Natural Minor', intervals:[0,2,3,5,7,8,10] },
]

export function getNoteName(index, prefer) {
  return prefer === 'flat' ? NOTES_FLAT[index] : NOTES_SHARP[index]
}
