import { MAP_PINS } from './regions.js'
import { POI_KINDS } from './poiKinds.jsx'

const regionName = slug => MAP_PINS.find(pin => pin.slug === slug)?.name ?? slug

// Mestre: os lugares do mapa oficial, por região. Cada um liga e desliga para os jogadores; a região e o mapa inteiro também.
export default function OfficialPlacesPanel({ places, busy, onToggle, onBulk, onOpen, onClose }) {
  const regions = [...new Set(places.map(p => p.regionSlug))]
  const shown = places.filter(p => p.toAll).length
  return (
    <section className="map-official" aria-label="Lugares do mapa oficial">
      <header>
        <div>
          <small>MAPA OFICIAL</small>
          <strong>{shown}/{places.length} visíveis para os jogadores</strong>
        </div>
        <button type="button" className="map-head-close" onClick={onClose} aria-label="Fechar a lista de lugares oficiais">×</button>
      </header>
      <div className="map-official-all">
        <button type="button" className="map-tool" disabled={busy || shown === places.length} onClick={() => onBulk(null, true)}>MOSTRAR TODOS</button>
        <button type="button" className="map-tool quiet" disabled={busy || shown === 0} onClick={() => onBulk(null, false)}>ESCONDER TODOS</button>
      </div>
      <div className="map-official-list">
        {regions.map(slug => {
          const list = places.filter(p => p.regionSlug === slug)
          const on = list.filter(p => p.toAll).length
          return (
            <div key={slug} className="map-official-region">
              <div className="map-official-head">
                <b>{regionName(slug)} <span>{on}/{list.length}</span></b>
                <button type="button" className="map-official-link" disabled={busy || on === list.length} onClick={() => onBulk(slug, true)}>mostrar</button>
                <button type="button" className="map-official-link" disabled={busy || on === 0} onClick={() => onBulk(slug, false)}>esconder</button>
              </div>
              <ul>
                {list.map(poi => (
                  <li key={poi.id}>
                    <label className="map-official-row">
                      <input type="checkbox" checked={poi.toAll} disabled={busy} onChange={() => onToggle(poi)} />
                      <span>{poi.name} <small>{POI_KINDS[poi.kind]}</small></span>
                    </label>
                    <button type="button" className="map-official-link" onClick={() => onOpen(poi)}>ver</button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
