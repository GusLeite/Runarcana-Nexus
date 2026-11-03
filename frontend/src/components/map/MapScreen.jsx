import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import { createMapScene } from './mapScene.js'
import {
  addPoiComment, clearPartyTrail, createPoi, createWaypoint, deletePoi, deletePoiComment, deleteWaypoint, fetchBandle, fetchParty, fetchPois,
  fetchPoiImages, fetchWaypoints, hideParty, moveParty, rollBandle, setMapFog, setPoiAudience, setRegionRevealed, updatePoi, updateWaypoint,
} from '../../api/map.js'
import { fetchLore } from '../../api/lore.js'
import { fetchRecipients } from '../../api/master.js'
import DiceRoll from '../sheet/DiceRoll.jsx'
import { playerName } from '../lore/AudiencePicker.jsx'
import { FOG_AREAS, FOG_REGIONS, MAP_AREAS, MAP_DECALS, MAP_DOMES, MAP_GLOBE, MAP_LABELS, MAP_PINS, bandleSpot, nearestRegion } from './regions.js'
import { sineInOut } from './mapMath.js'
import RegionPanel from './RegionPanel.jsx'
import { PoiForm, PoiPanel, WaypointPanel } from './MapPointPanels.jsx'
import { PoiGlyph } from './poiKinds.jsx'
import { ImageLightbox } from './PoiGallery.jsx'
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
// O grupo no mapa: todos conferem a cada poucos segundos; o marcador anda até o lugar novo.
const PARTY_POLL = 3000
const PARTY_WALK_MS = 1600
// Pontos: conferidos com a mesma frequência; o recém-revelado brota e fica em destaque por um tempo.
const POI_POLL = 5000
const BORN_MS = 4000
// Névoa: quase opaca para os jogadores; o mestre vê através.
const FOG_PLAYER = 0.96
const FOG_MASTER = 0.45

const PIN_IMAGES = {
  crest: pin => [`/map/crests/${pin.slug}.png`, `/map/crests/${pin.slug}-hover.png`],
  capital: () => ['/map/pins/capital.png', '/map/pins/capital-hover.png'],
  art: pin => [pin.goldIcon, pin.art[0].icon],
}

