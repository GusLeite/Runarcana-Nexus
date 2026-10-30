import { useEffect, useMemo, useRef, useState } from 'react'
import { spellLevelName, togglePick } from '../../data/rules.js'

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Descanso longo de quem prepara magias (Acólito, Xamã): escolhe as preparadas de cada classe, até o limite,
// e só então descansa. preparation vem de GET /character/me/preparation; onConfirm recebe { classe: [chaves] }.
export default function PrepareSpells({ preparation, busy, onConfirm, onCancel }) {
  const [picks, setPicks] = useState(() => Object.fromEntries(preparation.classes.map(c => [c.classId, c.prepared])))
  const [query, setQuery] = useState('')
  const box = useRef()

  useEffect(() => {
    box.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const q = fold(query.trim())
  const many = preparation.classes.some(c => c.options.length > 12)

  return (
    <div className="prep-overlay" role="presentation" onClick={onCancel}>
      <div className="prep card" role="dialog" aria-modal="true" aria-labelledby="prep-title" tabIndex={-1} ref={box}
        onClick={e => e.stopPropagation()}>
        <h3 className="card-title" id="prep-title">Descanso longo <small>escolha as magias preparadas</small></h3>
        {many && (
          <input className="her-search prep-search" type="search" placeholder="Buscar magia…" value={query}
            onChange={e => setQuery(e.target.value)} aria-label="Buscar magia" />
        )}
        <div className="prep-body">
          {preparation.classes.map(c => (
            <ClassPick key={c.classId} c={c} q={q} current={picks[c.classId] ?? []}
              onChange={list => setPicks(p => ({ ...p, [c.classId]: list }))} />
          ))}
        </div>
        <div className="prep-foot">
          <button type="button" className="ghost-btn small" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn" disabled={busy} onClick={() => onConfirm(picks)}>{busy ? 'DESCANSANDO…' : 'DESCANSAR'}</button>
        </div>
      </div>
    </div>
  )
}

function ClassPick({ c, q, current, onChange }) {
  const groups = useMemo(() => {
    const byLevel = new Map()
    c.options.filter(o => !q || fold(o.name).includes(q) || current.includes(o.key))
      .forEach(o => byLevel.set(o.level, [...(byLevel.get(o.level) ?? []), o]))
    return [...byLevel].sort((a, b) => a[0] - b[0])
  }, [c, q, current])
  const full = current.length >= c.limit

  return (
    <section className="prep-class">
      <div className="choice-head">
        <span className="choice-label">
          {c.name}: até {c.limit} {c.limit === 1 ? 'magia' : 'magias'}
          {c.maxSpellLevel != null ? ' (até o ' + c.maxSpellLevel + 'º nível)' : ' entre os feitiços conhecidos'}
        </span>
        <span className={'choice-count' + (current.length <= c.limit ? ' ok' : '')}>{current.length}/{c.limit}</span>
      </div>
      {c.options.length === 0 && <p className="muted-note">Nada para preparar ainda.</p>}
      {groups.map(([level, list]) => (
        <div key={level} className="choice-group">
          <div className="choice-group-title">{spellLevelName(level)}</div>
          <div className="to-pick">
            {list.map(o => {
              const on = current.includes(o.key)
              return (
                <button key={o.key} type="button" className={'to-chip' + (on ? ' on' : '')} aria-pressed={on} disabled={!on && full}
                  onClick={() => onChange(togglePick(current, o.key, c.limit))}>{o.name}</button>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}
