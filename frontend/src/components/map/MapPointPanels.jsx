import { useState } from 'react'
import { formatDate } from '../../data/rules.js'
import AudiencePicker, { audienceLabel, playerName } from '../lore/AudiencePicker.jsx'
import { PoiGlyph, POI_KINDS } from './poiKinds.jsx'
import PoiGallery from './PoiGallery.jsx'
import PoiHistory from './PoiHistory.jsx'
import CopyLinkButton from './CopyLinkButton.jsx'
import { mapLinkNodes } from './MapLinkText.jsx'
import '../../styles/lore.css'

// Moldura comum dos painéis laterais dos pontos do mapa.
function PointPanel({ label, onClose, children }) {
  return (
    <aside className="map-panel map-point-panel" aria-label={label}>
      <button className="map-btn map-panel-close" type="button" onClick={onClose} title="Fechar" aria-label="Fechar o painel">×</button>
      <div className="map-point-body">{children}</div>
    </aside>
  )
}

// Ponto de interesse: descrição, verbete ligado, comentários da mesa e anotações de quem está vendo.
export function PoiPanel({ poi, loreEntry, master, players = [], token, onPoi, onNotice, onOpenLore, onEdit, onAudience, onAddComment, onDeleteComment, onClose }) {
  const [text, setText] = useState('')
  const [shared, setShared] = useState(false)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setMsg(null)
    try {
      await onAddComment(poi, { text: text.trim(), shared: master || shared })
      setText('')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PointPanel label={poi.name} onClose={onClose}>
      <span className="map-point-glyph"><PoiGlyph kind={poi.kind} /></span>
      <span className="lore-hero-kind">{POI_KINDS[poi.kind]}</span>
      <h2>{poi.name}</h2>
      {master && <p className="lore-hero-who">Revelado a: {audienceLabel(poi)}</p>}
      {master && onAudience && <RevealBar poi={poi} players={players} onAudience={onAudience} />}
      {poi.description && <p className="map-point-text">{mapLinkNodes(poi.description)}</p>}
      {master && poi.secretNotes && (
        <div className="map-secret">
          <strong>Só o mestre lê</strong>
          <p className="map-point-text">{poi.secretNotes}</p>
        </div>
      )}
      <PoiGallery token={token} poi={poi} master={master} onPoi={onPoi} onNotice={onNotice} />
      <div className="lore-actions">
        {loreEntry && <button type="button" className="lore-action" onClick={() => onOpenLore(loreEntry.id)}>ABRIR NA LORE</button>}
        {master && <button type="button" className="lore-action ghost" onClick={onEdit}>EDITAR</button>}
        <CopyLinkButton target={poi.id} />
      </div>

      <PoiHistory token={token} poi={poi} />
      <div className="lore-rule" aria-hidden="true" />
      <h3>{master ? 'Comentários da mesa' : 'Comentários e anotações'}</h3>
      {poi.comments.length === 0 && <p className="lore-form-hint">Nada escrito aqui ainda.</p>}
      <ul className="map-comments">
        {poi.comments.map(comment => (
          <li key={comment.id} className={comment.shared ? '' : 'private'}>
            <div className="map-comment-head">
              <strong>{comment.mine && !master ? 'Você' : playerName(comment.author)}</strong>
              <span>{comment.shared ? formatDate(comment.createdAt) : 'Anotação só sua'}</span>
              {(comment.mine || (master && comment.shared)) && (
                <button type="button" className="lore-link danger" onClick={() => onDeleteComment(poi, comment)}>Apagar</button>
              )}
            </div>
            <p>{mapLinkNodes(comment.text)}</p>
          </li>
        ))}
      </ul>

      <form className="lore-form map-comment-form" onSubmit={submit}>
        <textarea aria-label="Novo comentário" rows={3} maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder={master ? 'Comentário para a mesa…' : 'O que você quer lembrar daqui?'} />
        {!master && (
          <div className="lore-chips" role="group" aria-label="Quem vê">
            <button type="button" className={'lore-chip' + (!shared ? ' on' : '')} aria-pressed={!shared} onClick={() => setShared(false)}>Só eu</button>
            <button type="button" className={'lore-chip' + (shared ? ' on' : '')} aria-pressed={shared} onClick={() => setShared(true)}>Toda a mesa</button>
          </div>
        )}
        {msg && <p className="lore-form-error" role="alert">{msg}</p>}
        <button type="submit" className="lore-action" disabled={busy || !text.trim()}>{master || shared ? 'COMENTAR' : 'ANOTAR'}</button>
      </form>
    </PointPanel>
  )
}

