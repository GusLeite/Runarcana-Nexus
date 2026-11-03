import { Suspense, lazy, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoreIcon, MapIcon } from '../sheet/icons.jsx'
import useUrlParam from '../../hooks/useUrlParam.js'

// O Three.js é pesado: só é baixado quando alguém abre o mapa.
const MapScreen = lazy(() => import('./MapScreen.jsx'))
const LoreScreen = lazy(() => import('../lore/LoreScreen.jsx'))

const SCREENS = ['mapa', 'lore']

// Botões do cabeçalho que abrem o mapa e a lore por cima da tela atual, sem perder o estado dela.
// Um leva ao outro: a região abre o verbete, e o verbete mostra onde fica no mapa.
// A tela aberta fica na URL (?tela=mapa|lore): recarregar reabre e o "voltar" do navegador fecha.
export default function WorldButtons({ session }) {
  const [screenId, setScreenId] = useUrlParam('tela', SCREENS, null)
  const [target, setTarget] = useState({}) // { focus } no mapa, { entryId } na lore
  const close = useCallback(() => setScreenId(null), [setScreenId])
  const openLore = useCallback(entryId => { setTarget({ entryId }); setScreenId('lore') }, [setScreenId])
  const showOnMap = useCallback(focus => { setTarget({ focus }); setScreenId('mapa') }, [setScreenId])

  let screen = null
  if (screenId === 'mapa') screen = <MapScreen key="map" session={session} focus={target.focus} onClose={close} onOpenLore={openLore} />
  if (screenId === 'lore') screen = <LoreScreen key="lore" session={session} startId={target.entryId} onClose={close} onShowOnMap={showOnMap} />

  return (
    <>
      <button className="icon-btn" type="button" onClick={() => openLore(undefined)} title="Lore de Runeterra" aria-label="Lore de Runeterra">
        <LoreIcon />
      </button>
      <button className="icon-btn" type="button" onClick={() => showOnMap(undefined)} title="Mapa de Runeterra" aria-label="Mapa de Runeterra">
        <MapIcon />
      </button>
      {screen && createPortal(<Suspense fallback={null}>{screen}</Suspense>, document.body)}
    </>
  )
}
