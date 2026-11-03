import { Suspense, lazy, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoreIcon, MapIcon } from '../sheet/icons.jsx'

// O Three.js é pesado: só é baixado quando alguém abre o mapa.
const MapScreen = lazy(() => import('./MapScreen.jsx'))
const LoreScreen = lazy(() => import('../lore/LoreScreen.jsx'))

// Botões do cabeçalho que abrem o mapa e a lore por cima da tela atual, sem perder o estado dela.
// Um leva ao outro: a região abre o verbete, e o verbete mostra onde fica no mapa.
export default function WorldButtons({ session }) {
  const [view, setView] = useState(null) // null | { screen: 'map', focus } | { screen: 'lore', entryId }
  const close = useCallback(() => setView(null), [])
  const openLore = useCallback(entryId => setView({ screen: 'lore', entryId }), [])
  const showOnMap = useCallback(focus => setView({ screen: 'map', focus }), [])

  let screen = null
  if (view?.screen === 'map') screen = <MapScreen key="map" session={session} focus={view.focus} onClose={close} onOpenLore={openLore} />
  if (view?.screen === 'lore') screen = <LoreScreen key="lore" session={session} startId={view.entryId} onClose={close} onShowOnMap={showOnMap} />

  return (
    <>
      <button className="icon-btn" type="button" onClick={() => setView({ screen: 'lore' })} title="Lore de Runeterra" aria-label="Lore de Runeterra">
        <LoreIcon />
      </button>
      <button className="icon-btn" type="button" onClick={() => setView({ screen: 'map' })} title="Mapa de Runeterra" aria-label="Mapa de Runeterra">
        <MapIcon />
      </button>
      {screen && createPortal(<Suspense fallback={null}>{screen}</Suspense>, document.body)}
    </>
  )
}
