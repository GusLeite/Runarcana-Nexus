import { useEffect, useState } from 'react'
import { createDocument, deleteDocument, fetchAllDocuments, fetchRecipients } from '../../api/master.js'
import { DOCUMENT_KINDS, documentKindOf, formatDate } from '../../data/rules.js'
import { CHARACTERS } from '../../data/characters.js'
import { DocumentView } from '../sheet/DocumentsTab.jsx'
import { DocIcon } from '../sheet/icons.jsx'

const EMPTY = { title: '', kind: 'LETTER', body: '', imageUrl: '' }
const nameOf = username => CHARACTERS.find(c => c.id === username)?.name ?? username

// Aba de documentos do mestre: escrever (com prévia igual à do jogador) e ver/apagar os enviados.
export default function MasterDocuments({ token, onError, onToast }) {
  const [players, setPlayers] = useState([])
  const [sent, setSent] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [to, setTo] = useState([]) // vazio = todos
  const [preview, setPreview] = useState(false)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    fetchRecipients(token).then(setPlayers).catch(onError)
    fetchAllDocuments(token).then(setSent).catch(onError)
  }, [token, onError])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const toggle = username => setTo(list => (list.includes(username) ? list.filter(u => u !== username) : [...list, username]))

  const send = async e => {
    e.preventDefault()
    if (!form.title.trim()) return setMsg('Dê um título ao documento.')
    if (form.imageUrl && !/^https?:\/\/\S+$/.test(form.imageUrl)) return setMsg('O link da imagem deve começar com http:// ou https://.')
    setBusy(true)
    setMsg(null)
    try {
      const doc = await createDocument(token, { ...form, imageUrl: form.imageUrl || null, recipients: to })
      setSent(list => [doc, ...list])
      setForm(EMPTY)
      setTo([])
      setPreview(false)
      onToast('Documento enviado para ' + (to.length ? to.map(nameOf).join(', ') : 'todos') + '.')
    } catch (err) {
      if (err.status === 401) onError(err)
      else setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = doc => {
    deleteDocument(token, doc.id)
      .then(() => { setSent(list => list.filter(d => d.id !== doc.id)); onToast('Documento apagado.') })
      .catch(onError)
      .finally(() => setConfirmId(null))
  }

  const draft = { id: 0, ...form, createdAt: new Date().toISOString(), toAll: to.length === 0, body: form.body, imageUrl: form.imageUrl || null }

  return (
    <div className="master-grid">
      <section className="card" style={{ '--i': 1 }}>
        <form onSubmit={send} noValidate>
          <div className="card-title inv-title">
            <h3>Novo documento</h3>
            <div className="seg" role="group" aria-label="Modo do editor">
              <button type="button" className={preview ? '' : 'on'} aria-pressed={!preview} onClick={() => setPreview(false)}>Escrever</button>
              <button type="button" className={preview ? 'on' : ''} aria-pressed={preview} onClick={() => setPreview(true)}>Prévia</button>
            </div>
          </div>

          {preview ? <DocumentView doc={draft} /> : (
            <div className="mform">
              <label htmlFor="d-title">Título</label>
              <input id="d-title" value={form.title} maxLength={160} onChange={e => set('title', e.target.value)} placeholder="Ex.: Carta selada de Aphelios" />

              <span className="mlabel">Tipo</span>
              <div className="kind-pick" role="radiogroup" aria-label="Tipo do documento">
                {Object.entries(DOCUMENT_KINDS).map(([id, k]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={form.kind === id}
                    className={'kind-chip' + (form.kind === id ? ' on' : '')}
                    style={{ '--k': k.color }}
                    onClick={() => set('kind', id)}
                  >
                    <DocIcon kind={id} /> {k.name}
                  </button>
                ))}
              </div>

              <span className="mlabel">Para</span>
              <div className="to-pick">
                <button type="button" className={'to-chip' + (to.length === 0 ? ' on' : '')} aria-pressed={to.length === 0} onClick={() => setTo([])}>
                  Todos os jogadores
                </button>
                {players.map(u => (
                  <button key={u} type="button" className={'to-chip' + (to.includes(u) ? ' on' : '')} aria-pressed={to.includes(u)} onClick={() => toggle(u)}>
                    {nameOf(u)}
                  </button>
                ))}
              </div>

              <label htmlFor="d-body">Texto <small>use ## para títulos, **negrito** e *itálico*</small></label>
              <textarea id="d-body" className="note-body mbody" value={form.body} maxLength={20000} onChange={e => set('body', e.target.value)} placeholder="Escreva o conteúdo que os jogadores vão ler." />

              <label htmlFor="d-img">Imagem (link, opcional)</label>
              <input id="d-img" value={form.imageUrl} maxLength={1000} onChange={e => set('imageUrl', e.target.value)} placeholder="https://…" />
            </div>
          )}

          {msg && <div className="err" role="alert">{msg}</div>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'ENVIANDO…' : 'ENVIAR PARA ' + (to.length === 0 ? 'TODOS' : to.length === 1 ? nameOf(to[0]) : to.length + ' JOGADORES')}
          </button>
        </form>
      </section>

      <section className="card" style={{ '--i': 2 }}>
        <h3 className="card-title">Enviados <small>{sent.length}</small></h3>
        {sent.length === 0 && <p className="muted-note">Nenhum documento enviado ainda.</p>}
        <ul className="docs">
          {sent.map(doc => {
            const kind = documentKindOf(doc.kind)
            return (
              <li key={doc.id} className="sent-row" style={{ '--k': kind.color }}>
                <span className="doc-seal"><DocIcon kind={doc.kind} /></span>
                <span className="doc-info">
                  <span className="doc-name">{doc.title}</span>
                  <span className="doc-meta">{kind.name} · {formatDate(doc.createdAt)}</span>
                  <span className="sent-to">
                    {doc.toAll ? <em>Todos</em> : doc.recipients.map(u => <span key={u} className="to-tag">{nameOf(u)}</span>)}
                  </span>
                </span>
                {confirmId === doc.id ? (
                  <span className="confirm">
                    <button type="button" className="danger-btn" onClick={() => remove(doc)}>Apagar</button>
                    <button type="button" className="ghost-btn small" onClick={() => setConfirmId(null)}>Não</button>
                  </span>
                ) : (
                  <button type="button" className="ghost-btn small" onClick={() => setConfirmId(doc.id)} aria-label={'Apagar ' + doc.title}>Apagar</button>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
