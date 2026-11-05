import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatModifier } from '../../data/rules.js'
import { play } from '../../audio/engine.js'
import { CHARACTERS } from '../../data/characters.js'
import Dice3D from '../dice3d/Dice3D.jsx'
import { diceForRoll } from '../dice3d/diceSpec.js'
import { useDice3d } from '../dice3d/dice3dPref.js'

const SPIN_MS = 750
const STAY_MS = 3600
const SHAKE_MS = 450

// Só testes de d20 têm crítico; rolagem de dano não. critRange: ataques com margem maior (19 = 19–20).
const outcome = r => (r.hidden || r.kind !== 'check' ? '' : r.d20 >= (r.critRange ?? 20) ? 'crit' : r.d20 === 1 ? 'fumble' : '')
const MODE_TAG = { adv: 'Vantagem', dis: 'Desvantagem' }

// Tremida curta da tela no crítico e na falha crítica (só com os dados 3D; com "reduzir movimento" eles nem ligam).
function shake() {
  document.body.classList.remove('dice-shake')
  void document.body.offsetWidth
  document.body.classList.add('dice-shake')
  setTimeout(() => document.body.classList.remove('dice-shake'), SHAKE_MS)
}

// Rolagem em destaque. Com os dados 3D ligados (dice3d/) e um dado que tem forma 3D, os dados caem na tela com
// física e param no valor do servidor; senão, o dado 2D gira por números aleatórios e para no resultado.
// Teste de d20: 20 natural acende em dourado (CRÍTICO), 1 natural em vermelho (FALHA CRÍTICA). Dano: cada dado e a soma.
// compact: rolagem de outra pessoa da mesa, menor e no canto, com o nome de quem rolou.
export default function DiceRoll({ roll, onClose, compact = false }) {
  const [face, setFace] = useState(null)
  const [settled, setSettled] = useState(false)
  const [on] = useDice3d()
  const [failed, setFailed] = useState(null) // rolagem cuja cena 3D falhou: volta ao 2D
  const spec = useMemo(() => (on && roll && failed !== roll ? diceForRoll(roll) : null), [on, roll, failed])
  const use3d = spec != null

  // Dado 2D: gira e para depois de SPIN_MS.
  useEffect(() => {
    if (!roll || use3d) return undefined
    const final = roll.hidden ? '?' : roll.kind === 'check' ? roll.d20 : roll.total
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const landing = () => play(outcome(roll) === 'crit' ? 'crit' : outcome(roll) === 'fumble' ? 'fumble' : 'settle')
    if (reduced) {
      setFace(final)
      setSettled(true)
      landing()
      const close = setTimeout(onClose, STAY_MS)
      return () => clearTimeout(close)
    }
    setSettled(false)
    play('rattle')
    const max = roll.hidden || roll.kind === 'check' ? 20 : Math.max(roll.count * roll.sides + roll.bonus, 2)
    const spin = setInterval(() => setFace(1 + Math.floor(Math.random() * max)), 55)
    const stop = setTimeout(() => {
      clearInterval(spin)
      setFace(final)
      setSettled(true)
      landing()
    }, SPIN_MS)
    const close = setTimeout(onClose, SPIN_MS + STAY_MS)
    return () => { clearInterval(spin); clearTimeout(stop); clearTimeout(close) }
  }, [roll, onClose, use3d])

  // Dados 3D: o resultado aparece quando a física para (onLanded); fecha STAY_MS depois.
  useEffect(() => {
    if (!roll || !use3d) return undefined
    setSettled(false)
    return undefined
  }, [roll, use3d])
  useEffect(() => {
    if (!use3d || !settled) return undefined
    const close = setTimeout(onClose, STAY_MS)
    return () => clearTimeout(close)
  }, [use3d, settled, onClose])
  const onLanded = useCallback(() => {
    setSettled(true)
    const kind = outcome(roll)
    play(kind === 'crit' ? 'crit' : kind === 'fumble' ? 'fumble' : 'settle')
    if (kind && !compact) shake()
  }, [roll, compact])
  const onFail = useCallback(() => setFailed(roll), [roll])

  if (!roll) return null
  const kind = settled ? outcome(roll) : ''
  const who = !roll.mine && roll.who ? roll.who : null

  // Portal no body: dentro de um card com transform/backdrop-filter, o position: fixed ficaria preso ao card.
  return createPortal(
    <>
      {use3d && <Dice3D spec={spec} compact={compact} onSettled={onLanded} onFail={onFail} />}
      <div className={'roll ' + kind + (settled ? ' settled' : '') + (roll.kind === 'dice' ? ' dmg' : '') + (use3d ? ' roll3d' : '') + (compact ? ' compact' : '')}
        role="status" aria-live="polite" onClick={onClose}>
        {!use3d && (
          <div className="roll-die">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" className="die-out" />
              <polygon points="50,22 76,66 24,66" className="die-in" />
              <path d="M50 4 50 22M92 28 76 66M8 28 24 66M50 96 24 66M50 96 76 66M8 72 24 66M92 72 76 66M8 28 50 22 92 28" className="die-edge" />
            </svg>
            <span className="die-face">{face}</span>
          </div>
        )}
        <div className="roll-text">
          <div className="roll-label">
            {roll.hidden ? who + ' rolou em segredo' : (who ? who + ' · ' : '') + roll.label}
            {!roll.hidden && MODE_TAG[roll.mode] && <span className={'roll-mode ' + roll.mode}>{MODE_TAG[roll.mode]}</span>}
          </div>
          {!settled && use3d && <div className="roll-wait">rolando…</div>}
          {settled && !roll.hidden && roll.kind === 'check' && (
            <div className="roll-total">
              {roll.other != null && <span className="roll-other" title="Dado descartado">{roll.other}</span>}
              {roll.mod !== 0 && <span className="roll-math">{roll.d20} {formatModifier(roll.mod).replace(/^([+−])/, '$1 ')} =</span>}
              <b>{roll.total}</b>
            </div>
          )}
          {settled && !roll.hidden && roll.kind === 'dice' && (
            <div className="roll-total">
              <span className="roll-math">
                {roll.expr} · [{roll.rolls.join(', ')}]{roll.bonus !== 0 && ' ' + formatModifier(roll.bonus).replace(/^([+−])/, '$1 ')} =
              </span>
              <b>{roll.total}</b>
            </div>
          )}
          {kind === 'crit' && <div className="roll-tag">CRÍTICO!</div>}
          {kind === 'crit' && !use3d && <Sparks />}
          {kind === 'fumble' && <div className="roll-tag">FALHA CRÍTICA</div>}
        </div>
      </div>
    </>,
    document.body,
  )
}

