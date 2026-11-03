import { useCallback, useEffect, useMemo, useState } from 'react'
import { createJournalEntry, deleteJournalEntry, fetchJournal, updateJournalEntry } from '../../api/journal.js'
import { sessionSummaries } from '../../data/journal.js'
import '../../styles/journal.css'

const POLL = 15000
const EMPTY = { title: '', body: '' }
const EVENT_ICON = { LOOT: '◆', GOLD: '●', DOWNED: '✝', DOCUMENT: '✉', LEVEL_UP: '▲' }
const fmtTime = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const fmtDay = key => new Date(key + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

// Diário do grupo (ficha e painel do mestre): a crônica que todos escrevem, os eventos que entram sozinhos
// (loot, ouro, quedas a 0 PV, documentos, subidas de nível) e o resumo de cada sessão (um por dia).
export default function GroupJournal({ token, onError, onToast }) {
  const [entries, setEntries] = useState(null)
  const [view, setView] = useState('chronicle')
  const [draft, setDraft] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => fetchJournal(token).then(setEntries), [token])
  useEffect(() => {
    load().catch(onError)
    const t = setInterval(() => { if (!document.hidden) load().catch(() => {}) }, POLL)
    return () => clearInterval(t)
  }, [load, onError])

  const summaries = useMemo(() => sessionSummaries(entries ?? []), [entries])

  const save = e => {
    e.preventDefault()
    if (!draft.title.trim() && !draft.body.trim()) return onToast?.('Escreva algo no diário.')
    setBusy(true)
    const call = editing ? updateJournalEntry(token, editing, draft) : createJournalEntry(token, draft)
    call.then(() => { setDraft(EMPTY); setEditing(null); onToast?.(editing ? 'Entrada salva.' : 'Escrito no diário do grupo.'); return load() })
      .catch(onError)
      .finally(() => setBusy(false))
  }
  const edit = entry => { setEditing(entry.id); setDraft({ title: entry.title ?? '', body: entry.body ?? '' }) }
  const remove = entry => {
    if (!window.confirm('Apagar esta entrada do diário?')) return
    deleteJournalEntry(token, entry.id).then(load).catch(onError)
  }

  return (
    <div className="gj">
      <div className="card-title gj-head">
        <h3>Diário do grupo <small>a crônica da mesa</small></h3>
        <div className="seg" role="group" aria-label="Vista do diário">
          <button type="button" className={view === 'chronicle' ? 'on' : ''} aria-pressed={view === 'chronicle'} onClick={() => setView('chronicle')}>Crônica</button>
          <button type="button" className={view === 'sessions' ? 'on' : ''} aria-pressed={view === 'sessions'} onClick={() => setView('sessions')}>Resumo das sessões</button>
        </div>
      </div>

      {view === 'chronicle' && (
        <div className="gj-body">
          <form className="gj-form" onSubmit={save}>
            <input className="gj-title-in" value={draft.title} maxLength={120} placeholder="Título (opcional)" onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            <textarea className="gj-body-in" rows={3} maxLength={8000} value={draft.body} placeholder="O que aconteceu hoje? Todos da mesa vão ler."
              onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} />
            <div className="gj-form-foot">
              {editing && <button type="button" className="link-btn" onClick={() => { setEditing(null); setDraft(EMPTY) }}>Cancelar edição</button>}
              <button className="btn" type="submit" disabled={busy}>{editing ? 'SALVAR' : 'ESCREVER'}</button>
            </div>
          </form>

          {entries === null && <div className="sheet-state" role="status"><div className="hex-spinner" />Abrindo o diário…</div>}
          {entries?.length === 0 && <p className="muted-note">Nada escrito ainda. Os acontecimentos da mesa também entram aqui sozinhos.</p>}
          <ol className="gj-list">
            {entries?.map((e, n) => e.kind === 'NOTE' ? (
              <li key={e.id} className="gj-note" style={{ '--n': Math.min(n, 12) }}>
                <div className="gj-note-head">
                  <b>{e.who}</b>
                  <time dateTime={e.createdAt}>{fmtTime(e.createdAt)}{e.updatedAt && e.updatedAt !== e.createdAt && ' · editado'}</time>
                </div>
                {e.title && <h4>{e.title}</h4>}
                {e.body && <p>{e.body}</p>}
                {e.mine && (
                  <div className="gj-actions">
                    <button type="button" className="link-btn" onClick={() => edit(e)}>Editar</button>
                    <button type="button" className="link-btn danger" onClick={() => remove(e)}>Apagar</button>
                  </div>
                )}
              </li>
            ) : (
              <li key={e.id} className={'gj-event ' + e.kind.toLowerCase()} style={{ '--n': Math.min(n, 12) }}>
                <span className="gj-icon" aria-hidden="true">{EVENT_ICON[e.kind]}</span>
                <span className="gj-event-text">{e.title}</span>
                <time dateTime={e.createdAt}>{fmtTime(e.createdAt)}</time>
                {e.mine && <button type="button" className="gj-x" aria-label="Apagar evento" title="Apagar evento" onClick={() => remove(e)}>×</button>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {view === 'sessions' && (
        <div className="gj-sessions">
          {summaries.length === 0 && <p className="muted-note">Nenhuma sessão registrada ainda.</p>}
          {summaries.map((s, n) => (
            <article key={s.date} className="gj-session" style={{ '--n': Math.min(n, 12) }}>
              <header>
                <h4>{fmtDay(s.date)}</h4>
                {s.people.length > 0 && <small>{s.people.join(', ')}</small>}
              </header>
              <div className="gj-stats">
                <Stat label="Itens" value={s.loot.length} />
                <Stat label="Ouro" value={s.gold + ' PO'} />
                <Stat label="Quedas" value={s.downed.length} tone={s.downed.length ? 'bad' : ''} />
                <Stat label="Documentos" value={s.documents.length} />
                <Stat label="Entradas" value={s.notes} />
              </div>
              <ul className="gj-highlights">
                {s.levelUps.map(t => <li key={t} className="level_up">▲ {t}</li>)}
                {s.downed.length > 0 && <li className="downed">✝ Caíram a 0 PV: {s.downed.join(', ')}</li>}
                {s.loot.map((t, i) => <li key={i} className="loot">◆ {t}</li>)}
                {s.documents.map((t, i) => <li key={'d' + i} className="document">✉ {t}</li>)}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone = '' }) {
  return (
    <div className={'gj-stat ' + tone}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}
