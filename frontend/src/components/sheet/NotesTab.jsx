import { useEffect, useRef, useState } from 'react'
import { formatDateTime } from '../../data/rules.js'
import { PinIcon } from './icons.jsx'
import { afterLeave } from '../../utils/motion.js'

const SAVE_DELAY = 700

// Aba de anotações do jogador: lista à esquerda e editor à direita, que salva sozinho enquanto digita.
export default function NotesTab({ notes, selectedId, onSelect, onCreate, onSave, onDelete, busy }) {
  const selected = notes.find(n => n.id === selectedId) ?? notes[0]
  const [leavingId, setLeavingId] = useState(null)
  // A linha encolhe antes de a nota sair da lista.
  const remove = note => {
    setLeavingId(note.id)
    afterLeave(() => { onDelete(note); setLeavingId(null) })
  }

  return (
    <div className="notes">
      <div className="note-list">
        <div className="card-title inv-title">
          <h3>Anotações <small>{notes.length} {notes.length === 1 ? 'nota' : 'notas'}</small></h3>
          <button type="button" className="ghost-btn small" disabled={busy} onClick={onCreate}>+ Nova</button>
        </div>
        {notes.length === 0 && <p className="muted-note">Nada anotado ainda. Crie uma nota para pistas, nomes e planos do grupo.</p>}
        <ul className="docs">
          {notes.map((note, n) => (
            <li key={note.id}>
              <button type="button" className={'doc-row note-row' + (note.id === selected?.id ? ' on' : '') + (note.id === leavingId ? ' leaving' : '')} style={{ '--n': n }} onClick={() => onSelect(note.id)}>
                <span className="doc-info">
                  <span className="doc-name">{note.pinned && <PinIcon />}{note.title}</span>
                  <span className="doc-meta">{preview(note.body)}</span>
                </span>
                <span className="note-date">{formatDateTime(note.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="note-editor-wrap">
        {selected
          ? <NoteEditor key={selected.id} note={selected} onSave={onSave} onDelete={remove} />
          : <div className="item-detail empty-detail"><p className="muted-note">Escolha ou crie uma anotação.</p></div>}
      </div>
    </div>
  )
}

// Prévia da lista sem as marcas de formatação.
const preview = body => (body ?? '').replace(/[*#]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 70) || 'Vazia'

// Editor com salvamento automático. Ao trocar de nota (desmontar), salva o que estiver pendente.
function NoteEditor({ note, onSave, onDelete }) {
  const [title, setTitle] = useState(note.title === 'Sem título' ? '' : note.title)
  const [body, setBody] = useState(note.body ?? '')
  const [pinned, setPinned] = useState(note.pinned)
  const [status, setStatus] = useState('saved') // saved | dirty | saving | error
  const [confirming, setConfirming] = useState(false)
  const pending = useRef(null)
  const timer = useRef()

  const flush = () => {
    clearTimeout(timer.current)
    const values = pending.current
    if (!values) return
    pending.current = null
    setStatus('saving')
    onSave(note.id, values)
      .then(() => setStatus(s => (s === 'saving' ? 'saved' : s)))
      .catch(() => setStatus('error'))
  }

  const change = values => {
    pending.current = { title, body, pinned, ...values }
    setStatus('dirty')
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, SAVE_DELAY)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => flush(), [])

  const statusText = { saved: 'Salvo ' + formatDateTime(note.updatedAt), dirty: 'Editando…', saving: 'Salvando…', error: 'Não foi possível salvar' }[status]

  return (
    <div className="note-editor">
      <div className="note-toolbar">
        <button
          type="button"
          className={'pin-btn' + (pinned ? ' on' : '')}
          aria-pressed={pinned}
          onClick={() => { setPinned(!pinned); change({ pinned: !pinned }) }}
          title={pinned ? 'Desafixar' : 'Fixar no topo e na ficha'}
        >
          <PinIcon /> {pinned ? 'Fixada' : 'Fixar'}
        </button>
        <span className={'save-status ' + status} role="status">{statusText}</span>
        {confirming ? (
          <span className="confirm">
            Apagar mesmo?
            <button type="button" className="danger-btn" onClick={() => { pending.current = null; onDelete(note) }}>Apagar</button>
            <button type="button" className="ghost-btn small" onClick={() => setConfirming(false)}>Cancelar</button>
          </span>
        ) : (
          <button type="button" className="ghost-btn small" onClick={() => setConfirming(true)}>Apagar</button>
        )}
      </div>
      <input
        className="note-title"
        value={title}
        placeholder="Título"
        maxLength={120}
        aria-label="Título da anotação"
        onChange={e => { setTitle(e.target.value); change({ title: e.target.value }) }}
      />
      <textarea
        className="note-body"
        value={body}
        placeholder="Escreva aqui. Use **negrito**, *itálico* e ## para títulos."
        maxLength={20000}
        aria-label="Texto da anotação"
        onChange={e => { setBody(e.target.value); change({ body: e.target.value }) }}
        onBlur={flush}
      />
      <div className="note-foot">{body.length.toLocaleString('pt-BR')} / 20.000</div>
    </div>
  )
}
