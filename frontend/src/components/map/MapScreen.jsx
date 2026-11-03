import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import { createMapScene } from './mapScene.js'
import { MAP_REGIONS } from './regions.js'
import RegionPanel from './RegionPanel.jsx'
import '../../styles/map.css'

const REGION_ZOOM = 300
const PANEL_WIDTH = 380
// Abaixo disso o painel ocupa a tela inteira e não adianta desviar o mapa.
const PANEL_MIN_SCREEN = 720
const PANEL_DELAY = 1500

// Mapa de Runeterra em tela cheia. A câmera e o relevo ficam em mapScene.js.
export default function MapScreen({ onClose }) {
  const stage = useRef(null)
  const scene = useRef(null)
  const closeBtn = useRef(null)
  const crests = useRef({})
  const panelTimer = useRef()
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    const pins = MAP_REGIONS.map(region => ({ el: crests.current[region.slug], x: region.x, y: region.y, z: region.z }))
    createMapScene(stage.current, { reducedMotion: prefersReducedMotion(), pins })
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
      clearTimeout(panelTimer.current)
      scene.current?.destroy()
      scene.current = null
    }
  }, [])

  // A região escolhida continua acesa enquanto o painel dela estiver aberto.
  const lit = hovered ?? selected
  useEffect(() => {
    const region = MAP_REGIONS.find(r => r.slug === lit)
    scene.current?.highlight(region?.highlight ? region.slug : null)
  }, [lit])

  const select = region => {
    setHovered(null)
    setSelected(null)
    const covered = window.innerWidth >= PANEL_MIN_SCREEN ? PANEL_WIDTH : 0
    scene.current?.focus(region.x, region.y, REGION_ZOOM, covered)
    clearTimeout(panelTimer.current)
    panelTimer.current = setTimeout(() => setSelected(region.slug), prefersReducedMotion() ? 0 : PANEL_DELAY)
  }

  useEffect(() => {
    closeBtn.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      // Com um painel aberto, o Esc fecha só ele.
      if (selected) setSelected(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, selected])

  const teased = MAP_REGIONS.find(r => r.slug === hovered)
  const chosen = MAP_REGIONS.find(r => r.slug === selected)

  return (
    <div className={'map-screen ' + status} role="dialog" aria-modal="true" aria-label="Mapa de Runeterra">
      <div className="map-stage" ref={stage}>
        <div className="map-pins">
          {MAP_REGIONS.map(region => (
            <button
              key={region.slug}
              ref={el => { crests.current[region.slug] = el }}
              className="map-crest"
              type="button"
              onClick={() => select(region)}
              onPointerEnter={() => setHovered(region.slug)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(region.slug)}
              onBlur={() => setHovered(null)}
            >
              <span className="map-crest-icons">
                {region.art.map(art => <img key={art.icon} src={art.icon} alt="" draggable="false" />)}
              </span>
              <span className="map-crest-name">{region.name}</span>
            </button>
          ))}
        </div>
      </div>
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
      {teased && !chosen && (
        <div className="map-tease">
          <strong>{teased.name}</strong>
          <span>{teased.art[0].tagline}</span>
        </div>
      )}
      {chosen && <RegionPanel key={chosen.slug} region={chosen} onClose={() => setSelected(null)} />}
      <p className="map-legal">Projeto de fãs sem fins lucrativos, não endossado pela Riot Games. Arte do mapa © Riot Games.</p>
    </div>
  )
}
