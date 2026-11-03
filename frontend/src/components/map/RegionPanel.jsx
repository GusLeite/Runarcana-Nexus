import { prefersReducedMotion } from '../../hooks/useCountUp.js'

// Painel lateral da região escolhida, com a arte e as descrições que a criação de personagem já usa.
// Quando a lore tem um verbete desta região, mostra as informações dele e leva até lá.
export default function RegionPanel({ region, lore, onOpenLore, onClose }) {
  const [main] = region.art
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
        {lore && <button type="button" className="lore-action" onClick={() => onOpenLore(lore.id)}>ABRIR NA LORE</button>}
      </div>
    </aside>
  )
}
