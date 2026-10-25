import { useEffect, useState } from 'react'
import { formatModifier } from '../../data/rules.js'

const SPIN_MS = 750
const STAY_MS = 3600

// Só testes de d20 têm crítico; rolagem de dano não.
const outcome = r => (r.kind !== 'check' ? '' : r.d20 === 20 ? 'crit' : r.d20 === 1 ? 'fumble' : '')
const MODE_TAG = { adv: 'Vantagem', dis: 'Desvantagem' }

// Rolagem em destaque: o dado gira por números aleatórios e para no resultado.
// Teste de d20: 20 natural acende em dourado (CRÍTICO), 1 natural em vermelho (FALHA CRÍTICA).
// Dano: mostra cada dado e a soma.
export default function DiceRoll({ roll, onClose }) {
  const [face, setFace] = useState(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!roll) return
    const final = roll.kind === 'check' ? roll.d20 : roll.total
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setFace(final)
      setSettled(true)
      const close = setTimeout(onClose, STAY_MS)
      return () => clearTimeout(close)
    }
    setSettled(false)
    const max = roll.kind === 'check' ? 20 : Math.max(roll.count * roll.sides + roll.bonus, 2)
    const spin = setInterval(() => setFace(1 + Math.floor(Math.random() * max)), 55)
    const stop = setTimeout(() => {
      clearInterval(spin)
      setFace(final)
      setSettled(true)
    }, SPIN_MS)
    const close = setTimeout(onClose, SPIN_MS + STAY_MS)
    return () => { clearInterval(spin); clearTimeout(stop); clearTimeout(close) }
  }, [roll, onClose])

  if (!roll) return null
  const kind = settled ? outcome(roll) : ''

  return (
    <div className={'roll ' + kind + (settled ? ' settled' : '') + (roll.kind === 'dice' ? ' dmg' : '')} role="status" aria-live="polite" onClick={onClose}>
      <div className="roll-die">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" className="die-out" />
          <polygon points="50,22 76,66 24,66" className="die-in" />
          <path d="M50 4 50 22M92 28 76 66M8 28 24 66M50 96 24 66M50 96 76 66M8 72 24 66M92 72 76 66M8 28 50 22 92 28" className="die-edge" />
        </svg>
        <span className="die-face">{face}</span>
      </div>
      <div className="roll-text">
        <div className="roll-label">
          {roll.label}
          {MODE_TAG[roll.mode] && <span className={'roll-mode ' + roll.mode}>{MODE_TAG[roll.mode]}</span>}
        </div>
        {settled && roll.kind === 'check' && (
          <div className="roll-total">
            {roll.other != null && <span className="roll-other" title="Dado descartado">{roll.other}</span>}
            {roll.mod !== 0 && <span className="roll-math">{roll.d20} {formatModifier(roll.mod).replace(/^([+−])/, '$1 ')} =</span>}
            <b>{roll.total}</b>
          </div>
        )}
        {settled && roll.kind === 'dice' && (
          <div className="roll-total">
            <span className="roll-math">
              {roll.expr} · [{roll.rolls.join(', ')}]{roll.bonus !== 0 && ' ' + formatModifier(roll.bonus).replace(/^([+−])/, '$1 ')} =
            </span>
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
    return <p className="muted-note">Clique num atributo, perícia ou magia para rolar com o bônus.</p>
  }
  return (
    <ol className="log">
      {rolls.map(r => (
        <li key={r.id} className={outcome(r)}>
          <span className="log-label">
            {r.label}
            {r.mode === 'adv' && <abbr className="log-mode adv" title="Vantagem">V</abbr>}
            {r.mode === 'dis' && <abbr className="log-mode dis" title="Desvantagem">D</abbr>}
          </span>
          <span className="log-math">
            {r.kind === 'check' ? <>{r.d20}{r.mod !== 0 && ' ' + formatModifier(r.mod)}</> : r.expr}
          </span>
          <b className="log-total">{r.total}</b>
        </li>
      ))}
    </ol>
  )
}
