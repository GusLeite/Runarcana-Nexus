import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import { createMapScene } from './mapScene.js'
import {
  addPoiComment, createPoi, createWaypoint, deletePoi, deletePoiComment, deleteWaypoint, fetchBandle, fetchPois,
  fetchWaypoints, rollBandle, updatePoi, updateWaypoint,
} from '../../api/map.js'
import { fetchLore } from '../../api/lore.js'
import { fetchRecipients } from '../../api/master.js'
import DiceRoll from '../sheet/DiceRoll.jsx'
import { playerName } from '../lore/AudiencePicker.jsx'
import { MAP_AREAS, MAP_DECALS, MAP_DOMES, MAP_GLOBE, MAP_LABELS, MAP_PINS, bandleSpot } from './regions.js'
import RegionPanel from './RegionPanel.jsx'
import { PoiForm, PoiPanel, WaypointPanel } from './MapPointPanels.jsx'
import { PoiGlyph } from './poiKinds.jsx'
import '../../styles/map.css'

const PANEL_WIDTH = 380
// Abaixo disso o painel ocupa a tela inteira e não adianta desviar o mapa.
const PANEL_MIN_SCREEN = 720
const PANEL_DELAY = 1500
const BANDLE_ZOOM = 450
const POINT_ZOOM = 400
// Espera o dado parar de girar (ver DiceRoll) antes de mostrar onde Bandópolis surgiu.
const DIE_SPIN = 800
const NOTICE_MS = 6000
const MAX_WAYPOINTS = 3

const PIN_IMAGES = {
  crest: pin => [`/map/crests/${pin.slug}.png`, `/map/crests/${pin.slug}-hover.png`],
  capital: () => ['/map/pins/capital.png', '/map/pins/capital-hover.png'],
  art: pin => [pin.goldIcon, pin.art[0].icon],
}

const coveredWidth = () => (window.innerWidth >= PANEL_MIN_SCREEN ? PANEL_WIDTH : 0)

