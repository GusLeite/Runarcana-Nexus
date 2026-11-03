import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { grantLabel, visibleGrants } from '../../data/rules.js'
import { regionArt, wrapIndex } from '../../data/regionArt.js'
import useHallTop from './useHallTop.js'
import '../../styles/origin.css'
import '../../styles/region.css'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Um quadro do carrossel. Só o vídeo da região à mostra toca; o das vizinhas fica carregado para a troca ser imediata.
function RegionSlide({ art, active, leaving }) {
  const video = useRef()
  useEffect(() => {
    const el = video.current
    if (!el) return
    if (active && !reducedMotion()) {
      el.muted = true
      const p = el.play()
      if (p) p.catch(() => {})
    } else if (!active && !leaving) {
      el.pause()
      el.currentTime = 0
    }
  }, [active, leaving])
  return (
    <div className={'rslide' + (active ? ' on' : '') + (leaving ? ' leaving' : '')} style={{ '--pos': art.pos }}>
      {art.video
        ? <video ref={video} src={art.video} poster={art.img} muted loop playsInline preload="auto" />
        : art.img && <img className="rslide-still" src={art.img} alt="" />}
    </div>
  )
}

// Etapa Região: um salão que cobre a tela abaixo da barra do topo, com a região em tamanho grande e um carrossel
// (setas, teclado, arrastar no toque ou miniaturas) para alternar entre elas. A escolha é confirmada no botão.
export default function RegionStep({ regions, crafts, equipment, regionId, onPick, onBack, onNext }) {
  const top = useHallTop()
  const [view, setView] = useState({ index: Math.max(0, regions.findIndex(r => r.id === regionId)), leaving: null })
  const strip = useRef()
  const swipeFrom = useRef(null)
  const { index, leaving } = view
  const length = regions.length

  const goTo = next => setView(v => {
    const target = wrapIndex(next, length)
    return target === v.index ? v : { index: target, leaving: v.index }
  })

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Terminada a transição, a região que saiu para de tocar.
  useEffect(() => {
    if (leaving === null) return
    const timer = setTimeout(() => setView(v => ({ ...v, leaving: null })), 750)
    return () => clearTimeout(timer)
  }, [leaving, index])

  // Mantém a miniatura da região à mostra visível na faixa, sem mexer na rolagem da página.
  useEffect(() => {
    const box = strip.current
    const thumb = box?.children[index]
    if (thumb) box.scrollTo({ left: thumb.offsetLeft - (box.clientWidth - thumb.offsetWidth) / 2, behavior: 'smooth' })
  }, [index])

  const region = regions[index]
  const art = regionArt(region)
  const chosen = regions.find(r => r.id === regionId)
  const grants = visibleGrants(region.grants)
  // Monta só a região à mostra, as vizinhas (já carregando) e a que está saindo; o resto não baixa vídeo.
  const mounted = new Set([index, wrapIndex(index - 1, length), wrapIndex(index + 1, length), leaving])

  return createPortal(
    <div className="ohall rhall" style={{ top, '--h': art.hue }}>
      <div
        className="rstage"
        onPointerDown={e => { if (e.pointerType === 'touch') swipeFrom.current = e.clientX }}
        onPointerUp={e => {
          if (swipeFrom.current === null) return
          const moved = e.clientX - swipeFrom.current
          swipeFrom.current = null
          if (Math.abs(moved) > 50) goTo(index + (moved < 0 ? 1 : -1))
        }}
      >
        {regions.map((r, n) => mounted.has(n) && (
          <RegionSlide key={r.id} art={regionArt(r)} active={n === index} leaving={n === leaving} />
        ))}
        <span className="rstage-shade" />
        <h4 className="ohall-title">Escolha a região</h4>
        <button type="button" className="rarrow prev" aria-label="Região anterior" onClick={() => goTo(index - 1)}>‹</button>
        <button type="button" className="rarrow next" aria-label="Próxima região" onClick={() => goTo(index + 1)}>›</button>
        <div className="rcap" key={region.id} aria-live="polite">
          {art.icon && <img className="rcap-icon" src={art.icon} alt="" />}
          <span className="rcap-count">{index + 1} / {length}</span>
          <h3 className="rcap-name">{region.name}</h3>
          <span className="rcap-rule" />
          {art.tagline && <p className="rcap-tag">{art.tagline}</p>}
          {region.details?.length > 0 && (
            <p className="option-details">
              {region.details.map(d => <span key={d.name}><b>{d.name}.</b> {d.text}</span>)}
            </p>
          )}
          {grants.length > 0 && (
            <p className="grants">
              {grants.map((g, i) => (
                <span key={i} className={'grant g-' + g.type.toLowerCase()} title={g.description ?? undefined}>{grantLabel(g, crafts, equipment)}</span>
              ))}
            </p>
          )}
          <button type="button" className={'btn rcap-pick' + (region.id === regionId ? ' on' : '')} aria-pressed={region.id === regionId} onClick={() => onPick(region.id)}>
            {region.id === regionId ? '✓ REGIÃO ESCOLHIDA' : 'ESCOLHER ESTA REGIÃO'}
          </button>
        </div>
      </div>
      <div className="rstrip" ref={strip} role="group" aria-label="Regiões">
        {regions.map((r, n) => {
          const thumb = regionArt(r)
          return (
            <button key={r.id} type="button" className={'rthumb' + (n === index ? ' on' : '') + (r.id === regionId ? ' chosen' : '')}
              aria-current={n === index ? 'true' : undefined} style={{ '--h': thumb.hue, backgroundImage: thumb.img ? `url(${thumb.img})` : undefined }} onClick={() => goTo(n)}>
              {thumb.icon && <img className="rthumb-icon" src={thumb.icon} alt="" />}
              <span>{r.id === regionId && '✓ '}{r.name}</span>
            </button>
          )
        })}
      </div>
      <div className="ohall-bar">
        <button type="button" className="ghost-btn" onClick={onBack}>Voltar</button>
        <span className="ohall-status rhall-status">
          {chosen ? <>Região: <b>{chosen.name}</b></> : 'Onde o personagem cresceu. Libera as Heranças de Região.'}
        </span>
        <button type="button" className="btn next-btn" disabled={!chosen} onClick={onNext}>PRÓXIMO</button>
      </div>
    </div>,
    document.body,
  )
}
