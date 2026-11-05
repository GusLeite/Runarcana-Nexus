import { useRef } from 'react'
import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import { Knowledge, LoreSigil, connectedOf } from '../lore/LoreEntryView.jsx'
import CopyLinkButton from './CopyLinkButton.jsx'

// Painel lateral da região escolhida, com a arte. O resumo curto (mapSummary) aparece aqui; o resumo longo fica só no verbete, em "ABRIR NA LORE".
// Quando a lore tem um verbete desta região, mostra as informações dele, os conhecimentos liberados, os personagens
// e lugares ligados a ela e leva até lá. O mestre cria o verbete da região e os personagens dela sem sair do mapa.
export default function RegionPanel({ region, lore, master, onOpenLore, onClose }) {
  const [main] = region.art
  const people = connectedOf(lore, 'CHARACTER')
  const places = connectedOf(lore, 'PLACE')
  const draftFor = extra => ({ ...extra, toAll: false, recipients: [] })
  return (
    <aside className="map-panel" style={{ '--h': main.hue }} aria-label={region.name}>
      <div className="map-panel-art">
        {main.video && !prefersReducedMotion()
          ? <video src={main.video} poster={main.img} autoPlay loop muted playsInline />
          : <img src={main.img} alt="" />}
        <button className="map-btn map-panel-close" type="button" onClick={onClose} title="Fechar" aria-label="Fechar o painel da região">×</button>
      </div>
      <div className="map-panel-body">
        <div className="map-panel-crests">
          {region.art.map(art => <img key={art.icon} src={art.icon} alt="" />)}
        </div>
        <h2>{lore?.name ?? region.name}</h2>
        {lore?.subtitle && <p className="map-panel-sub">{lore.subtitle}</p>}
        {lore?.facts.length > 0 && (
          <dl className="lore-facts">
            {lore.facts.map((fact, i) => <div key={i}><dt>{fact.label}:</dt><dd>{fact.value}</dd></div>)}
          </dl>
        )}
        {lore?.mapSummary && <p className="map-panel-summary">{lore.mapSummary}</p>}
        <div className="lore-actions">
          {lore && <button type="button" className="lore-action" onClick={() => onOpenLore(lore.id)}>ABRIR NA LORE</button>}
          {master && !lore && <button type="button" className="lore-action" onClick={() => onOpenLore(undefined, draftFor({ kind: 'REGION', name: region.name, mapSlug: region.slug }))}>CRIAR VERBETE DA REGIÃO</button>}
          <CopyLinkButton target={region.slug} />
        </div>

        {lore?.sections.length > 0 && (
          <section className="map-region-block" aria-label="Conhecimentos">
            <h3>Conhecimentos</h3>
            {lore.sections.map(section => <Knowledge key={section.id} section={section} master={master} startOpen={false} />)}
          </section>
        )}
        {(people.length > 0 || (master && lore)) && (
          <section className="map-region-block" aria-label="Personagens">
            <h3>Personagens</h3>
            {people.length === 0 && <p className="lore-form-hint">Nenhum personagem conhecido nesta região.</p>}
            <Carousel items={people} label="Personagens" onOpen={onOpenLore} />
            {master && lore && <button type="button" className="lore-action ghost" onClick={() => onOpenLore(undefined, draftFor({ kind: 'CHARACTER', regionId: lore.id }))}>+ PERSONAGEM</button>}
          </section>
        )}
        {(places.length > 0 || (master && lore)) && (
          <section className="map-region-block" aria-label="Lugares">
            <h3>Lugares</h3>
            {places.length === 0 && <p className="lore-form-hint">Nenhum lugar conhecido nesta região.</p>}
            <Carousel items={places} label="Lugares" onOpen={onOpenLore} />
            {master && lore && <button type="button" className="lore-action ghost" onClick={() => onOpenLore(undefined, draftFor({ kind: 'PLACE', regionId: lore.id }))}>+ LUGAR</button>}
          </section>
        )}
      </div>
    </aside>
  )
}

// Faixa que rola de lado, com os cards de foto cheia como no Universo; as setas só aparecem quando há mais de um.
function Carousel({ items, label, onOpen }) {
  const track = useRef(null)
  const scroll = dir => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  if (items.length === 0) return null
  return (
    <div className="map-carousel">
      <div className="map-carousel-track" ref={track} role="list" aria-label={label}>
        {items.map(item => (
          <button key={item.id} type="button" role="listitem" className="map-slide" onClick={() => onOpen(item.id)}>
            {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <LoreSigil kind={item.kind} />}
            <span className="map-slide-text">
              <strong>{item.name}</strong>
              {item.subtitle && <small>{item.subtitle}</small>}
            </span>
          </button>
        ))}
      </div>
      {items.length > 1 && <>
        <button type="button" className="map-carousel-arrow prev" onClick={() => scroll(-1)} aria-label="Anterior">‹</button>
        <button type="button" className="map-carousel-arrow next" onClick={() => scroll(1)} aria-label="Próximo">›</button>
      </>}
    </div>
  )
}
