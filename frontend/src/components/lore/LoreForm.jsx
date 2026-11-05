import { useMemo, useState } from 'react'
import { MAP_PINS } from '../map/regions.js'
import AudiencePicker from './AudiencePicker.jsx'
import { fileToBanner } from '../../utils/iconImage.js'
import { KIND_LABELS } from './LoreEntryView.jsx'
import { POI_KINDS } from '../map/poiKinds.jsx'

const EMPTY = {
  kind: 'CHARACTER', name: '', subtitle: '', quote: '', quoteAuthor: '', summary: '', mapSummary: '', imageUrl: '', mapSlug: '',
  regionId: '', linkedIds: [], relatedIds: [], relatedPoiIds: [], facts: [], sections: [], toAll: false, recipients: [],
}

const fromEntry = entry => ({
  ...EMPTY,
  kind: entry.kind,
  name: entry.name,
  subtitle: entry.subtitle ?? '',
  quote: entry.quote ?? '',
  quoteAuthor: entry.quoteAuthor ?? '',
  summary: entry.summary ?? '',
  mapSummary: entry.mapSummary ?? '',
  imageUrl: entry.imageUrl ?? '',
  mapSlug: entry.mapSlug ?? '',
  regionId: entry.region?.id ?? '',
  linkedIds: entry.linked.map(l => l.id),
  relatedIds: (entry.related ?? []).map(l => l.id),
  facts: entry.facts.map(f => ({ ...f })),
  sections: entry.sections.map(s => ({ title: s.title, body: s.body ?? '', toAll: s.toAll, recipients: s.recipients ?? [] })),
  toAll: entry.toAll,
  recipients: entry.recipients ?? [],
})