const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many)
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
  const focused = useRef(null)
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
  // O grupo: { x, y, trail, fog, revealed } do back. partyPin é o ponto que a cena desenha (anda aos poucos).
  const [party, setParty] = useState(null)
  const [fogOpen, setFogOpen] = useState(false)
  const partyPin = useRef({ slug: 'party', el: null, x: 0, y: 0, z: 0, level: 'any', lift: 0 })
  const partyWalk = useRef(0)
  const partyDrag = useRef(null)
  const trailKey = useRef(null)
  // Ponto recém-revelado ao jogador: { id, name } para o aviso com "Ver no mapa"; born: ids que brotam agora.
  const [freshPoi, setFreshPoi] = useState(null)
  const [bornPois, setBornPois] = useState([])
  const [tableImage, setTableImage] = useState(null) // { images, index, title }: o que o mestre mandou mostrar à mesa

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
      fogAreas: FOG_AREAS,
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
    fetchWaypoints(session.token).then(setWaypoints).catch(() => {})
    if (master) fetchRecipients(session.token).then(setPlayers).catch(() => {})
  }, [session.token, master])

  // Pontos de interesse: conferidos a cada poucos segundos; o jogador é avisado do que acabou de ser revelado a ele.
  useEffect(() => {
    let known = null
    const revs = new Map() // última revisão de MOSTRAR À MESA vista em cada ponto
    let lastKey = null
    const check = () => {
      if (document.hidden && known) return
      fetchPois(session.token)
        .then(list => {
          if (known && !master) {
            const fresh = list.filter(p => !known.has(p.id))
            if (fresh.length) {
              setFreshPoi(fresh[0])
              setBornPois(fresh.map(p => p.id))
              setTimeout(() => setBornPois([]), BORN_MS)
            }
          }
          if (!master) {
            const shown = list.find(p => known && revs.has(p.id) && p.spotlightRev > revs.get(p.id) && p.spotlight != null)
            if (shown) {
              fetchPoiImages(session.token, shown.id).then(images => { if (images[shown.spotlight]) setTableImage({ images, index: shown.spotlight, title: shown.name }) }).catch(() => {})
            }
          }
          list.forEach(p => revs.set(p.id, p.spotlightRev ?? 0))
          known = new Set(list.map(p => p.id))
          const key = JSON.stringify(list)
          if (key !== lastKey) { lastKey = key; setPois(list) }
        })
        .catch(() => setPois(p => p ?? []))
    }
    check()
    const t = setInterval(check, POI_POLL)
    return () => clearInterval(t)
  }, [session.token, master])

  // O grupo: a mesa inteira confere a cada poucos segundos (com a aba visível); só troca o estado quando muda.
  useEffect(() => {
    let last = null
    const check = () => {
      if (document.hidden) return
      fetchParty(session.token)
        .then(view => {
          const key = JSON.stringify(view)
          if (key !== last) { last = key; setParty(view) }
        })
        .catch(() => {})
    }
    check()
    const t = setInterval(check, PARTY_POLL)
    return () => clearInterval(t)
  }, [session.token])

  // O marcador anda do lugar antigo até o novo (sem animação na primeira vez ou com movimento reduzido).
  const partyX = party?.x
  const partyY = party?.y
  useEffect(() => {
    if (partyX == null || status !== 'ready' || partyDrag.current) return undefined
    const pin = partyPin.current
    const from = { x: pin.x, y: pin.y }
    const first = !pin.placed
    pin.placed = true
    const start = performance.now()
    cancelAnimationFrame(partyWalk.current)
    const step = now => {
      const t = first || prefersReducedMotion() ? 1 : Math.min(1, (now - start) / PARTY_WALK_MS)
      const k = sineInOut(t)
      pin.x = from.x + (partyX - from.x) * k
      pin.y = from.y + (partyY - from.y) * k
      pin.z = scene.current?.heightAt(pin.x, pin.y) ?? 0
      if (t < 1) partyWalk.current = requestAnimationFrame(step)
    }
    partyWalk.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(partyWalk.current)
  }, [partyX, partyY, status])

  // Névoa por região e trilha: a cena só redesenha a trilha quando ela muda.
  const hiddenRegions = party?.fog ? FOG_REGIONS.filter(slug => !party.revealed.includes(slug)) : []
  const hiddenKey = hiddenRegions.join(',')
  useEffect(() => {
    if (status !== 'ready') return
    scene.current?.setFog(hiddenKey ? hiddenKey.split(',') : [], master ? FOG_MASTER : FOG_PLAYER)
  }, [hiddenKey, status, master])
  useEffect(() => {
    if (status !== 'ready' || !party) return
    const key = JSON.stringify(party.trail.map(p => [p.x, p.y]))
    if (key === trailKey.current) return
    scene.current?.setTrail(party.trail, { animate: trailKey.current !== null })
    trailKey.current = key
  }, [party, status])

  const moveGroupTo = async (x, y) => {
    const region = nearestRegion(x, y)
    try {
      setParty(await moveParty(session.token, x, y, region?.name ?? null))
    } catch (err) {
      setNotice(err.message)
    }
  }
  const partyAction = async (call, done) => {
    try {
      setParty(await call())
      if (done) setNotice(done)
    } catch (err) {
      setNotice(err.message)
    }
  }

  // Mestre arrasta o marcador: segue o ponteiro e, ao soltar, salva (um clique sem arrastar só centraliza nele).
  const dragStart = e => {
    if (!master) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    partyDrag.current = { x: e.clientX, y: e.clientY, moved: false }
  }
  const dragMove = e => {
    const drag = partyDrag.current
    if (!drag) return
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) drag.moved = true
    if (!drag.moved) return
    const world = scene.current?.screenToWorld(e.clientX, e.clientY)
    if (!world) return
    const pin = partyPin.current
    pin.x = Math.max(-1024, Math.min(1024, world.x))
    pin.y = Math.max(-1024, Math.min(1024, world.y))
    pin.z = scene.current.heightAt(pin.x, pin.y)
  }
  const dragEnd = () => {
    const drag = partyDrag.current
    partyDrag.current = null
    const pin = partyPin.current
    if (drag?.moved) moveGroupTo(Math.round(pin.x), Math.round(pin.y))
    else if (party?.x != null) scene.current?.focus(party.x, party.y, POINT_ZOOM)
  }

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
      ...(pois ?? []).map(p => ({ slug: 'poi-' + p.id, x: p.x, y: p.y, level: bornPois.includes(p.id) ? 'any' : 'near' })),
      ...waypoints.map(w => ({ slug: 'wp-' + w.id, x: w.x, y: w.y, level: 'any' })),
      ...(draftPoint ? [{ slug: 'draft', x: draftPoint.x, y: draftPoint.y, level: 'any' }] : []),
    ]
      .map(p => ({ ...p, el: anchors.current[p.slug], z: heightAt(p.x, p.y), lift: 0 }))
      .filter(p => p.el)
    // O marcador do grupo é sempre o mesmo objeto: a caminhada e o arraste mudam x/y nele.
    const group = partyPin.current
    group.el = anchors.current.party
    if (partyX != null && group.el) dynamic.push(group)
    scenePins.current.length = 0
    scenePins.current.push(...staticPins.current, ...dynamic)
  }, [pois, waypoints, draftPoint?.x, draftPoint?.y, status, partyX != null, bornPois]) // eslint-disable-line react-hooks/exhaustive-deps

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
  // Para o jogador, região na névoa não acende, não abre painel e não mostra o nome.
  const foggedSlug = slug => !master && (hiddenRegions.includes(slug) || ((slug === 'piltover' || slug === 'zaun') && hiddenRegions.includes('piltover-zaun')))
  const lit = hovered && foggedSlug(hovered) ? selected : hovered ?? selected
  useEffect(() => {
    const pin = MAP_PINS.find(p => p.slug === lit)
    scene.current?.highlight(pin?.highlight ? pin.slug : null)
  }, [lit])

  const select = pin => {
    if (foggedSlug(pin.slug)) {
      setNotice('Região ainda não explorada. A névoa esconde o que há ali.')
      return
    }
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
    setPlacing(null)
    if (placing === 'party') {
      moveGroupTo(world.x, world.y)
      return
    }
    setSelected(null)
    setPanel({ type: placing === 'poi' ? 'poiForm' : 'waypoint', draft: world })
  }

  // Abre já mostrando o que a lore pediu, uma vez, quando a cena e os pontos estiverem prontos.
  useEffect(() => {
    if (!focus || focused.current === focus || status !== 'ready' || pois === null) return
    focused.current = focus
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

  const revealPoi = async (poi, toAll, recipients) => {
    const saved = await setPoiAudience(session.token, poi.id, toAll, recipients)
    setPois(list => list.map(p => (p.id === saved.id ? saved : p)))
    setNotice(toAll ? poi.name + ' foi revelado ao grupo.' : recipients.length ? poi.name + ' foi revelado a alguns.' : poi.name + ' voltou a ser segredo.')
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

  const teased = MAP_PINS.find(p => p.slug === hovered && !foggedSlug(p.slug))
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
                data-fogged={foggedSlug(pin.slug) || undefined}
                onPointerEnter={() => setHovered(pin.slug)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(pin.slug)}
                onBlur={() => setHovered(null)}
              >
                <span className="map-pin-icon">
                  <img src={normal} alt="" draggable="false" />
                  <img className="map-pin-active" src={active} alt="" draggable="false" />
                </span>
                <span className="map-pin-name">{foggedSlug(pin.slug) ? '???' : pin.name}</span>
              </button>
            )
          })}
          {MAP_LABELS.map(label => (
            <span key={label.slug} ref={el => { anchors.current[label.slug] = el }} className="map-pin map-label">{label.name}</span>
          ))}
          {(pois ?? []).map(poi => (
            <button key={poi.id} ref={el => { anchors.current['poi-' + poi.id] = el }} className={'map-pin map-poi map-poi-' + poi.kind.toLowerCase() + (bornPois.includes(poi.id) ? ' map-poi-born' : '')} type="button" onClick={() => openPoint('poi', poi)}>
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
          {party?.x != null && (
            <button
              ref={el => { anchors.current.party = el; partyPin.current.el = el }}
              className={'map-pin map-party' + (master ? ' draggable' : '')}
              type="button"
              title={master ? 'Arraste para mover o grupo' : 'O grupo está aqui'}
              onPointerDown={dragStart}
              onPointerMove={dragMove}
              onPointerUp={dragEnd}
              onPointerCancel={dragEnd}
            >
              <span className="map-party-banner" aria-hidden="true"><span /></span>
              <span className="map-pin-name">O GRUPO{party.trail.at(-1)?.label ? ' · ' + party.trail.at(-1).label : ''}</span>
            </button>
          )}
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
              ? (
                <>
                  <span className="map-count" title="Pontos que você criou e quantos o grupo inteiro já vê">Mestre: {plural((pois ?? []).length, 'ponto', 'pontos')} · Grupo: {plural((pois ?? []).filter(p => p.toAll).length, 'revelado', 'revelados')}</span>
                  <button type="button" className={'map-tool' + (placing === 'poi' ? ' on' : '')} aria-pressed={placing === 'poi'} onClick={() => setPlacing(p => (p === 'poi' ? null : 'poi'))}>+ PONTO DE INTERESSE</button>
                  <button type="button" className={'map-tool' + (placing === 'party' ? ' on' : '')} aria-pressed={placing === 'party'} onClick={() => setPlacing(p => (p === 'party' ? null : 'party'))}>
                    {party?.x != null ? 'MOVER O GRUPO' : 'POR O GRUPO NO MAPA'}
                  </button>
                  {party?.trail.length > 1 && (
                    <button type="button" className="map-tool quiet" onClick={() => window.confirm('Apagar a trilha da viagem?') && partyAction(() => clearPartyTrail(session.token), 'Trilha apagada.')}>APAGAR TRILHA</button>
                  )}
                  {party?.x != null && <button type="button" className="map-tool quiet" onClick={() => partyAction(() => hideParty(session.token), 'O grupo saiu do mapa.')}>TIRAR O GRUPO</button>}
                  <button type="button" className={'map-tool' + (party?.fog ? ' on' : '')} aria-pressed={!!party?.fog} onClick={() => partyAction(() => setMapFog(session.token, !party?.fog))}>
                    NÉVOA {party?.fog ? 'LIGADA' : 'DESLIGADA'}
                  </button>
                  {party?.fog && (
                    <button type="button" className="map-tool quiet" aria-expanded={fogOpen} onClick={() => setFogOpen(o => !o)}>
                      REGIÕES {FOG_REGIONS.length - hiddenRegions.length}/{FOG_REGIONS.length}
                    </button>
                  )}
                  {party?.fog && fogOpen && (
                    <div className="map-fog-list" role="group" aria-label="Regiões reveladas">
                      {FOG_REGIONS.map(slug => {
                        const open = party.revealed.includes(slug)
                        const name = MAP_PINS.find(p => p.slug === slug)?.name ?? slug
                        return (
                          <button key={slug} type="button" className={'map-fog-chip' + (open ? ' on' : '')} aria-pressed={open}
                            onClick={() => partyAction(() => setRegionRevealed(session.token, slug, !open), open ? name + ' voltou para a névoa.' : name + ' foi revelada!')}>
                            {open ? '◆' : '◇'} {name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              )
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
      {placing && <div className="map-tease" role="status"><strong>{placing === 'party' ? 'Clique onde o grupo está' : 'Clique no mapa para marcar'}</strong><span>Esc cancela.</span></div>}
      {notice && !placing && !teased && !chosen && <div className="map-tease" role="status"><strong>{notice}</strong></div>}
      {freshPoi && !placing && !panel && (
        <div className="map-tease map-fresh" role="status">
          <strong>Novo local revelado: {freshPoi.name}</strong>
          <span className="map-fresh-actions">
            <button type="button" className="map-tool" onClick={() => { openPoint('poi', freshPoi); setFreshPoi(null) }}>VER NO MAPA</button>
            <button type="button" className="map-tool quiet" onClick={() => setFreshPoi(null)}>Fechar</button>
          </span>
        </div>
      )}
      {teased && !placing && !chosen && !panel && (
        <div className="map-tease">
          <strong>{teased.name}</strong>
          <span>{loreOf(teased)?.subtitle ?? teased.art[0].tagline}</span>
        </div>
      )}
      <DiceRoll roll={die} onClose={closeDie} />
      {tableImage && <ImageLightbox images={tableImage.images} index={tableImage.index} title={tableImage.title} onIndex={index => setTableImage(t => ({ ...t, index }))} onClose={() => setTableImage(null)} />}
      {chosen && <RegionPanel key={chosen.slug} region={chosen} lore={loreOf(chosen)} onOpenLore={onOpenLore} onClose={() => setSelected(null)} />}
      {openPoi && (
        <PoiPanel
          key={openPoi.id}
          poi={openPoi}
          loreEntry={lore.find(entry => entry.id === openPoi.loreEntryId)}
          master={master}
          players={players}
          onOpenLore={onOpenLore}
          onEdit={() => setPanel({ type: 'poiForm', id: openPoi.id })}
          onAudience={revealPoi}
          token={session.token}
          onPoi={saved => setPois(list => list.map(p => (p.id === saved.id ? saved : p)))}
          onNotice={setNotice}
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