// Mapa de Runeterra em tela cheia. A câmera e o relevo ficam em mapScene.js.
// focus: { slug } ou { poiId }, para abrir já mostrando algo (vem da lore).
export default function MapScreen({ session, focus, onClose, onOpenLore }) {
  const master = Boolean(session.master)
  const stage = useRef(null)
  const scene = useRef(null)
  const closeBtn = useRef(null)
  const anchors = useRef({})
  const panelTimer = useRef()
  const scenePins = useRef([])
  const staticPins = useRef([])
  const rollTimers = useRef([])
  const mapClick = useRef(() => {})
  const focused = useRef(false)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [bandleRoll, setBandleRoll] = useState(null)
  const [die, setDie] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [born, setBorn] = useState(false)
  const [notice, setNotice] = useState(null)
  const [lore, setLore] = useState([])
  const [pois, setPois] = useState(null)
  const [waypoints, setWaypoints] = useState([])
  const [players, setPlayers] = useState([])
  const [placing, setPlacing] = useState(null) // null | 'poi' | 'waypoint'
  const [panel, setPanel] = useState(null) // null | { type: 'poi' | 'poiForm' | 'waypoint', id, draft }
  const closeDie = useCallback(() => setDie(null), [])

  useEffect(() => {
    let cancelled = false
    const statics = [...MAP_PINS, ...MAP_LABELS].map(pin => ({ slug: pin.slug, el: anchors.current[pin.slug], x: pin.x, y: pin.y, z: pin.z, level: pin.level, lift: pin.lift }))
    staticPins.current = statics
    const pins = [...statics]
    scenePins.current = pins
    createMapScene(stage.current, {
      reducedMotion: prefersReducedMotion(),
      pins,
      decals: MAP_DECALS,
      areas: MAP_AREAS,
      domes: MAP_DOMES,
      globe: MAP_GLOBE,
      onPinsChange: () => setHovered(null),
      onMapClick: (x, y) => mapClick.current(x, y),
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
    fetchLore(session.token).then(setLore).catch(() => {})
    fetchPois(session.token).then(setPois).catch(() => setPois([]))
    fetchWaypoints(session.token).then(setWaypoints).catch(() => {})
    if (master) fetchRecipients(session.token).then(setPlayers).catch(() => {})
  }, [session.token, master])

  // A cena lê estes objetos a cada quadro: basta mudá-los para Bandópolis aparecer no lugar novo.
  useEffect(() => {
    const spot = bandleSpot(bandleRoll)
    const pin = staticPins.current.find(p => p.slug === 'bandle')
    if (spot && pin) Object.assign(pin, { x: spot.x, y: spot.y, z: spot.z, level: 'any' })
  }, [bandleRoll])

  // Pontos que mudam com o uso: a lista que a cena percorre é a mesma, só troca o conteúdo.
  const draftPoint = panel?.draft ? { x: panel.draft.x, y: panel.draft.y } : null
  useEffect(() => {
    const heightAt = (x, y) => scene.current?.heightAt(x, y) ?? 0
    const dynamic = [
      ...(pois ?? []).map(p => ({ slug: 'poi-' + p.id, x: p.x, y: p.y, level: 'near' })),
      ...waypoints.map(w => ({ slug: 'wp-' + w.id, x: w.x, y: w.y, level: 'any' })),
      ...(draftPoint ? [{ slug: 'draft', x: draftPoint.x, y: draftPoint.y, level: 'any' }] : []),
    ]
      .map(p => ({ ...p, el: anchors.current[p.slug], z: heightAt(p.x, p.y), lift: 0 }))
      .filter(p => p.el)
    scenePins.current.length = 0
    scenePins.current.push(...staticPins.current, ...dynamic)
  }, [pois, waypoints, draftPoint?.x, draftPoint?.y, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const rollDie = async () => {
    setRolling(true)
    setNotice(null)
    try {
      const { roll } = await rollBandle(session.token)
      const spot = bandleSpot(roll)
      setSelected(null)
      setPanel(null)
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
    setPanel(null)
    const where = pin.slug === 'bandle' ? bandleSpot(bandleRoll) : pin
    scene.current?.focus(where.x, where.y, pin.zoom, coveredWidth())
    clearTimeout(panelTimer.current)
    panelTimer.current = setTimeout(() => setSelected(pin.slug), prefersReducedMotion() ? 0 : PANEL_DELAY)
  }

  const openPoint = (type, point) => {
    clearTimeout(panelTimer.current)
    setHovered(null)
    setSelected(null)
    setPlacing(null)
    setPanel({ type, id: point.id })
    scene.current?.focus(point.x, point.y, POINT_ZOOM, coveredWidth())
  }

  // Marcar no mapa: com o modo ligado, o próximo clique vira o rascunho do ponto.
  mapClick.current = (clientX, clientY) => {
    if (!placing) return
    const world = scene.current?.screenToWorld(clientX, clientY)
    if (!world || Math.abs(world.x) > 1024 || Math.abs(world.y) > 1024) {
      setNotice('Esse lugar fica fora do mapa.')
      return
    }
    setNotice(null)
    setSelected(null)
    setPanel({ type: placing === 'poi' ? 'poiForm' : 'waypoint', draft: world })
    setPlacing(null)
  }

  // Abre já mostrando o que a lore pediu, uma vez, quando a cena e os pontos estiverem prontos.
  useEffect(() => {
    if (!focus || focused.current || status !== 'ready' || pois === null) return
    focused.current = true
    if (focus.poiId) {
      const poi = pois.find(p => p.id === focus.poiId)
      if (poi) openPoint('poi', poi)
    } else if (focus.slug) {
      const pin = MAP_PINS.find(p => p.slug === focus.slug)
      if (pin && (pin.slug !== 'bandle' || bandleRoll)) select(pin)
    }
  }, [focus, status, pois, bandleRoll]) // eslint-disable-line react-hooks/exhaustive-deps

  const savePoi = async form => {
    const saved = panel.id ? await updatePoi(session.token, panel.id, form) : await createPoi(session.token, form)
    setPois(list => (panel.id ? list.map(p => (p.id === saved.id ? saved : p)) : [...list, saved]))
    openPoint('poi', saved)
  }

  const removePoi = async poi => {
    await deletePoi(session.token, poi.id)
    setPois(list => list.filter(p => p.id !== poi.id))
    setPanel(null)
  }

  const addComment = async (poi, comment) => {
    const saved = await addPoiComment(session.token, poi.id, comment)
    setPois(list => list.map(p => (p.id === poi.id ? { ...p, comments: [...p.comments, saved] } : p)))
  }

  const removeComment = async (poi, comment) => {
    await deletePoiComment(session.token, comment.id)
    setPois(list => list.map(p => (p.id === poi.id ? { ...p, comments: p.comments.filter(c => c.id !== comment.id) } : p)))
  }

  const saveWaypoint = async form => {
    const saved = panel.id ? await updateWaypoint(session.token, panel.id, form) : await createWaypoint(session.token, form)
    setWaypoints(list => (panel.id ? list.map(w => (w.id === saved.id ? saved : w)) : [...list, saved]))
    setPanel({ type: 'waypoint', id: saved.id })
  }

  const removeWaypoint = async waypoint => {
    await deleteWaypoint(session.token, waypoint.id)
    setWaypoints(list => list.filter(w => w.id !== waypoint.id))
    setPanel(null)
  }

  useEffect(() => {
    closeBtn.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      // Fecha o que estiver por cima: primeiro o modo de marcar, depois o painel, por fim o mapa.
      if (placing) setPlacing(null)
      else if (panel) setPanel(null)
      else if (selected) setSelected(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, selected, panel, placing])

  const teased = MAP_PINS.find(p => p.slug === hovered)
  const chosen = MAP_PINS.find(p => p.slug === selected)
  const loreOf = pin => lore.find(entry => entry.kind === 'REGION' && entry.mapSlug === pin.slug)
  const mine = master ? [] : waypoints
  const openPoi = panel?.type === 'poi' ? pois?.find(p => p.id === panel.id) : null
  const editedPoi = panel?.type === 'poiForm' ? (panel.draft ?? pois?.find(p => p.id === panel.id)) : null
  const openWaypoint = panel?.type === 'waypoint' ? (panel.draft ?? waypoints.find(w => w.id === panel.id)) : null

  return (
    <div className={'map-screen ' + status + (placing ? ' placing' : '')} role="dialog" aria-modal="true" aria-label="Mapa de Runeterra">
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
          {(pois ?? []).map(poi => (
            <button key={poi.id} ref={el => { anchors.current['poi-' + poi.id] = el }} className={'map-pin map-poi map-poi-' + poi.kind.toLowerCase()} type="button" onClick={() => openPoint('poi', poi)}>
              <span className="map-poi-icon"><PoiGlyph kind={poi.kind} /></span>
              <span className="map-pin-name">{poi.name}</span>
            </button>
          ))}
          {waypoints.map(waypoint => (
            <button key={waypoint.id} ref={el => { anchors.current['wp-' + waypoint.id] = el }} className="map-pin map-waypoint" type="button" onClick={() => openPoint('waypoint', waypoint)}>
              <span className="map-waypoint-flag" aria-hidden="true" />
              <span className="map-pin-name">{master ? waypoint.name + ' · ' + playerName(waypoint.owner) : waypoint.name}</span>
            </button>
          ))}
          {draftPoint && <span ref={el => { anchors.current.draft = el }} className="map-pin map-waypoint map-draft"><span className="map-waypoint-flag" aria-hidden="true" /></span>}
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
          <div className="map-tools">
            {master
              ? <button type="button" className={'map-tool' + (placing === 'poi' ? ' on' : '')} aria-pressed={placing === 'poi'} onClick={() => setPlacing(p => (p === 'poi' ? null : 'poi'))}>+ PONTO DE INTERESSE</button>
              : (
                <>
                  <button type="button" className={'map-tool' + (placing === 'waypoint' ? ' on' : '')} aria-pressed={placing === 'waypoint'} disabled={mine.length >= MAX_WAYPOINTS} title={mine.length >= MAX_WAYPOINTS ? 'Apague um waypoint para criar outro' : undefined} onClick={() => setPlacing(p => (p === 'waypoint' ? null : 'waypoint'))}>
                    + WAYPOINT {mine.length}/{MAX_WAYPOINTS}
                  </button>
                  {mine.map(waypoint => <button key={waypoint.id} type="button" className="map-tool quiet" onClick={() => openPoint('waypoint', waypoint)}>{waypoint.name}</button>)}
                </>
              )}
          </div>
          <p className="map-hint">Arraste para mover · role para aproximar</p>
          {master && (
            <button className="map-roll" type="button" onClick={rollDie} disabled={rolling || die !== null}>
              {bandleRoll ? 'ROLAR BANDÓPOLIS DE NOVO' : 'ROLAR BANDÓPOLIS'}
            </button>
          )}
        </>
      )}
      {placing && <div className="map-tease" role="status"><strong>Clique no mapa para marcar</strong><span>Esc cancela.</span></div>}
      {notice && !placing && !teased && !chosen && <div className="map-tease" role="status"><strong>{notice}</strong></div>}
      {teased && !placing && !chosen && !panel && (
        <div className="map-tease">
          <strong>{teased.name}</strong>
          <span>{loreOf(teased)?.subtitle ?? teased.art[0].tagline}</span>
        </div>
      )}
      <DiceRoll roll={die} onClose={closeDie} />
      {chosen && <RegionPanel key={chosen.slug} region={chosen} lore={loreOf(chosen)} onOpenLore={onOpenLore} onClose={() => setSelected(null)} />}
      {openPoi && (
        <PoiPanel
          key={openPoi.id}
          poi={openPoi}
          loreEntry={lore.find(entry => entry.id === openPoi.loreEntryId)}
          master={master}
          onOpenLore={onOpenLore}
          onEdit={() => setPanel({ type: 'poiForm', id: openPoi.id })}
          onAddComment={addComment}
          onDeleteComment={removeComment}
          onClose={() => setPanel(null)}
        />
      )}
      {editedPoi && <PoiForm key={editedPoi.id ?? 'new'} poi={editedPoi} lore={lore} players={players} onSave={savePoi} onDelete={removePoi} onClose={() => setPanel(null)} />}
      {openWaypoint && <WaypointPanel key={openWaypoint.id ?? 'new'} waypoint={openWaypoint} readOnly={master} onSave={saveWaypoint} onDelete={removeWaypoint} onClose={() => setPanel(null)} />}
      <p className="map-legal">Projeto de fãs sem fins lucrativos, não endossado pela Riot Games. Arte do mapa © Riot Games.</p>
    </div>
  )
}
