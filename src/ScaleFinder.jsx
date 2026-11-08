import { useMemo, useState } from 'react'
import { getNoteName } from './music'
import { findScales, degreeName } from './scaleMatch'
import FretGrid from './FretGrid'
import { upAndDown } from './usePlayer'

const FRET_COUNT = 21

/**
 * Scale finder: click notes on the fretboard, see which scales contain them.
 * Hover a result to preview its notes on the neck; click "Show" to open it in the scale view.
 */
export default function ScaleFinder({ tuningMidis, onOpenScale, vertical = false, player }) {
  // selected positions as "stringIndex:fret" (fret 0 = open string)
  const [selected, setSelected] = useState([])
  const [prefer, setPrefer] = useState('sharp')
  const [rootMode, setRootMode] = useState('any') // any | lowest
  const [hovered, setHovered] = useState(null) // match under the mouse
  const [pinned, setPinned] = useState(null) // match the user clicked

  const strings = tuningMidis.map((midi) => ({ openMidi: midi, openPc: ((midi % 12) + 12) % 12 }))

  const positions = selected.map((id) => {
    const [si, fret] = id.split(':').map(Number)
    const s = strings[si]
    if (!s) return null
    return { si, fret, midi: s.openMidi + fret, pc: (s.openPc + fret) % 12 }
  }).filter(Boolean)

  const selectedPcs = [...new Set(positions.map((p) => p.pc))]
  const lowest = positions.length ? positions.reduce((a, b) => (b.midi < a.midi ? b : a)) : null

  const groups = useMemo(
    () =>
      findScales(selectedPcs, {
        rootPc: rootMode === 'lowest' && lowest ? lowest.pc : null,
        lowestPc: lowest ? lowest.pc : null,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPcs.join(','), rootMode, lowest?.pc]
  )

  // drop a pinned match that no longer fits the selection
  const pinnedValid =
    pinned && groups.some((g) => g.matches.some((m) => m.keyIdx === pinned.keyIdx && m.scaleIdx === pinned.scaleIdx))
  const preview = hovered ?? (pinnedValid ? pinned : null)

  const matchCount = groups.reduce((n, g) => n + g.matches.length, 0)
  const nameOf = (pc, pref = prefer) => getNoteName(pc, pref)

  function toggle(si, fret) {
    const id = `${si}:${fret}`
    const adding = !selected.includes(id)
    if (adding) player?.tap(strings[si].openMidi + fret, id)
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // play what's selected, low to high and back
  function playSelection() {
    if (player.playing) return player.stop()
    player.play(upAndDown(positions.map((p) => ({ midi: p.midi, pos: `${p.si}:${p.fret}` }))), player.bpm)
  }

  // ---------- fretboard cell rendering ----------
  function renderDot(si, fret) {
    const s = strings[si]
    const pc = (s.openPc + fret) % 12
    const isSel = selected.includes(`${si}:${fret}`)
    const sounding = player?.active.has(`${si}:${fret}`)
    const pref = preview ? preview.prefer : prefer

    if (isSel) {
      const isRoot = preview ? pc === preview.keyIdx : lowest && lowest.si === si && lowest.fret === fret
      return (
        <div
          className={`relative z-20 rounded-full flex items-center justify-center text-xs font-semibold text-white transition ${sounding ? 'ring-4 ring-white scale-110' : 'ring-2 ring-white/80'} ${
            isRoot ? 'w-8 h-8 bg-red-500' : 'w-7 h-7 bg-blue-500'
          }`}
        >
          {preview ? degreeName(pc, preview.keyIdx) : nameOf(pc, pref)}
        </div>
      )
    }

    if (preview && preview.notes.includes(pc)) {
      const isRoot = pc === preview.keyIdx
      return (
        <div
          className={`relative z-20 w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white/80 ${
            isRoot ? 'bg-red-500/40' : 'bg-zinc-500/40'
          }`}
        >
          {nameOf(pc, pref)}
        </div>
      )
    }

    // empty cell: a faint hover target
    return <div className="relative z-20 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 bg-neutral-600/60" />
  }

  const fretboard = (
    <FretGrid
      strings={strings}
      fretCount={FRET_COUNT}
      vertical={vertical}
      onCellClick={toggle}
      cellLabel={(si, f) => `String ${si + 1}, ${f === 0 ? 'open' : `fret ${f}`}`}
      renderCell={(si, f) => {
        if (f > 0) return renderDot(si, f)
        const s = strings[si]
        if (selected.includes(`${si}:0`) || (preview && preview.notes.includes(s.openPc))) return renderDot(si, 0)
        return <span className="relative z-20 text-neutral-300 font-bold text-sm group-hover:text-white">{nameOf(s.openPc)}</span>
      }}
    />
  )

  // ---------- controls ----------
  const segBtn = (active) =>
    `px-3 py-1 text-sm ${active ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700/60'}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="text-sm text-neutral-300">
          {selectedPcs.length === 0 ? (
            'Click notes on the fretboard to find matching scales.'
          ) : (
            <>
              Selected:{' '}
              <span className="text-white font-semibold">{selectedPcs.map((pc) => nameOf(pc)).join('  ')}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300">Root</span>
          <div className="flex overflow-hidden rounded-md border border-neutral-700">
            <button type="button" className={segBtn(rootMode === 'any')} onClick={() => setRootMode('any')}>
              Any note
            </button>
            <button type="button" className={segBtn(rootMode === 'lowest')} onClick={() => setRootMode('lowest')}>
              Lowest note
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-300">Spelling</span>
          <div className="flex overflow-hidden rounded-md border border-neutral-700">
            <button type="button" className={segBtn(prefer === 'sharp')} onClick={() => setPrefer('sharp')}>
              ♯
            </button>
            <button type="button" className={segBtn(prefer === 'flat')} onClick={() => setPrefer('flat')}>
              ♭
            </button>
          </div>
        </div>

        {player && (
          <button
            type="button"
            onClick={playSelection}
            disabled={!selected.length}
            className="px-3 py-1.5 rounded border text-sm bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700/60 disabled:opacity-40"
          >
            {player.playing ? '■ Stop' : '▶ Play notes'}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setSelected([])
            setPinned(null)
            setHovered(null)
          }}
          disabled={!selected.length}
          className="px-3 py-1.5 rounded border text-sm bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60 disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {fretboard}

      {selectedPcs.length > 0 && (
        <div className="space-y-2" onMouseLeave={() => setHovered(null)}>
          <div className="flex flex-wrap items-center gap-3 min-h-[32px]">
          <div className="text-sm text-neutral-400">
            {matchCount === 0
              ? 'No scale in the list contains all of these notes.'
              : `${matchCount} scale${matchCount === 1 ? '' : 's'} in ${groups.length} note set${groups.length === 1 ? '' : 's'} — hover to preview, click to pin.`}
          </div>
          {pinnedValid && (
            <button
              type="button"
              onClick={() => onOpenScale?.(pinned.keyIdx, pinned.scaleIdx)}
              className="px-3 py-1 rounded border text-sm bg-red-500/20 border-red-500/50 text-white hover:bg-red-500/30"
            >
              Open {pinned.keyName} {pinned.scaleName} in scale view →
            </button>
          )}
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))' }}>
            {groups.map((g) => (
              <div key={g.setKey} className="rounded-md border border-neutral-800 bg-neutral-900 p-3">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">{g.family} family</div>
                  <div className="text-xs text-neutral-500">
                    adds{' '}
                    <span className="text-neutral-300">
                      {g.best.missing.length ? g.best.missing.map((pc) => nameOf(pc, g.best.prefer)).join(' ') : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.matches.map((m) => {
                    const active = pinnedValid && pinned.keyIdx === m.keyIdx && pinned.scaleIdx === m.scaleIdx
                    return (
                      <button
                        key={`${m.keyIdx}-${m.scaleIdx}`}
                        type="button"
                        onMouseEnter={() => setHovered(m)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setPinned(active ? null : m)}
                        onDoubleClick={() => onOpenScale?.(m.keyIdx, m.scaleIdx)}
                        className={`px-2 py-1 rounded text-sm border ${
                          active
                            ? 'bg-neutral-700 border-neutral-500 text-white'
                            : m.rootIsLowest
                            ? 'bg-red-500/15 border-red-500/40 text-white hover:bg-red-500/25'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700/60'
                        }`}
                        title={m.rootIsLowest ? 'Root is your lowest selected note' : undefined}
                      >
                        {m.keyName} {m.scaleName}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