// Cadastro e edição de um verbete pelo mestre. pois: os pontos do mapa (o mestre vê todos), para relacionar.
export default function LoreForm({ entry, draft, entries, pois = [], players, onSave, onDelete, onCancel }) {
  // Pontos relacionados: os que têm este verbete em related (o ponto do próprio lugar, loreEntryId, é outro vínculo).
  const [form, setForm] = useState(() => (entry
    ? { ...fromEntry(entry), relatedPoiIds: pois.filter(p => p.related?.some(r => r.id === entry.id)).map(p => p.id) }
    : { ...EMPTY, ...draft }))
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const setItem = (key, index, patch) => setForm(f => ({ ...f, [key]: f[key].map((item, i) => (i === index ? { ...item, ...patch } : item)) }))
  const removeItem = (key, index) => setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }))
  const togglePoi = id => set('relatedPoiIds', form.relatedPoiIds.includes(id) ? form.relatedPoiIds.filter(x => x !== id) : [...form.relatedPoiIds, id])
  const toggleRelated = id => set('relatedIds', form.relatedIds.includes(id) ? form.relatedIds.filter(x => x !== id) : [...form.relatedIds, id])
  const toggleLinked = id => set('linkedIds', form.linkedIds.includes(id) ? form.linkedIds.filter(x => x !== id) : [...form.linkedIds, id])

  const isRegion = form.kind === 'REGION'
  const isUpload = form.imageUrl.startsWith('data:')
  const chooseImage = file => {
    if (!file) return
    setMsg(null)
    fileToBanner(file, 900).then(image => set('imageUrl', image)).catch(err => setMsg(err.message))
  }
  const regions = entries.filter(e => e.kind === 'REGION' && e.id !== entry?.id)
  const linkable = entries.filter(e => e.kind !== 'REGION' && e.id !== entry?.id)

  const submit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return setMsg('Dê um nome ao verbete.')
    if (form.imageUrl && !isUpload && !/^https?:\/\/\S+$/.test(form.imageUrl)) return setMsg('O link da imagem deve começar com http:// ou https://.')
    if (form.facts.some(f => !f.label.trim() || !f.value.trim())) return setMsg('Preencha nome e valor de todas as informações.')
    if (form.sections.some(s => !s.title.trim())) return setMsg('Todo conhecimento precisa de um título.')
    setBusy(true)
    setMsg(null)
    try {
      await onSave({
        ...form,
        imageUrl: form.imageUrl || null,
        mapSlug: isRegion ? form.mapSlug || null : null,
        regionId: !isRegion && form.regionId !== '' ? Number(form.regionId) : null,
        linkedIds: isRegion ? form.linkedIds : [],
        relatedIds: form.relatedIds,
        relatedPoiIds: form.relatedPoiIds,
      })
    } catch (err) {
      setMsg(err.message)
      setBusy(false)
    }
  }

  return (
    <form className="lore-form" onSubmit={submit}>
      <h2>{entry ? 'Editar ' + entry.name : 'Novo verbete'}</h2>

      <div className="lore-form-row">
        <label>Tipo
          <select value={form.kind} onChange={e => set('kind', e.target.value)}>
            {Object.entries(KIND_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label>Nome
          <input value={form.name} maxLength={120} onChange={e => set('name', e.target.value)} />
        </label>
      </div>
      <label>Título
        <input value={form.subtitle} maxLength={160} onChange={e => set('subtitle', e.target.value)} placeholder="O Imperador das Areias" />
      </label>
      <div className="lore-image-field">
        <span className="lore-image-label">Imagem (opcional)</span>
        {form.imageUrl && <img className="lore-image-preview" src={form.imageUrl} alt="Prévia da imagem do verbete" />}
        <div className="lore-actions">
          <label className="lore-action ghost lore-file">
            {form.imageUrl ? 'TROCAR IMAGEM' : 'ENVIAR IMAGEM'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e => { chooseImage(e.target.files[0]); e.target.value = '' }} />
          </label>
          {form.imageUrl && <button type="button" className="lore-action ghost" onClick={() => set('imageUrl', '')}>REMOVER</button>}
        </div>
        <input aria-label="Link da imagem" value={isUpload ? '' : form.imageUrl} maxLength={1000} disabled={isUpload} onChange={e => set('imageUrl', e.target.value)} placeholder={isUpload ? 'Imagem enviada (remova para usar um link)' : 'ou cole um link https://…'} />
      </div>
      <div className="lore-form-row">
        <label>Citação
          <input value={form.quote} maxLength={500} onChange={e => set('quote', e.target.value)} />
        </label>
        <label>Quem disse
          <input value={form.quoteAuthor} maxLength={120} onChange={e => set('quoteAuthor', e.target.value)} />
        </label>
      </div>
      <label>Resumo
        <textarea rows={5} value={form.summary} maxLength={4000} onChange={e => set('summary', e.target.value)} />
      </label>
      {isRegion && (
        <label>Resumo no mapa
          <textarea rows={3} value={form.mapSummary} maxLength={1000} onChange={e => set('mapSummary', e.target.value)} placeholder="Texto curto que aparece no painel da região, ao clicar nela no mapa." />
        </label>
      )}

      {isRegion ? (
        <>
          <label>Brasão no mapa
            <select value={form.mapSlug} onChange={e => set('mapSlug', e.target.value)}>
              <option value="">Nenhum</option>
              {MAP_PINS.map(pin => <option key={pin.slug} value={pin.slug}>{pin.name}</option>)}
            </select>
          </label>
          <fieldset>
            <legend>Personagens e lugares desta região</legend>
            {linkable.length === 0 && <p className="lore-form-hint">Crie personagens e lugares para vinculá-los aqui.</p>}
            <div className="lore-chips">
              {linkable.map(item => {
                const on = form.linkedIds.includes(item.id)
                return <button key={item.id} type="button" className={'lore-chip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => toggleLinked(item.id)}>{item.name}</button>
              })}
            </div>
          </fieldset>
        </>
      ) : (
        <label>Região
          <select value={form.regionId} onChange={e => set('regionId', e.target.value)}>
            <option value="">Nenhuma</option>
            {regions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
          </select>
        </label>
      )}

      <RelatedPicker items={entries.filter(e => e.id !== entry?.id)} chosen={form.relatedIds} onToggle={toggleRelated} />
      <RelatedPicker items={pois} chosen={form.relatedPoiIds} onToggle={togglePoi} legend="Pontos do mapa relacionados"
        tagOf={p => POI_KINDS[p.kind]} empty="Ainda não há pontos no mapa." placeholder="Buscar ponto do mapa…" />

      <fieldset>
        <legend>Quem conhece este verbete</legend>
        <p className="lore-form-hint">Quem marcar aqui vê nome, imagem, resumo e informações. Quem recebe só um conhecimento abaixo também vê essa parte.</p>
        <AudiencePicker players={players} toAll={form.toAll} recipients={form.recipients} onChange={patch => setForm(f => ({ ...f, ...patch }))} />
      </fieldset>

      <fieldset>
        <legend>Informações</legend>
        {form.facts.map((fact, i) => (
          <div className="lore-form-fact" key={i}>
            <input aria-label="Nome da informação" placeholder="Regime" value={fact.label} maxLength={60} onChange={e => setItem('facts', i, { label: e.target.value })} />
            <input aria-label="Valor da informação" placeholder="Império divino" value={fact.value} maxLength={120} onChange={e => setItem('facts', i, { value: e.target.value })} />
            <button type="button" className="lore-link danger" onClick={() => removeItem('facts', i)}>Tirar</button>
          </div>
        ))}
        {form.facts.length < 12 && <button type="button" className="lore-link" onClick={() => set('facts', [...form.facts, { label: '', value: '' }])}>+ Informação</button>}
      </fieldset>

      <fieldset>
        <legend>Conhecimentos</legend>
        <p className="lore-form-hint">Cada um é como um conto da página: marque quais personagens sabem dele. Aceita ## título, **negrito** e *itálico*.</p>
        {form.sections.map((section, i) => (
          <div className="lore-form-section" key={i}>
            <div className="lore-form-section-head">
              <input aria-label="Título do conhecimento" placeholder="O que se diz em Nasus" value={section.title} maxLength={160} onChange={e => setItem('sections', i, { title: e.target.value })} />
              <button type="button" className="lore-link danger" onClick={() => removeItem('sections', i)}>Tirar</button>
            </div>
            <textarea aria-label="Texto do conhecimento" rows={5} value={section.body} maxLength={20000} onChange={e => setItem('sections', i, { body: e.target.value })} />
            <AudiencePicker players={players} toAll={section.toAll} recipients={section.recipients} onChange={patch => setItem('sections', i, patch)} />
          </div>
        ))}
        {form.sections.length < 40 && <button type="button" className="lore-link" onClick={() => set('sections', [...form.sections, { title: '', body: '', toAll: false, recipients: [] }])}>+ Conhecimento</button>}
      </fieldset>

      {msg && <p className="lore-form-error" role="alert">{msg}</p>}
      <div className="lore-form-actions">
        <button type="submit" className="lore-action" disabled={busy}>{busy ? 'SALVANDO…' : 'SALVAR'}</button>
        <button type="button" className="lore-link" onClick={onCancel}>Cancelar</button>
        {entry && (confirming
          ? <button type="button" className="lore-link danger" onClick={() => onDelete(entry)}>Confirmar: apagar</button>
          : <button type="button" className="lore-link danger" onClick={() => setConfirming(true)}>Apagar verbete</button>)}
      </div>
    </form>
  )
}

const MAX_SHOWN = 24

// Escolha de relacionados com busca: verbetes (de qualquer tipo: o lugar e quem o guarda, dois rivais...) ou pontos
// do mapa. A relação vale nos dois sentidos: marcar aqui também mostra este lado na página/painel do outro.
// Os marcados vêm primeiro; a busca filtra o resto.
export function RelatedPicker({ items, chosen, onToggle, legend = 'Verbetes relacionados', tagOf = item => KIND_LABELS[item.kind],
  empty = 'Crie outros verbetes para relacioná-los a este.', placeholder = 'Buscar verbete para relacionar…' }) {
  const [query, setQuery] = useState('')
  const others = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [items])
  const picked = others.filter(e => chosen.includes(e.id))
  const q = query.trim().toLowerCase()
  const rest = others.filter(e => !chosen.includes(e.id) && (!q || e.name.toLowerCase().includes(q)))
  const chip = (item, on) => (
    <button key={item.id} type="button" className={'lore-chip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => onToggle(item.id)}>
      {item.name}{tagOf(item) && <span className="lore-chip-kind"> · {tagOf(item)}</span>}
    </button>
  )
  return (
    <fieldset>
      <legend>{legend}</legend>
      {others.length === 0 ? <p className="lore-form-hint">{empty}</p> : (
        <>
          {picked.length > 0 && <div className="lore-chips">{picked.map(item => chip(item, true))}</div>}
          <input className="lore-search lore-related-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
          <div className="lore-chips">
            {rest.slice(0, MAX_SHOWN).map(item => chip(item, false))}
            {rest.length > MAX_SHOWN && <span className="lore-chips-hint">e mais {rest.length - MAX_SHOWN}: use a busca.</span>}
            {rest.length === 0 && q && <span className="lore-chips-hint">Nada com esse nome.</span>}
          </div>
        </>
      )}
    </fieldset>
  )
}
