import { Fragment, useEffect, useState } from 'react'

const MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21]
// Layout-critical styles are inline on purpose, so the neck never depends on
// Tailwind having generated a class (e.g. a dev server that missed a new file).
const STRING_COLOR = '#404040' // neutral-700
const NUT_COLOR = '#a3a3a3' // neutral-400
const LABEL = { fontSize: 12, color: '#a1a1aa', textAlign: 'center', userSelect: 'none' }

const marker = (f) => (MARKERS.includes(f) ? (f === 12 ? '●●' : '●') : '')

/** true when the viewport is phone-sized */
export function useIsNarrow(query = '(max-width: 700px)') {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches
  const [narrow, setNarrow] = useState(get)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return narrow
}

/**
 * Draws the neck (strings, frets, nut, inlays, fret numbers) and one clickable cell per
 * string × fret, including fret 0 (the open string). What goes *inside* each cell comes
 * from `renderCell(stringIndex, fret)`.
 *
 * Horizontal: strings are rows (highest pitch on top), frets run left → right.
 * Vertical (phones): strings are columns (lowest pitch on the left), frets run top → bottom,
 * like looking down at a bass standing upright.
 *
 * @param strings  display order, highest pitch first: [{ openMidi }]
 */
export default function FretGrid({ strings, fretCount = 21, vertical = false, renderCell, onCellClick, cellLabel }) {
  const n = strings.length
  const frets = Array.from({ length: fretCount + 1 }, (_, f) => f)

  const wire = (f) => (f === 0 ? NUT_COLOR : STRING_COLOR)

  const cell = (si, f, { first, last }) => (
    <button
      key={`${si}:${f}`}
      type="button"
      onClick={() => onCellClick?.(si, f)}
      aria-label={cellLabel?.(si, f)}
      className="group focus:outline-none"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: vertical ? (f === 0 ? 48 : 40) : 48,
        paddingRight: !vertical && f === 0 ? 12 : 0,
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
      }}
    >
      {/* the string */}
      {f > 0 && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 0,
            background: STRING_COLOR,
            ...(vertical
              ? { top: 0, bottom: 0, left: 'calc(50% - 1px)', width: 2 }
              : { left: 0, right: 0, top: 'calc(50% - 1px)', height: 2 }),
          }}
        />
      )}
      {/* the fret wire at the far edge of this cell (nut when f === 0) */}
      <div
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: 10,
          background: wire(f),
          ...(vertical
            ? { height: 2, bottom: -1, left: first ? '50%' : 0, right: last ? '50%' : 0 }
            : { width: 2, right: -1, top: first ? '50%' : 0, bottom: last ? '50%' : 0 }),
        }}
      />
      {renderCell(si, f)}
    </button>
  )

  if (!vertical) {
    const cols = `56px repeat(${fretCount}, 40px)`
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-grid', gridTemplateColumns: cols, userSelect: 'none' }}>
          <div />
          {frets.slice(1).map((f) => (
            <div key={f} style={{ ...LABEL, height: 20 }}>
              {marker(f)}
            </div>
          ))}

          {strings.map((_, si) => (
            <Fragment key={si}>{frets.map((f) => cell(si, f, { first: si === 0, last: si === n - 1 }))}</Fragment>
          ))}

          <div />
          {frets.slice(1).map((f) => (
            <div key={f} style={{ ...LABEL, paddingTop: 4 }}>
              {f}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // vertical: lowest string on the left
  const order = strings.map((_, si) => si).sort((a, b) => strings[a].openMidi - strings[b].openMidi)
  const cols = `28px repeat(${n}, 48px) 20px`
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'inline-grid', gridTemplateColumns: cols, userSelect: 'none' }}>
        {frets.map((f) => (
          <Fragment key={f}>
            <div style={{ ...LABEL, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
              {f > 0 ? f : ''}
            </div>
            {order.map((si, col) => cell(si, f, { first: col === 0, last: col === n - 1 }))}
            <div
              style={{ ...LABEL, fontSize: 10, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl' }}
            >
              {f > 0 ? marker(f) : ''}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
