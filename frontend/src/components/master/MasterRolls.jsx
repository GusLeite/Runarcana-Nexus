import { useCallback, useState } from 'react'
import { parseDice } from '../../data/rules.js'
import { serverRoll } from '../../api/rolls.js'
import useTableRolls from '../../hooks/useTableRolls.js'
import DiceRoll, { Dice3dToggle, RollLog } from '../sheet/DiceRoll.jsx'

const QUICK = ['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '1d100']

// Aba Mesa: histórico de rolagens de todos (as secretas dos jogadores aparecem inteiras para o mestre)
// e a rolagem do mestre, atrás do escudo por padrão (os jogadores só veem "Mestre rolou em segredo").
export default function MasterRolls({ token, onError }) {
  const [rolls, addRoll, incoming, clearIncoming] = useTableRolls(token, 20)
  const [current, setCurrent] = useState(null)
  const [expr, setExpr] = useState('1d20')
  const [label, setLabel] = useState('')
  const [secret, setSecret] = useState(true)
  const [busy, setBusy] = useState(false)

  const send = useCallback(dice => {
    const clean = dice.trim().replace(/^d/i, '1d')
    if (!parseDice(clean)) return onError(new Error('Use dados como 2d6+3.'))
    setBusy(true)
    serverRoll(token, { label: label.trim() || 'Rolagem do mestre', kind: 'DICE', expr: clean, secret })
      .then(entry => { setCurrent(entry); addRoll(entry) })
      .catch(onError)
      .finally(() => setBusy(false))
  }, [token, label, secret, addRoll, onError])

  const closeRoll = useCallback(() => setCurrent(null), [])

  return (
    <section className="card master-rolls">
      <div className="card-title"><h3>Rolagens da mesa</h3><Dice3dToggle /></div>
      <form className="master-roll-form" onSubmit={e => { e.preventDefault(); send(expr) }}>
        <input value={label} maxLength={120} onChange={e => setLabel(e.target.value)} placeholder="O que é (ex.: Emboscada)" aria-label="O que está sendo rolado" />
        <input className="master-roll-expr" value={expr} maxLength={20} onChange={e => setExpr(e.target.value)} aria-label="Dados" />
        <button type="submit" className="btn" disabled={busy}>ROLAR</button>
      </form>
      <div className="master-roll-tools">
        <div className="seg" role="group" aria-label="Dados rápidos">
          {QUICK.map(q => <button key={q} type="button" disabled={busy} onClick={() => send(q)}>{q.slice(1)}</button>)}
        </div>
        <div className="seg" role="group" aria-label="Quem vê a rolagem do mestre">
          <button type="button" className={secret ? 'on' : ''} aria-pressed={secret} onClick={() => setSecret(true)}>Atrás do escudo</button>
          <button type="button" className={!secret ? 'on' : ''} aria-pressed={!secret} onClick={() => setSecret(false)}>À mesa</button>
        </div>
      </div>
      <RollLog rolls={rolls} empty="Nenhuma rolagem ainda." />
      <DiceRoll roll={current} onClose={closeRoll} />
      <DiceRoll key={incoming?.id} roll={incoming} onClose={clearIncoming} compact />
    </section>
  )
}
