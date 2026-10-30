import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ABILITY_TYPES, RECHARGES, formatFeet, grantLabel, groupGrants } from '../../data/rules.js'
import { originArt } from '../../data/originArt.js'
import { lineageContain, lineageImage, lineagePos } from '../../data/lineageArt.js'
import TabBar from '../sheet/TabBar.jsx'
import OriginArt, { OriginSigil } from './OriginArt.jsx'

const OPEN_MS = 620
const CLOSE_MS = 380
const SEAL_MS = 640
const EASE = 'cubic-bezier(.22,1,.36,1)'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Quadro do painel em coordenadas de tela, para animar entre o cartão da galeria e o centro.
const frame = rect => ({ left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', right: 'auto', bottom: 'auto', margin: 0 })

function GrantList({ grants, crafts, equipment }) {
  return (
    <span className="grants">
      {grants.map((g, i) => (
        <span key={i} className={'grant g-' + g.type.toLowerCase()} title={g.description ?? undefined}>{grantLabel(g, crafts, equipment)}</span>
      ))}
    </span>
  )
}

// Grupos de ganhos ("Atributos", "Corpo"...) de uma lista de concessões.
function GainGroups({ grants, crafts, equipment }) {
  return groupGrants(grants).groups.map((group, i) => (
    <section className="ogain" key={group.id} style={{ '--n': i }}>
      <h5 className="ogain-title">{group.title}</h5>
      <GrantList grants={group.grants} crafts={crafts} equipment={equipment} />
    </section>
  ))
}

function AbilityCard({ grant: g, source, n }) {
  const meta = [
    g.castingTime, g.range, g.duration, typeof g.damage === 'string' ? g.damage : null,
    g.recharge ? 'Recupera: ' + (RECHARGES[g.recharge] ?? g.recharge) : null,
  ].filter(Boolean)
  const options = (g.options ?? []).filter(o => typeof o === 'string')
  const kind = g.type === 'FORM' ? 'Forma' : ABILITY_TYPES[g.abilityType ?? 'PASSIVE']?.name ?? 'Passiva'
  return (
    <article className="oability" style={{ '--n': n }}>
      <div className="oability-head">
        <h5>{g.name}</h5>
        <span className="her-cat">{kind}</span>
        {source && <span className="oability-source">{source}</span>}
      </div>
      {meta.length > 0 && <div className="option-facts">{meta.map(m => <span className="fact-chip" key={m}>{m}</span>)}</div>}
      {g.description && <p className="oability-desc">{g.description}</p>}
      {options.length > 0 && <p className="oability-options"><b>À escolha:</b> {options.join(', ')}</p>}
    </article>
  )
}

// Cartão de uma linhagem: faixa de ilustração (imagem de data/lineageArt.js, ou o símbolo da origem enquanto não há) e,
// embaixo, o texto e os ganhos.
function LineageCard({ lineage: l, originId, hue, on, onPick, crafts, equipment, n }) {
  const levels = [...(l.levels ?? [])].sort((a, b) => a.level - b.level)
  const img = lineageImage(l.id)
  return (
    <button type="button" role="radio" aria-checked={on} className={'option olineage' + (on ? ' on' : '')} style={{ '--n': n, '--h': hue }} onClick={onPick}>
      <span className="olineage-art">
        {img
          ? <>
              {lineageContain(l.id) && <img className="olineage-bg" src={img} alt="" aria-hidden="true" loading="lazy" />}
              <img src={img} alt="" loading="lazy" style={{ objectPosition: lineagePos(l.id), objectFit: lineageContain(l.id) ? 'contain' : undefined }} />
            </>
          : <><OriginSigil id={originId} /><span className="olineage-placeholder">Arte provisória</span></>}
        <span className="olineage-name">{l.name}</span>
        {on && <span className="olineage-check">✓</span>}
      </span>
      {l.description && <span className="option-desc">{l.description}</span>}
      {l.grants?.length > 0 && <GrantList grants={l.grants} crafts={crafts} equipment={equipment} />}
      {levels.length > 0 && (
        <span className="option-level-list">
          <span className="option-level-title">Ao subir de nível</span>
          {levels.map(v => (
            <span key={v.level} className="option-level">
              <b>{v.level}º nível.</b> {(v.grants ?? []).map(g => grantLabel(g, crafts, equipment)).join(' · ')}
            </span>
          ))}
        </span>
      )}
    </button>
  )
}

// Destaque da origem: o cartão clicado cresce até o centro da tela, com a arte à esquerda e, em abas,
// o que o personagem ganha. A escolha só vale ao confirmar; as setas passam para as outras origens.
export default function OriginStage({ origins, startId, crafts, equipment, originId, lineageId, cardOf, onMove, onConfirm, onClose }) {
  const [currentId, setCurrentId] = useState(startId)
  const [tab, setTab] = useState('gains')
  const [lineageIdHere, setLineageIdHere] = useState(startId === originId ? lineageId : null)
  const [sealing, setSealing] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const panel = useRef()
  const closeBtn = useRef()
  const closing = useRef(false)

  const origin = origins.find(o => o.id === currentId)
  const art = originArt(origin)
  const lineages = origin.lineages ?? []
  const lineage = lineages.find(l => l.id === lineageIdHere)
  const own = groupGrants(origin.grants)
  const fromLineage = groupGrants(lineage?.grants)
  const abilityCount = own.abilities.length + fromLineage.abilities.length
  const tabs = [
    { id: 'gains', label: 'GANHOS' },
    ...(abilityCount ? [{ id: 'abilities', label: 'HABILIDADES' }] : []),
    ...(lineages.length ? [{ id: 'lineages', label: 'LINHAGENS' }] : []),
    { id: 'about', label: 'SOBRE' },
  ]
  const size = origin.grants?.find(g => g.type === 'SIZE' || g.type === 'SIZE_CHOICE')
  const heritage = (origin.grants ?? []).filter(g => g.type === 'HERITAGE_POINTS').reduce((sum, g) => sum + (g.amount ?? 0), 0)
  const same = origin.id === originId && (lineage?.id ?? null) === lineageId
  const missingLineage = lineages.length > 0 && !lineage

  // Entrada: o painel parte do retângulo do cartão e cresce até o lugar final.
  useLayoutEffect(() => {
    const from = cardOf(startId)?.getBoundingClientRect()
    if (!from || reducedMotion()) return
    const to = panel.current.getBoundingClientRect()
    const anim = panel.current.animate([frame(from), frame(to)], { duration: OPEN_MS, easing: EASE })
    return () => anim.cancel()
  }, [cardOf, startId])

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true })
  }, [])

  // Saída: volta para o cartão da origem que está aberta (pode ser outra, depois das setas).
  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setLeaving(true)
    const card = cardOf(currentId)
    if (!card || reducedMotion()) {
      onClose(currentId)
      return
    }
    card.scrollIntoView({ block: 'nearest' })
    const anim = panel.current.animate([frame(panel.current.getBoundingClientRect()), frame(card.getBoundingClientRect())], { duration: CLOSE_MS, easing: 'cubic-bezier(.55,0,.8,.4)', fill: 'forwards' })
    // Em aba escondida a animação não avança: o prazo garante que o destaque feche do mesmo jeito.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onClose(currentId)
    }
    anim.onfinish = finish
    anim.oncancel = finish
    setTimeout(finish, CLOSE_MS + 200)
  }, [cardOf, currentId, onClose])

  const move = step => {
    if (sealing || closing.current) return
    const next = origins[(origins.findIndex(o => o.id === currentId) + step + origins.length) % origins.length]
    setCurrentId(next.id)
    setTab('gains')
    setLineageIdHere(next.id === originId ? lineageId : null)
    onMove(next.id)
  }

  const confirm = () => {
    if (same) return close()
    if (missingLineage) return setTab('lineages')
    onConfirm(origin.id, lineage?.id ?? null)
    if (reducedMotion()) return close()
    setSealing(true)
  }

  // O selo toca e o painel volta para a galeria.
  useEffect(() => {
    if (!sealing) return
    const t = setTimeout(close, SEAL_MS)
    return () => clearTimeout(t)
  }, [sealing, close])

  const onKeyDown = e => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      move(e.key === 'ArrowLeft' ? -1 : 1)
    } else if (e.key === 'Tab') {
      // Mantém o foco dentro do destaque.
      const items = panel.current.querySelectorAll('button:not(:disabled)')
      const first = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const cta = sealing ? 'ESCOLHIDA ✓'
    : same ? 'MANTER ESCOLHA'
    : missingLineage ? (tab === 'lineages' ? 'ESCOLHA UMA LINHAGEM' : 'VER LINHAGENS')
    : 'ESCOLHER ' + origin.name.toUpperCase() + (lineage ? ' · ' + lineage.name.toUpperCase() : '')

  return createPortal(
    <div
      className={'ostage' + (leaving ? ' leaving-stage' : '') + (sealing ? ' sealing' : '')}
      style={{ '--h': art.hue }}
      onMouseDown={e => { if (e.target === e.currentTarget) close() }}
      onKeyDown={onKeyDown}
    >
      <div className="ostage-panel" ref={panel} role="dialog" aria-modal="true" aria-label={'Origem: ' + origin.name}>
        <div className="ostage-hero" key={origin.id}>
          <OriginArt id={origin.id} art={art} large />
          <div className="ostage-shade" />
          {!(art.img || art.video || art.living) &&<span className="ostage-placeholder">Arte provisória</span>}
          <div className="ostage-cap">
            {lineage && <div className="ostage-lineage">Linhagem {lineage.name}</div>}
            <h3 className="ostage-name">{origin.name}</h3>
            <div className="ostage-rule" />
            <p className="ostage-tag">{art.tagline}</p>
            <dl className="ostage-facts">
              {origin.speed != null && <div><dt>Deslocamento</dt><dd>{formatFeet(origin.speed)}</dd></div>}
              {size && <div><dt>Tamanho</dt><dd>{grantLabel(size, crafts).replace('Tamanho: ', '')}</dd></div>}
              {heritage > 0 && <div><dt>Heranças</dt><dd>{heritage} pontos</dd></div>}
            </dl>
          </div>
        </div>

        <button type="button" className="ostage-arrow prev" aria-label="Origem anterior" onClick={() => move(-1)}>‹</button>
        <button type="button" className="ostage-arrow next" aria-label="Próxima origem" onClick={() => move(1)}>›</button>

        <div className="ostage-side">
          <div className="ostage-top">
            <TabBar
              tabs={tabs}
              active={tab}
              onChange={setTab}
              label={'Sobre a origem ' + origin.name}
              badges={{ abilities: abilityCount, lineages: lineages.length }}
              alertId={missingLineage ? 'lineages' : undefined}
            />
            <button type="button" className="ostage-close" ref={closeBtn} aria-label="Voltar para as origens" onClick={close}>×</button>
          </div>

          <div className="ostage-body" role="tabpanel" key={origin.id + tab}>
            {tab === 'gains' && (
              <>
                <GainGroups grants={origin.grants} crafts={crafts} equipment={equipment} />
                {lineage && (
                  <div className="ogain-lineage">
                    <h5 className="ogain-lineage-title">Da linhagem {lineage.name}</h5>
                    <GainGroups grants={lineage.grants} crafts={crafts} equipment={equipment} />
                  </div>
                )}
                {origin.usesTraits && <p className="ogain-note">O restante vem dos <b>Traços</b>, montados na próxima etapa com o mestre.</p>}
                {missingLineage && (
                  <button type="button" className="ogain-more" onClick={() => setTab('lineages')}>
                    A linhagem concede mais. Escolha uma entre {lineages.length} ›
                  </button>
                )}
              </>
            )}
            {tab === 'abilities' && (
              <div className="oabilities">
                {own.abilities.map((g, i) => <AbilityCard key={g.name + i} grant={g} n={i} />)}
                {fromLineage.abilities.map((g, i) => <AbilityCard key={g.name + i} grant={g} source={lineage.name} n={own.abilities.length + i} />)}
              </div>
            )}
            {tab === 'lineages' && (
              <div className="olineages" role="radiogroup" aria-label={'Linhagens de ' + origin.name}>
                {lineages.map((l, i) => (
                  <LineageCard key={l.id} lineage={l} originId={origin.id} hue={art.hue} on={l.id === lineageIdHere} n={i} crafts={crafts} equipment={equipment} onPick={() => setLineageIdHere(l.id)} />
                ))}
              </div>
            )}
            {tab === 'about' && (
              <div className="oabout">
                <p className="oabout-lead">{origin.description ?? art.tagline}</p>
                {(origin.details ?? []).map((d, i) => (
                  <div className="oabout-item" key={d.name} style={{ '--n': i }}>
                    <b>{d.name}</b>
                    <span>{d.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ostage-foot">
            <button type="button" className="ghost-btn" onClick={close}>Voltar</button>
            <button type="button" className={'btn ostage-cta' + (same && !sealing ? ' kept' : '')} disabled={sealing || (missingLineage && tab === 'lineages')} onClick={confirm}>{cta}</button>
          </div>
        </div>

        {sealing && (
          <div className="ostage-seal" aria-hidden="true">
            <span className="ostage-flash" />
            <span className="ostage-burst" />
            <span className="ostage-burst b2" />
            <span className="ostage-stamp">✓</span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
