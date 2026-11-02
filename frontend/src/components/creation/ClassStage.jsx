import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { grantLabel, groupGrants } from '../../data/rules.js'
import { classArt } from '../../data/classArt.js'
import TabBar from '../sheet/TabBar.jsx'
import OriginArt from './OriginArt.jsx'
import SubclassPicker, { SubclassSigil } from './SubclassPicker.jsx'
import { AbilityCard, GainGroups } from './OriginStage.jsx'

const OPEN_MS = 620
const CLOSE_MS = 380
const SEAL_MS = 640
const EASE = 'cubic-bezier(.22,1,.36,1)'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Quadro do painel em coordenadas de tela, para animar entre o cartão do salão e o centro.
const frame = rect => ({ left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', right: 'auto', bottom: 'auto', margin: 0 })

// Destaque da classe (o par de OriginStage): o cartão clicado cresce até o centro da tela, com o vídeo à esquerda e, em abas,
// o que a classe concede. A escolha (classe + subclasse) só vale ao confirmar; as setas passam para as outras classes.
export default function ClassStage({ classes, startId, crafts, equipment, classId, subclassId, cardOf, onMove, onConfirm, onClose }) {
  const [currentId, setCurrentId] = useState(startId)
  const [tab, setTab] = useState('gains')
  const [subIdHere, setSubIdHere] = useState(startId === classId ? subclassId : null)
  const [sealing, setSealing] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const panel = useRef()
  const closeBtn = useRef()
  const closing = useRef(false)

  const klass = classes.find(k => k.id === currentId)
  const art = classArt(klass)
  const subclasses = klass.subclasses ?? []
  const sub = subclasses.find(s => s.id === subIdHere)
  const subLabel = klass.subclassLabel ?? 'Subclasse'
  const own = groupGrants(klass.grants)
  const fromSub = groupGrants(sub?.grants)
  const abilityCount = own.abilities.length + fromSub.abilities.length
  const levels = [...(klass.levels ?? [])].sort((a, b) => a.level - b.level)
  const tabs = [
    { id: 'gains', label: 'GANHOS' },
    ...(abilityCount ? [{ id: 'abilities', label: 'HABILIDADES' }] : []),
    ...(levels.length ? [{ id: 'levels', label: 'NÍVEIS' }] : []),
    ...(subclasses.length ? [{ id: 'subclasses', label: subLabel.toUpperCase() + 'S' }] : []),
    { id: 'about', label: 'SOBRE' },
  ]
  const same = klass.id === classId && (sub?.id ?? null) === subclassId
  const missingSub = subclasses.length > 0 && !sub

  // Entrada: o painel parte do retângulo do cartão e cresce até o lugar final. Só ao abrir: as setas mudam o startId (onMove)
  // e o cardOf muda a cada render do pai, e nenhum dos dois deve repetir a animação.
  useLayoutEffect(() => {
    const from = cardOf(startId)?.getBoundingClientRect()
    if (!from || reducedMotion()) return
    const to = panel.current.getBoundingClientRect()
    const anim = panel.current.animate([frame(from), frame(to)], { duration: OPEN_MS, easing: EASE })
    return () => anim.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true })
  }, [])

  // Saída: volta para o cartão da classe que está aberta (pode ser outra, depois das setas).
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
    const next = classes[(classes.findIndex(k => k.id === currentId) + step + classes.length) % classes.length]
    setCurrentId(next.id)
    setTab('gains')
    setSubIdHere(next.id === classId ? subclassId : null)
    onMove(next.id)
  }

  const confirm = () => {
    if (same) return close()
    if (missingSub) return setTab('subclasses')
    onConfirm(klass.id, sub?.id ?? null)
    if (reducedMotion()) return close()
    setSealing(true)
  }

  // O selo toca e o painel volta para o salão.
  useEffect(() => {
    if (!sealing) return
    const t = setTimeout(close, SEAL_MS)
    return () => clearTimeout(t)
  }, [sealing, close])

  const onKeyDown = e => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest?.('[role="radiogroup"]')) {
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
    : missingSub ? (tab === 'subclasses' ? 'ESCOLHA ' + (subLabel.toUpperCase().endsWith('A') ? 'UMA ' : 'UM ') + subLabel.toUpperCase() : 'VER ' + subLabel.toUpperCase() + 'S')
    : 'ESCOLHER ' + klass.name.toUpperCase() + (sub ? ' · ' + sub.name.toUpperCase() : '')

  return createPortal(
    <div
      className={'ostage' + (leaving ? ' leaving-stage' : '') + (sealing ? ' sealing' : '')}
      style={{ '--h': art.hue }}
      onMouseDown={e => { if (e.target === e.currentTarget) close() }}
      onKeyDown={onKeyDown}
    >
      <div className="ostage-panel" ref={panel} role="dialog" aria-modal="true" aria-label={'Classe: ' + klass.name}>
        <div className="ostage-hero" key={klass.id}>
          <OriginArt id={klass.id} art={art} large />
          <div className="ostage-shade" />
          <div className="ostage-cap">
            {sub && <div className="ostage-lineage">{subLabel} {sub.name}</div>}
            <h3 className="ostage-name">{klass.name}</h3>
            <div className="ostage-rule" />
            <p className="ostage-tag">{art.tagline}</p>
            <dl className="ostage-facts">
              <div><dt>Dado de vida</dt><dd>d{klass.hitDie}</dd></div>
              {subclasses.length > 0 && <div><dt>{subLabel}s</dt><dd>{subclasses.length} opções</dd></div>}
            </dl>
          </div>
        </div>

        <button type="button" className="ostage-arrow prev" aria-label="Classe anterior" onClick={() => move(-1)}>‹</button>
        <button type="button" className="ostage-arrow next" aria-label="Próxima classe" onClick={() => move(1)}>›</button>

        <div className="ostage-side">
          <div className="ostage-top">
            <TabBar
              tabs={tabs}
              active={tab}
              onChange={setTab}
              label={'Sobre a classe ' + klass.name}
              badges={{ abilities: abilityCount, subclasses: subclasses.length }}
              alertId={missingSub ? 'subclasses' : undefined}
            />
            <button type="button" className="ostage-close" ref={closeBtn} aria-label="Voltar para as classes" onClick={close}>×</button>
          </div>

          <div className="ostage-body" role="tabpanel" key={klass.id + tab}>
            {tab === 'gains' && (
              <>
                <GainGroups grants={klass.grants} crafts={crafts} equipment={equipment} />
                {sub && (
                  <div className="ogain-lineage">
                    <h5 className="ogain-lineage-title"><SubclassSigil klass={klass} sub={sub} className="inline" />Do {subLabel} {sub.name}</h5>
                    <GainGroups grants={sub.grants} crafts={crafts} equipment={equipment} />
                  </div>
                )}
                {missingSub && (
                  <button type="button" className="ogain-more" onClick={() => setTab('subclasses')}>
                    A subclasse concede mais. Escolha entre {subclasses.length} ›
                  </button>
                )}
              </>
            )}
            {tab === 'abilities' && (
              <div className="oabilities">
                {own.abilities.map((g, i) => <AbilityCard key={g.name + i} grant={g} n={i} />)}
                {fromSub.abilities.map((g, i) => <AbilityCard key={g.name + i} grant={g} source={sub.name} n={own.abilities.length + i} />)}
              </div>
            )}
            {tab === 'levels' && (
              <div className="option-level-list">
                <span className="option-level-title">Ao subir de nível</span>
                {levels.map(v => (
                  <span key={v.level} className="option-level">
                    <b>{v.level}º nível.</b> {(v.grants ?? []).map(g => grantLabel(g, crafts, equipment)).join(' · ')}
                  </span>
                ))}
              </div>
            )}
            {tab === 'subclasses' && (
              <SubclassPicker klass={klass} title={'Escolha: ' + subLabel} subclasses={subclasses} crafts={crafts} equipment={equipment} selected={subIdHere} onPick={setSubIdHere} />
            )}
            {tab === 'about' && (
              <div className="oabout">
                {(klass.description ?? art.tagline).split('\n').filter(Boolean).map((p, i) => (
                  <p className={i === 0 ? 'oabout-lead' : 'oabout-item'} key={i}>{p}</p>
                ))}
              </div>
            )}
          </div>

          <div className="ostage-foot">
            <button type="button" className="ghost-btn" onClick={close}>Voltar</button>
            <button type="button" className={'btn ostage-cta' + (same && !sealing ? ' kept' : '')} disabled={sealing || (missingSub && tab === 'subclasses')} onClick={confirm}>{cta}</button>
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
