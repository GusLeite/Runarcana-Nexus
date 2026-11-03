import { Suspense, lazy, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapIcon } from '../sheet/icons.jsx'

// O Three.js é pesado: só é baixado quando alguém abre o mapa.
const MapScreen = lazy(() => import('./MapScreen.jsx'))

// Botão do cabeçalho que abre o mapa por cima da tela atual, sem perder o estado dela.
export default function MapButton({ session }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <button className="icon-btn" type="button" onClick={() => setOpen(true)} title="Mapa de Runeterra" aria-label="Mapa de Runeterra">
        <MapIcon />
      </button>
      {open && createPortal(<Suspense fallback={null}><MapScreen session={session} onClose={close} /></Suspense>, document.body)}
    </>
  )
}
