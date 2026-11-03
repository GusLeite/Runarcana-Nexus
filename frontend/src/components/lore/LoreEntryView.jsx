import { useState } from 'react'
import { RichText } from '../sheet/DocumentsTab.jsx'
import { audienceLabel } from './AudiencePicker.jsx'

export const KIND_LABELS = { CHARACTER: 'Personagem', PLACE: 'Lugar', REGION: 'Região' }

// Marca dourada para quem ainda não tem imagem.
export function LoreSigil({ kind }) {
  const paths = {
    CHARACTER: <><circle cx="24" cy="17" r="7" /><path d="M10 40c1-10 7-14 14-14s13 4 14 14" /></>,
    PLACE: <path d="M8 40V22l8-6 8 6v18M24 40V12l8-5 8 5v28M6 40h36" />,
    REGION: <path d="M24 6 38 12v13c0 8-6 13-14 17-8-4-14-9-14-17V12Z" />,
  }
  return <svg className="lore-sigil" viewBox="0 0 48 48" aria-hidden="true">{paths[kind]}</svg>
}

export function LoreCard({ item, onOpen }) {
  return (
    <button type="button" className="lore-card" onClick={() => onOpen(item.id)}>
      <span className="lore-card-art">
        {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <LoreSigil kind={item.kind} />}
      </span>
      <span className="lore-card-kind">{KIND_LABELS[item.kind]}</span>
      <strong>{item.name}</strong>
      {item.subtitle && <span className="lore-card-sub">{item.subtitle}</span>}
    </button>
  )
}

function Knowledge({ section, master, startOpen }) {
  const [open, setOpen] = useState(startOpen)
  return (
    <article className={'lore-knowledge' + (open ? ' open' : '')}>
      <button type="button" className="lore-knowledge-head" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="lore-knowledge-kicker">Conhecimento</span>
        <strong>{section.title}</strong>
        {master && <span className="lore-knowledge-who">{audienceLabel(section)}</span>}
        <span className="lore-knowledge-toggle" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="lore-knowledge-body"><RichText text={section.body ?? ''} /></div>}
    </article>
  )
}

// Página do verbete, na ordem da do Universo: capa, citação, resumo, informações, conhecimentos e vínculos.
export default function LoreEntryView({ entry, master, mapTarget, onOpen, onShowOnMap, onEdit }) {
  const groups = [
    ['Personagens', entry.linked.filter(l => l.kind === 'CHARACTER')],
    ['Lugares', entry.linked.filter(l => l.kind === 'PLACE')],
  ].filter(([, items]) => items.length > 0)

  return (
    <article className="lore-entry">
      <div className="lore-hero">
        {entry.imageUrl && <img className="lore-hero-art" src={entry.imageUrl} alt="" />}
        <div className="lore-hero-text">
          {!entry.imageUrl && <LoreSigil kind={entry.kind} />}
          <span className="lore-hero-kind">{KIND_LABELS[entry.kind]}</span>
          <h2>{entry.name}</h2>
          {entry.subtitle && <p className="lore-hero-sub">{entry.subtitle}</p>}
          {master && <p className="lore-hero-who">Conhecem o verbete: {audienceLabel(entry)}</p>}
        </div>
      </div>

      <div className="lore-actions">
        {mapTarget && <button type="button" className="lore-action" onClick={() => onShowOnMap(mapTarget)}>VER NO MAPA</button>}
        {master && <button type="button" className="lore-action ghost" onClick={onEdit}>EDITAR</button>}
      </div>

      {entry.quote && (
        <blockquote className="lore-quote">
          <p>“{entry.quote}”</p>
          {entry.quoteAuthor && <cite>~ {entry.quoteAuthor}</cite>}
        </blockquote>
      )}
      {entry.summary && <p className="lore-summary">{entry.summary}</p>}

      {(entry.facts.length > 0 || entry.region) && (
        <>
          <div className="lore-rule" aria-hidden="true" />
          <dl className="lore-facts">
            {entry.facts.map((fact, i) => (
              <div key={i}><dt>{fact.label}:</dt><dd>{fact.value}</dd></div>
            ))}
            {entry.region && (
              <div>
                <dt>Região:</dt>
                <dd><button type="button" className="lore-inline" onClick={() => onOpen(entry.region.id)}>{entry.region.name}</button></dd>
              </div>
            )}
          </dl>
          <div className="lore-rule" aria-hidden="true" />
        </>
      )}

      <section className="lore-section" aria-label="Conhecimentos">
        <h3>{master ? 'Conhecimentos' : 'O que você sabe'}</h3>
        {entry.sections.length === 0 && <p className="lore-empty">{master ? 'Nenhum conhecimento escrito ainda.' : 'Por enquanto, isso é tudo o que você sabe.'}</p>}
        {entry.sections.map((section, i) => <Knowledge key={section.id} section={section} master={master} startOpen={i === 0} />)}
      </section>

      {groups.map(([title, items]) => (
        <section className="lore-section" key={title}>
          <h3>{title}</h3>
          <div className="lore-grid">
            {items.map(item => <LoreCard key={item.id} item={item} onOpen={onOpen} />)}
          </div>
        </section>
      ))}
    </article>
  )
}
