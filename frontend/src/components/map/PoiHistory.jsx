import { useCallback, useEffect, useState } from 'react'
import { createJournalEntry } from '../../api/journal.js'
import { fetchPoiHistory } from '../../api/map.js'

const EVENT_ICON = { LOOT: '◆', GOLD: '●', DOWNED: '✝', DOCUMENT: '✉', LEVEL_UP: '▲', PLACE: '⌖' }
const fmt = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// "Aconteceu aqui": o diário ligado ao ponto e as paradas da viagem perto dele; qualquer um que vê o ponto escreve sobre ele.
export default function PoiHistory({ token, poi }) {
  const [history, setHistory] = useState(null)
  const [text, setText] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => fetchPoiHistory(token, poi.id).then(setHistory), [token, poi.id])
  useEffect(() => { load().catch(() => setHistory({ entries: [], stops: [] })) }, [load])

  const submit = async e => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setMsg(null)
    try {
      await createJournalEntry(token, { title: '', body: text.trim(), poiId: poi.id })
      setText('')
      await load()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  const entries = history?.entries ?? []
  const stops = history?.stops ?? []
  return (
    <section className="map-history" aria-label="Aconteceu aqui">
      <div className="lore-rule" aria-hidden="true" />
      <h3>Aconteceu aqui</h3>
      {history && entries.length === 0 && stops.length === 0 && <p className="lore-form-hint">Nada registrado neste lugar ainda.</p>}
      {stops.length > 0 && (
        <ul className="map-history-list">
          {stops.map((s, i) => <li key={'s' + i} className="stop"><span aria-hidden="true">⚑</span> O grupo esteve aqui{s.label ? ': ' + s.label : ''} <time dateTime={s.createdAt}>{fmt(s.createdAt)}</time></li>)}
        </ul>
      )}
      <ul className="map-history-list">
        {entries.map(e => (
          <li key={e.id} className={e.kind === 'NOTE' ? 'note' : 'event'}>
            {e.kind === 'NOTE'
              ? <><b>{e.who}</b> <time dateTime={e.createdAt}>{fmt(e.createdAt)}</time>{e.title && <strong>{e.title}</strong>}{e.body && <p>{e.body}</p>}</>
              : <><span aria-hidden="true">{EVENT_ICON[e.kind]}</span> {e.title} <time dateTime={e.createdAt}>{fmt(e.createdAt)}</time></>}
          </li>
        ))}
      </ul>
      <form className="lore-form map-comment-form" onSubmit={submit}>
        <textarea aria-label="Escrever no diário sobre este local" rows={2} maxLength={8000} value={text} onChange={e => setText(e.target.value)} placeholder="O que aconteceu aqui? Vai para o diário do grupo." />
        {msg && <p className="lore-form-error" role="alert">{msg}</p>}
        <button type="submit" className="lore-action ghost" disabled={busy || !text.trim()}>ESCREVER NO DIÁRIO</button>
      </form>
    </section>
  )
}
