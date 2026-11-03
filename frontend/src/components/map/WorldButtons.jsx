import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoreIcon, MapIcon } from '../sheet/icons.jsx'
import useUrlParam from '../../hooks/useUrlParam.js'
import { pointFromSearch, withoutPoint } from '../../utils/mapLink.js'

// O Three.js é pesado: só é baixado quando alguém abre o mapa.
const MapScreen = lazy(() => import('./MapScreen.jsx'))
const LoreScreen = lazy(() => import('../lore/LoreScreen.jsx'))

const SCREENS = ['mapa', 'lore']

// Botões do cabeçalho que abrem o mapa e a lore por cima da tela atual, sem perder o estado dela.
// Um leva ao outro: a região abre o verbete, e o verbete mostra onde fica no mapa.
// A tela aberta fica na URL (?tela=mapa|lore): recarregar reabre e o "voltar" do navegador fecha.
// Link de local: ?tela=mapa&ponto=12 abre o mapa voando até o ponto (quem não vê o ponto cai no mapa sem foco).
export default function WorldButtons({ session }) {
  const [screenId, setScreenId] = useUrlParam('tela', SCREENS, null)
  const [target, setTarget] = useState(() => ({ focus: focusFromUrl() })) // { focus } no mapa, { entryId } na lore
  const close = useCallback(() => {
    setScreenId(null)
    window.history.replaceState(window.history.state, '', withoutPoint(window.location.href))
  }, [setScreenId])
  const openLore = useCallback(entryId => { setTarget({ entryId }); setScreenId('lore') }, [setScreenId])
  const showOnMap = useCallback(focus => { setTarget({ focus }); setScreenId('mapa') }, [setScreenId])

  // Colar ou clicar um link de local com o mapa já aberto (ou o "voltar" do navegador) leva ao ponto.
  useEffect(() => {
    const onPop = () => {
      const focus = focusFromUrl()
      if (focus) setTarget({ focus })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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

function focusFromUrl() {
  const poiId = pointFromSearch(window.location.search)
  return poiId == null ? undefined : { poiId }
}
