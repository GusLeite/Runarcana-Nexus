import { useEffect, useRef, useState } from 'react'
import { formatDateTime } from '../../data/rules.js'
import { PinIcon } from './icons.jsx'
import { afterLeave } from '../../utils/motion.js'

const SAVE_DELAY = 700

// Aba de anotações do jogador: um diário medieval. O índice fica na página esquerda e a página pautada,
// que salva sozinha enquanto se escreve, na direita.
export default function NotesTab({ notes, selectedId, onSelect, onCreate, onSave, onDelete, busy }) {
  const selected = notes.find(n => n.id === selectedId) ?? notes[0]
  const [leavingId, setLeavingId] = useState(null)
  // A linha encolhe antes de a nota sair da lista.
  const remove = note => {
    setLeavingId(note.id)
    afterLeave(() => { onDelete(note); setLeavingId(null) })
  }

  return (
    <div className="journal">
      {['tl', 'tr', 'bl', 'br'].map(c => <i key={c} className={'corner ' + c} aria-hidden="true" />)}
      <div className="jpage left">
        <div className="jhead">
          <h3 className="jtitle">Diário <small>{notes.length} {notes.length === 1 ? 'página' : 'páginas'}</small></h3>
          <button type="button" className="wax-btn" disabled={busy} onClick={onCreate}><span aria-hidden="true">+</span> Nova página</button>
        </div>
        <div className="jrule" aria-hidden="true"><i /></div>
        {notes.length === 0 && <p className="jempty">Nada anotado ainda. Abra uma página para pistas, nomes e planos do grupo.</p>}
        <ul className="jindex">
          {notes.map((note, n) => (
            <li key={note.id}>
              <button type="button" className={'jentry' + (note.id === selected?.id ? ' on' : '') + (note.id === leavingId ? ' leaving' : '')} style={{ '--n': n }} onClick={() => onSelect(note.id)}>
                {note.pinned && <span className="seal" title="Fixada" aria-label="Fixada"><PinIcon /></span>}
                <span className="jentry-text">
                  <span className="jentry-name">{note.title}</span>
                  <span className="jentry-peek">{preview(note.body)}</span>
                </span>
                <span className="jentry-date">{formatDateTime(note.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="jspine" aria-hidden="true" />

      <div className="jpage right">
        {selected
          ? <NoteEditor key={selected.id} note={selected} onSave={onSave} onDelete={remove} />
          : <p className="jempty">Página em branco. Escolha ou abra uma anotação.</p>}
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
        placeholder="Título da página"
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
      <div className="note-foot"><span>{body.length.toLocaleString('pt-BR')} / 20.000 letras</span></div>
    </div>
  )
}
