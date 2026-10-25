import { useEffect, useState } from 'react'
import { formatModifier } from '../../data/rules.js'

const SPIN_MS = 750
const STAY_MS = 3600

const outcome = d20 => (d20 === 20 ? 'crit' : d20 === 1 ? 'fumble' : '')

// Rolagem em destaque: o d20 gira por números aleatórios e para no resultado.
// 20 natural acende em dourado (CRÍTICO), 1 natural em vermelho (FALHA CRÍTICA).
export default function DiceRoll({ roll, onClose }) {
  const [face, setFace] = useState(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!roll) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setFace(roll.d20)
      setSettled(true)
    } else {
      setSettled(false)
      const spin = setInterval(() => setFace(1 + Math.floor(Math.random() * 20)), 55)
      const stop = setTimeout(() => {
        clearInterval(spin)
        setFace(roll.d20)
        setSettled(true)
      }, SPIN_MS)
      const close = setTimeout(onClose, SPIN_MS + STAY_MS)
      return () => { clearInterval(spin); clearTimeout(stop); clearTimeout(close) }
    }
    const close = setTimeout(onClose, STAY_MS)
    return () => clearTimeout(close)
  }, [roll, onClose])

  if (!roll) return null
  const kind = settled ? outcome(roll.d20) : ''

  return (
    <div className={'roll ' + kind + (settled ? ' settled' : '')} role="status" aria-live="polite" onClick={onClose}>
      <div className="roll-die">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" className="die-out" />
          <polygon points="50,22 76,66 24,66" className="die-in" />
          <path d="M50 4 50 22M92 28 76 66M8 28 24 66M50 96 24 66M50 96 76 66M8 72 24 66M92 72 76 66M8 28 50 22 92 28" className="die-edge" />
        </svg>
        <span className="die-face">{face}</span>
      </div>
      <div className="roll-text">
        <div className="roll-label">{roll.label}</div>
        {settled && (
          <div className="roll-total">
            {roll.mod !== 0 && <span className="roll-math">{roll.d20} {formatModifier(roll.mod).replace(/^([+−])/, '$1 ')} =</span>}
            <b>{roll.total}</b>
          </div>
        )}
        {kind === 'crit' && <div className="roll-tag">CRÍTICO!</div>}
        {kind === 'fumble' && <div className="roll-tag">FALHA CRÍTICA</div>}
      </div>
    </div>
  )
}

// Histórico das últimas rolagens da sessão (só na tela; não vai para o servidor).
export function RollLog({ rolls }) {
  if (!rolls.length) {
    return <p className="muted-note">Clique num atributo ou perícia para rolar o d20 com o bônus.</p>
  }
  return (
    <ol className="log">
      {rolls.map(r => (
        <li key={r.id} className={outcome(r.d20)}>
          <span className="log-label">{r.label}</span>
          <span className="log-math">{r.d20}{r.mod !== 0 && ' ' + formatModifier(r.mod)}</span>
          <b className="log-total">{r.total}</b>
        </li>
      ))}
    </ol>
  )
}
