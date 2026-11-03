import { prefersReducedMotion } from '../../hooks/useCountUp.js'

// Painel lateral da região escolhida, com a arte e as descrições que a criação de personagem já usa.
export default function RegionPanel({ region, onClose }) {
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
        <h2>{region.name}</h2>
        {region.art.map(art => <p key={art.icon}>{art.tagline}</p>)}
      </div>
    </aside>
  )
}
