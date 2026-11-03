import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import { Knowledge, LoreCard } from '../lore/LoreEntryView.jsx'
import CopyLinkButton from './CopyLinkButton.jsx'

// Painel lateral da região escolhida, com a arte e as descrições que a criação de personagem já usa.
// Quando a lore tem um verbete desta região, mostra as informações dele, os conhecimentos liberados, os personagens
// e lugares ligados a ela e leva até lá. O mestre cria o verbete da região e os personagens dela sem sair do mapa.
export default function RegionPanel({ region, lore, master, onOpenLore, onClose }) {
  const [main] = region.art
  const people = lore?.linked.filter(item => item.kind === 'CHARACTER') ?? []
  const places = lore?.linked.filter(item => item.kind === 'PLACE') ?? []
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
        {lore?.summary
          ? <p>{lore.summary}</p>
          : region.art.map(art => <p key={art.icon}>{art.tagline}</p>)}
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
            <div className="map-region-cards">{people.map(item => <LoreCard key={item.id} item={item} onOpen={onOpenLore} />)}</div>
            {master && lore && <button type="button" className="lore-action ghost" onClick={() => onOpenLore(undefined, draftFor({ kind: 'CHARACTER', regionId: lore.id }))}>+ PERSONAGEM</button>}
          </section>
        )}
        {(places.length > 0 || (master && lore)) && (
          <section className="map-region-block" aria-label="Lugares">
            <h3>Lugares</h3>
            {places.length === 0 && <p className="lore-form-hint">Nenhum lugar conhecido nesta região.</p>}
            <div className="map-region-cards">{places.map(item => <LoreCard key={item.id} item={item} onOpen={onOpenLore} />)}</div>
            {master && lore && <button type="button" className="lore-action ghost" onClick={() => onOpenLore(undefined, draftFor({ kind: 'PLACE', regionId: lore.id }))}>+ LUGAR</button>}
          </section>
        )}
      </div>
    </aside>
  )
}