// Liga/desliga dos dados 3D (some onde não há WebGL ou com "reduzir movimento").
export function Dice3dToggle() {
  const [on, set, ok] = useDice3d()
  if (!ok) return null
  return (
    <button type="button" className={'dice3d-toggle' + (on ? ' on' : '')} aria-pressed={on} onClick={() => set(!on)}
      title={on ? 'Dados 3D ligados: clique para usar o dado simples' : 'Dados 3D desligados: clique para ligar'}>
      3D
    </button>
  )
}

// Faíscas douradas saindo do dado no 20 natural (cada uma num ângulo, --a).
const SPARKS = Array.from({ length: 14 }, (_, i) => ({ '--a': (i * 360) / 14 + 'deg', '--d': 40 + (i % 3) * 22 + 'px' }))
function Sparks() {
  return (
    <span className="sparks" aria-hidden="true">
      {SPARKS.map((style, i) => <span key={i} style={style} />)}
    </span>
  )
}

// Retrato de quem rolou: a arte do personagem da mesa, ou a inicial (o mestre ganha um "M" dourado).
function Who({ roll }) {
  const art = CHARACTERS.find(c => c.id === roll.username)?.img
  const master = roll.who === 'Mestre'
  return (
    <span className={'log-who' + (master ? ' master' : '')} title={roll.who}>
      {art && !master ? <img src={art} alt="" /> : (roll.who ?? '?').slice(0, 1).toUpperCase()}
    </span>
  )
}

// Histórico de rolagens da mesa (vem do servidor; ver hooks/useTableRolls.js). A secreta de outro mostra só quem rolou;
// a sua secreta leva um cadeado; a sorteada sem servidor, "não registrada".
export function RollLog({ rolls, empty = 'Clique num atributo, perícia ou magia para rolar com o bônus.' }) {
  if (!rolls.length) {
    return <p className="muted-note">{empty}</p>
  }
  return (
    <ol className="log">
      {rolls.map((r, n) => (r.hidden ? (
        <li key={r.id} className="hidden-roll" style={{ '--n': n }}>
          <Who roll={r} />
          <span className="log-label">{r.who} rolou em segredo</span>
          <span className="log-math" />
          <b className="log-total">?</b>
        </li>
      ) : (
        <li key={r.id} className={outcome(r)} style={{ '--n': n }}>
          <Who roll={r} />
          <span className="log-label">
            {!r.mine && <span className="log-name">{r.who}: </span>}
            {r.label}
            {r.secret && <abbr className="log-mode secret" title="Secreta: só quem rolou e o mestre veem">S</abbr>}
            {r.unregistered && <abbr className="log-mode local" title="Sem servidor: rolada só nesta tela, fora do histórico da mesa">!</abbr>}
            {r.mode === 'adv' && <abbr className="log-mode adv" title="Vantagem">V</abbr>}
            {r.mode === 'dis' && <abbr className="log-mode dis" title="Desvantagem">D</abbr>}
          </span>
          <span className="log-math">
            {r.kind === 'check' ? <>{r.d20}{r.mod !== 0 && ' ' + formatModifier(r.mod)}</> : r.expr}
          </span>
          <b className="log-total">{r.total}</b>
        </li>
      )))}
    </ol>
  )
}
