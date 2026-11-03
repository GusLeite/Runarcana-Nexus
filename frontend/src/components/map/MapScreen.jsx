import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import { createMapScene } from './mapScene.js'
import '../../styles/map.css'

// Mapa de Runeterra em tela cheia. A câmera e o relevo ficam em mapScene.js.
export default function MapScreen({ onClose }) {
  const stage = useRef(null)
  const scene = useRef(null)
  const closeBtn = useRef(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false
    createMapScene(stage.current, { reducedMotion: prefersReducedMotion() })
      .then(created => {
        if (cancelled) return created.destroy()
        scene.current = created
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
      scene.current?.destroy()
      scene.current = null
    }
  }, [])

  useEffect(() => {
    closeBtn.current?.focus()
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={'map-screen ' + status} role="dialog" aria-modal="true" aria-label="Mapa de Runeterra">
      <div className="map-stage" ref={stage} />
      <div className="map-head">
        <h1>RUNETERRA</h1>
        <button ref={closeBtn} className="map-btn map-close" type="button" onClick={onClose} title="Fechar o mapa" aria-label="Fechar o mapa">×</button>
      </div>
      {status === 'loading' && <p className="map-msg">Desenrolando o mapa…</p>}
      {status === 'error' && <p className="map-msg">Não foi possível abrir o mapa. Confira se o navegador tem WebGL ativo e tente de novo.</p>}
      {status === 'ready' && (
        <>
          <div className="map-zoom">
            <button className="map-btn" type="button" onClick={() => scene.current?.zoomBy(0.75)} title="Aproximar" aria-label="Aproximar">+</button>
            <button className="map-btn" type="button" onClick={() => scene.current?.zoomBy(1 / 0.75)} title="Afastar" aria-label="Afastar">−</button>
          </div>
          <p className="map-hint">Arraste para mover · role para aproximar</p>
        </>
      )}
      <p className="map-legal">Projeto de fãs sem fins lucrativos, não endossado pela Riot Games. Arte do mapa © Riot Games.</p>
    </div>
  )
}
