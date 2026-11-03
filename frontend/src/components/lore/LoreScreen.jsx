import { useEffect, useMemo, useRef, useState } from 'react'
import { createLore, deleteLore, fetchLore, updateLore } from '../../api/lore.js'
import { fetchPois } from '../../api/map.js'
import { fetchRecipients } from '../../api/master.js'
import { KIND_LABELS, LoreCard } from './LoreEntryView.jsx'
import LoreEntryView from './LoreEntryView.jsx'
import LoreForm from './LoreForm.jsx'
import '../../styles/map.css'
import '../../styles/lore.css'

const FILTERS = [['ALL', 'Tudo'], ['CHARACTER', 'Personagens'], ['PLACE', 'Lugares'], ['REGION', 'Regiões']]

const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Lore da mesa em tela cheia: o jogador lê o que conhece e o mestre escreve e libera.
// startDraft: abre direto o formulário de verbete novo, já preenchido (o painel da região usa para criar a região ou um personagem dela).
export default function LoreScreen({ session, startId, startDraft, onClose, onShowOnMap }) {
  const master = Boolean(session.master)
  const [entries, setEntries] = useState(null)
  const [pois, setPois] = useState([])
  const [players, setPlayers] = useState([])
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(startId ?? null)
  const [editing, setEditing] = useState(startDraft ? 'new' : null) // null | 'new' | id
  const closeBtn = useRef(null)
  const body = useRef(null)
  const draft = useRef(startDraft) // o preenchimento vale só para o primeiro verbete novo

  useEffect(() => {
    fetchLore(session.token).then(setEntries).catch(err => setError(err.message))
    fetchPois(session.token).then(setPois).catch(() => {})
    if (master) fetchRecipients(session.token).then(setPlayers).catch(() => {})
    closeBtn.current?.focus()
  }, [session.token, master])

  const open = id => {
    setEditing(null)
    setOpenId(id)
    body.current?.scrollTo(0, 0)
  }

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      if (editing !== null) setEditing(null)
      else if (openId !== null) setOpenId(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, openId, onClose])

  const shown = useMemo(() => {
    const term = normalize(search.trim())
    return (entries ?? []).filter(e => (filter === 'ALL' || e.kind === filter)
      && (!term || normalize(e.name + ' ' + (e.subtitle ?? '')).includes(term)))
  }, [entries, filter, search])

  const reload = () => fetchLore(session.token).then(setEntries)

  const save = async form => {
    const saved = editing === 'new' ? await createLore(session.token, form) : await updateLore(session.token, editing, form)
    await reload()
    open(saved.id)
  }

  const remove = async entry => {
    await deleteLore(session.token, entry.id)
    await reload()
    setEditing(null)
    setOpenId(null)
  }

  const entry = entries?.find(e => e.id === openId)
  const mapTargetOf = item => {
    if (item.mapSlug) return { slug: item.mapSlug }
    const poi = pois.find(p => p.loreEntryId === item.id)
    return poi ? { poiId: poi.id } : null
  }

  return (
    <div className="lore-screen" role="dialog" aria-modal="true" aria-label="Lore de Runeterra">
      <div className="lore-top">
        {(openId !== null || editing !== null)
          ? <button type="button" className="lore-back" onClick={() => (editing !== null ? setEditing(null) : setOpenId(null))}>‹ {editing !== null ? 'Voltar' : 'Toda a lore'}</button>
          : <h1>LORE</h1>}
        <button ref={closeBtn} className="map-btn" type="button" onClick={onClose} title="Fechar a lore" aria-label="Fechar a lore">×</button>
      </div>

      <div className="lore-body" ref={body}>
        {error && <p className="lore-empty" role="alert">{error}</p>}
        {!error && entries === null && <p className="lore-empty">Abrindo os arquivos…</p>}

        {entries && editing !== null && (
          <LoreForm
            key={editing}
            entry={editing === 'new' ? null : entries.find(e => e.id === editing)}
            draft={editing === 'new' ? draft.current : undefined}
            entries={entries}
            players={players}
            onSave={save}
            onDelete={remove}
            onCancel={() => setEditing(null)}
          />
        )}

        {entries && editing === null && entry && (
          <LoreEntryView
            key={entry.id}
            entry={entry}
            master={master}
            mapTarget={mapTargetOf(entry)}
            onOpen={open}
            onShowOnMap={onShowOnMap}
            onEdit={() => setEditing(entry.id)}
          />
        )}

        {entries && editing === null && !entry && (
          <>
            <div className="lore-toolbar">
              <div className="lore-filters" role="group" aria-label="Filtrar por tipo">
                {FILTERS.map(([id, label]) => (
                  <button key={id} type="button" className={'lore-filter' + (filter === id ? ' on' : '')} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
                ))}
              </div>
              <input className="lore-search" type="search" aria-label="Buscar na lore" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
              {master && <button type="button" className="lore-action" onClick={() => { draft.current = undefined; setEditing('new') }}>NOVO VERBETE</button>}
            </div>
            {shown.length === 0 && (
              <p className="lore-empty">
                {entries.length > 0 ? 'Nada encontrado.' : master ? 'A lore ainda está em branco. Crie o primeiro verbete.' : 'Você ainda não descobriu nada. Isso vai mudar.'}
              </p>
            )}
            <div className="lore-grid">
              {shown.map(item => <LoreCard key={item.id} item={item} onOpen={open} />)}
            </div>
            {master && shown.length > 0 && <p className="lore-count">{entries.length} verbetes · {Object.entries(KIND_LABELS).map(([id, label]) => label + ': ' + entries.filter(e => e.kind === id).length).join(' · ')}</p>}
          </>
        )}
      </div>
    </div>
  )
}
