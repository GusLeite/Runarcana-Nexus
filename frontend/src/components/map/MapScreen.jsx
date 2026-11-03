import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import { createMapScene } from './mapScene.js'
import { fetchBandle, rollBandle } from '../../api/map.js'
import DiceRoll from '../sheet/DiceRoll.jsx'
import { MAP_AREAS, MAP_DECALS, MAP_LABELS, MAP_PINS, bandleSpot } from './regions.js'
import RegionPanel from './RegionPanel.jsx'
import '../../styles/map.css'

const PANEL_WIDTH = 380
// Abaixo disso o painel ocupa a tela inteira e não adianta desviar o mapa.
const PANEL_MIN_SCREEN = 720
const PANEL_DELAY = 1500
const BANDLE_ZOOM = 450
// Espera o dado parar de girar (ver DiceRoll) antes de mostrar onde Bandópolis surgiu.
const DIE_SPIN = 800
const NOTICE_MS = 6000

const PIN_IMAGES = {
  crest: pin => [`/map/crests/${pin.slug}.png`, `/map/crests/${pin.slug}-hover.png`],
  capital: () => ['/map/pins/capital.png', '/map/pins/capital-hover.png'],
  art: pin => [pin.goldIcon, pin.art[0].icon],
}

// Mapa de Runeterra em tela cheia. A câmera e o relevo ficam em mapScene.js.
export default function MapScreen({ session, onClose }) {
  const stage = useRef(null)
  const scene = useRef(null)
  const closeBtn = useRef(null)
  const anchors = useRef({})
  const panelTimer = useRef()
  const scenePins = useRef([])
  const rollTimers = useRef([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [bandleRoll, setBandleRoll] = useState(null)
  const [die, setDie] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [born, setBorn] = useState(false)
  const [notice, setNotice] = useState(null)
  const closeDie = useCallback(() => setDie(null), [])

  useEffect(() => {
    let cancelled = false
    const pins = [...MAP_PINS, ...MAP_LABELS].map(pin => ({ slug: pin.slug, el: anchors.current[pin.slug], x: pin.x, y: pin.y, z: pin.z, level: pin.level, lift: pin.lift }))
    scenePins.current = pins
    createMapScene(stage.current, {
      reducedMotion: prefersReducedMotion(),
      pins,
      decals: MAP_DECALS,
      areas: MAP_AREAS,
      onPinsChange: () => setHovered(null),
    })
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
      rollTimers.current.forEach(clearTimeout)
      scene.current?.destroy()
      scene.current = null
    }
  }, [])

  useEffect(() => {
    fetchBandle(session.token).then(res => setBandleRoll(res.roll)).catch(() => {})
  }, [session.token])

  // A cena lê estes objetos a cada quadro: basta mudá-los para Bandópolis aparecer no lugar novo.
  useEffect(() => {
    const spot = bandleSpot(bandleRoll)
    const pin = scenePins.current.find(p => p.slug === 'bandle')
    if (spot && pin) Object.assign(pin, { x: spot.x, y: spot.y, z: spot.z, level: 'any' })
  }, [bandleRoll])

  const rollDie = async () => {
    setRolling(true)
    setNotice(null)
    try {
      const { roll } = await rollBandle(session.token)
      const spot = bandleSpot(roll)
      setSelected(null)
      setBorn(false)
      setDie({ kind: 'dice', label: 'Bandópolis', expr: '1d10', count: 1, sides: 10, bonus: 0, rolls: [roll], total: roll })
      rollTimers.current.push(setTimeout(() => {
        setBandleRoll(roll)
        setBorn(true)
        setNotice('Bandópolis surgiu em ' + spot.region + '.')
        scene.current?.focus(spot.x, spot.y, BANDLE_ZOOM)
      }, prefersReducedMotion() ? 0 : DIE_SPIN))
      rollTimers.current.push(setTimeout(() => setNotice(null), NOTICE_MS + DIE_SPIN))
    } catch (err) {
      setNotice(err.message)
    } finally {
      setRolling(false)
    }
  }

  // A região escolhida continua acesa enquanto o painel dela estiver aberto.
  const lit = hovered ?? selected
  useEffect(() => {
    const pin = MAP_PINS.find(p => p.slug === lit)
    scene.current?.highlight(pin?.highlight ? pin.slug : null)
  }, [lit])

  const select = pin => {
    setHovered(null)
    setSelected(null)
    const covered = window.innerWidth >= PANEL_MIN_SCREEN ? PANEL_WIDTH : 0
    const where = pin.slug === 'bandle' ? bandleSpot(bandleRoll) : pin
    scene.current?.focus(where.x, where.y, pin.zoom, covered)
    clearTimeout(panelTimer.current)
    panelTimer.current = setTimeout(() => setSelected(pin.slug), prefersReducedMotion() ? 0 : PANEL_DELAY)
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

  const teased = MAP_PINS.find(p => p.slug === hovered)
  const chosen = MAP_PINS.find(p => p.slug === selected)

  return (
    <div className={'map-screen ' + status} role="dialog" aria-modal="true" aria-label="Mapa de Runeterra">
      <div className="map-stage" ref={stage}>
        <div className="map-pins">
          {MAP_PINS.map(pin => {
            const [normal, active] = PIN_IMAGES[pin.icon](pin)
            return (
              <button
                key={pin.slug}
                ref={el => { anchors.current[pin.slug] = el }}
                className={'map-pin map-pin-' + pin.icon + (pin.slug === 'bandle' && born ? ' map-pin-born' : '')}
                type="button"
                onClick={() => select(pin)}
                onPointerEnter={() => setHovered(pin.slug)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(pin.slug)}
                onBlur={() => setHovered(null)}
              >
                <span className="map-pin-icon">
                  <img src={normal} alt="" draggable="false" />
                  <img className="map-pin-active" src={active} alt="" draggable="false" />
                </span>
                <span className="map-pin-name">{pin.name}</span>
              </button>
            )
          })}
          {MAP_LABELS.map(label => (
            <span key={label.slug} ref={el => { anchors.current[label.slug] = el }} className="map-pin map-label">{label.name}</span>
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
          {session.master && (
            <button className="map-roll" type="button" onClick={rollDie} disabled={rolling || die !== null}>
              {bandleRoll ? 'ROLAR BANDÓPOLIS DE NOVO' : 'ROLAR BANDÓPOLIS'}
            </button>
          )}
        </>
      )}
      {notice && !teased && !chosen && <div className="map-tease" role="status"><strong>{notice}</strong></div>}
      {teased && !chosen && (
        <div className="map-tease">
          <strong>{teased.name}</strong>
          <span>{teased.art[0].tagline}</span>
        </div>
      )}
      <DiceRoll roll={die} onClose={closeDie} />
      {chosen && <RegionPanel key={chosen.slug} region={chosen} onClose={() => setSelected(null)} />}
      <p className="map-legal">Projeto de fãs sem fins lucrativos, não endossado pela Riot Games. Arte do mapa © Riot Games.</p>
    </div>
  )
}
