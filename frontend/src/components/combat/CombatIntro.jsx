import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { portraitOf } from '../../data/combat.js'
import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import { play } from '../../audio/engine.js'
import { Swords } from './CombatArena.jsx'

const DURATION = 3200

// Abertura do confronto (mestre e jogadores, na hora em que ele é ativado): a tela escurece, as lâminas se cruzam,
// "COMBATE" surge com o nome do confronto e os dois lados entram, aliados de um lado e inimigos do outro, com o VS
// no meio. Some sozinha em ~3 s; clique, Esc ou Enter pulam.
export default function CombatIntro({ encounter, onDone }) {
  useEffect(() => {
    play('warhorn')
    const t = setTimeout(onDone, prefersReducedMotion() ? 1400 : DURATION)
    const key = e => { if (e.key === 'Escape' || e.key === 'Enter') onDone() }
    window.addEventListener('keydown', key)
    return () => { clearTimeout(t); window.removeEventListener('keydown', key) }
  }, [onDone])

  const allies = encounter.order.filter(c => c.kind === 'PLAYER').slice(0, 6)
  const foes = encounter.order.filter(c => c.kind === 'ENEMY').slice(0, 6)
  const extraFoes = encounter.order.filter(c => c.kind === 'ENEMY').length - foes.length

  return createPortal(
    <div className="cb-intro" role="dialog" aria-label={'Combate: ' + encounter.name} onClick={onDone}>
      <div className="cb-intro-sky" aria-hidden="true" />
      <div className="cb-intro-slash" aria-hidden="true" />
      <div className="cb-intro-core">
        <span className="cb-intro-blades" aria-hidden="true"><Swords /></span>
        <h1 className="cb-intro-word">COMBATE</h1>
        <p className="cb-intro-name">{encounter.name}</p>
      </div>
      <div className="cb-intro-lines">
        <ul className="cb-intro-side ally">
          {allies.map((c, i) => <Face key={c.id} c={c} i={i} />)}
        </ul>
        <span className="cb-intro-vs">VS</span>
        <ul className="cb-intro-side foe">
          {foes.map((c, i) => <Face key={c.id} c={c} i={i} />)}
          {extraFoes > 0 && <li className="cb-intro-more" style={{ '--i': foes.length }}>+{extraFoes}</li>}
        </ul>
      </div>
      <p className="cb-intro-skip">clique para continuar</p>
    </div>,
    document.body,
  )
}

function Face({ c, i }) {
  const art = portraitOf(c)
  return (
    <li style={{ '--i': i }} title={c.name}>
      <span style={{ backgroundImage: art.bg, backgroundPosition: art.pos }} />
      <small>{c.name}</small>
    </li>
  )
}