// Cadastro e edição do ponto pelo mestre.
export function PoiForm({ poi, lore, players, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    name: poi.name ?? '',
    kind: poi.kind ?? 'LANDMARK',
    description: poi.description ?? '',
    secretNotes: poi.secretNotes ?? '',
    loreEntryId: poi.loreEntryId ?? '',
    toAll: poi.toAll ?? true,
    recipients: poi.recipients ?? [],
  })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return setMsg('Dê um nome ao ponto.')
    setBusy(true)
    setMsg(null)
    try {
      await onSave({ ...form, x: poi.x, y: poi.y, loreEntryId: form.loreEntryId === '' ? null : Number(form.loreEntryId) })
    } catch (err) {
      setMsg(err.message)
      setBusy(false)
    }
  }

  return (
    <PointPanel label={poi.id ? 'Editar ponto' : 'Novo ponto'} onClose={onClose}>
      <form className="lore-form" onSubmit={submit}>
        <h2>{poi.id ? 'Editar ponto' : 'Novo ponto'}</h2>
        <label>Nome
          <input autoFocus value={form.name} maxLength={120} onChange={e => set('name', e.target.value)} />
        </label>
        <fieldset>
          <legend>Tipo</legend>
          <div className="lore-chips">
            {Object.entries(POI_KINDS).map(([id, label]) => (
              <button key={id} type="button" className={'lore-chip' + (form.kind === id ? ' on' : '')} aria-pressed={form.kind === id} onClick={() => set('kind', id)}>{label}</button>
            ))}
          </div>
        </fieldset>
        <label>Descrição
          <textarea rows={5} value={form.description} maxLength={4000} onChange={e => set('description', e.target.value)} />
        </label>
        <label>Notas secretas (só o mestre lê)
          <textarea rows={4} value={form.secretNotes} maxLength={4000} onChange={e => set('secretNotes', e.target.value)} />
        </label>
        <label>Verbete da lore
          <select value={form.loreEntryId} onChange={e => set('loreEntryId', e.target.value)}>
            <option value="">Nenhum</option>
            {lore.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Quem vê no mapa</legend>
          <AudiencePicker players={players} toAll={form.toAll} recipients={form.recipients} onChange={patch => setForm(f => ({ ...f, ...patch }))} />
        </fieldset>
        {msg && <p className="lore-form-error" role="alert">{msg}</p>}
        <div className="lore-form-actions">
          <button type="submit" className="lore-action" disabled={busy}>{busy ? 'SALVANDO…' : 'SALVAR'}</button>
          {poi.id && (confirming
            ? <button type="button" className="lore-link danger" onClick={() => onDelete(poi)}>Confirmar: apagar</button>
            : <button type="button" className="lore-link danger" onClick={() => setConfirming(true)}>Apagar ponto</button>)}
        </div>
      </form>
    </PointPanel>
  )
}

// Waypoint: o dono escreve; o mestre só lê.
export function WaypointPanel({ waypoint, readOnly, onSave, onDelete, onClose }) {
  const [name, setName] = useState(waypoint.name ?? '')
  const [comment, setComment] = useState(waypoint.comment ?? '')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  if (readOnly) {
    return (
      <PointPanel label={waypoint.name} onClose={onClose}>
        <span className="lore-hero-kind">Waypoint de {playerName(waypoint.owner)}</span>
        <h2>{waypoint.name}</h2>
        {waypoint.comment ? <p className="map-point-text">{waypoint.comment}</p> : <p className="lore-form-hint">Sem comentário.</p>}
      </PointPanel>
    )
  }

  const submit = async e => {
    e.preventDefault()
    if (!name.trim()) return setMsg('Dê um nome ao waypoint.')
    setBusy(true)
    setMsg(null)
    try {
      await onSave({ name: name.trim(), comment, x: waypoint.x, y: waypoint.y })
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PointPanel label="Waypoint" onClose={onClose}>
      <form className="lore-form" onSubmit={submit}>
        <h2>{waypoint.id ? 'Seu waypoint' : 'Novo waypoint'}</h2>
        <label>Nome
          <input autoFocus value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Onde vimos o navio" />
        </label>
        <label>Comentário
          <textarea rows={6} value={comment} maxLength={1000} onChange={e => setComment(e.target.value)} />
        </label>
        <p className="lore-form-hint">Só você e o mestre veem este waypoint.</p>
        {msg && <p className="lore-form-error" role="alert">{msg}</p>}
        <div className="lore-form-actions">
          <button type="submit" className="lore-action" disabled={busy}>{busy ? 'SALVANDO…' : 'SALVAR'}</button>
          {waypoint.id && <button type="button" className="lore-link danger" onClick={() => onDelete(waypoint)}>Apagar waypoint</button>}
        </div>
      </form>
    </PointPanel>
  )
}

// Mestre: revela o ponto na hora (a todos ou a alguns) ou o esconde de novo, sem abrir o formulário.
function RevealBar({ poi, players, onAudience }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const revealed = poi.toAll || poi.recipients?.length > 0
  const set = async (toAll, recipients) => {
    setBusy(true)
    setMsg(null)
    try {
      await onAudience(poi, toAll, recipients)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }
  const toggle = username => {
    const now = poi.recipients ?? []
    set(false, now.includes(username) ? now.filter(u => u !== username) : [...now, username])
  }
  return (
    <div className="map-reveal">
      <div className="lore-actions">
        {!poi.toAll && <button type="button" className="lore-action map-reveal-go" disabled={busy} onClick={() => set(true, [])}>REVELAR AO GRUPO</button>}
        {revealed && <button type="button" className="lore-action ghost" disabled={busy} onClick={() => set(false, [])}>ESCONDER</button>}
      </div>
      {!poi.toAll && players.length > 0 && (
        <div className="lore-chips" role="group" aria-label="Revelar só a alguns">
          <span className="map-reveal-label">Só a:</span>
          {players.map(username => {
            const on = poi.recipients?.includes(username)
            return (
              <button key={username} type="button" className={'lore-chip' + (on ? ' on' : '')} aria-pressed={on} disabled={busy} onClick={() => toggle(username)}>
                {playerName(username)}
              </button>
            )
          })}
        </div>
      )}
      {msg && <p className="lore-form-error" role="alert">{msg}</p>}
    </div>
  )
}
