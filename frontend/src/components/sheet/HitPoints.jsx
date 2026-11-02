import { useState } from 'react'
import { applyHp } from '../../data/rules.js'
import Num from './Num.jsx'

const ACTIONS = [
  { id: 'damage', label: 'Dano' },
  { id: 'heal', label: 'Cura' },
  { id: 'temp', label: 'PV temp.' },
]

// Barra de PV do herói. O jogador marca dano, cura e PV temporários: o dano gasta os temporários primeiro.
// onChange recebe { currentHp, tempHp } (a ficha salva e volta atrás se falhar).
export default function HitPoints({ currentHp, tempHp = 0, maxHp, onChange }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const hp = Math.min(currentHp, maxHp)
  const hpPct = maxHp ? (hp / maxHp) * 100 : 0
  // Os temporários aparecem depois dos atuais, até o fim da barra.
  const tempPct = maxHp ? Math.min(100 - hpPct, (tempHp / maxHp) * 100) : 0
  // Uma marca a cada 10 PV, como a barra de vida dentro do jogo.
  const tick = maxHp ? (10 / maxHp) * 100 : 100
  const valid = /^\d+$/.test(amount.trim())

  const act = action => {
    if (!valid) return
    const next = applyHp({ currentHp: hp, tempHp, maxHp }, action, amount)
    if (next.currentHp !== hp || next.tempHp !== tempHp) onChange(next)
    setAmount('')
  }

  return (
    <div className="hp" aria-label={`Pontos de vida: ${hp} de ${maxHp}` + (tempHp ? `, mais ${tempHp} temporários` : '')}>
      <div className="hp-head">
        <span>Pontos de vida</span>
        <b>
          <Num value={hp} duration={1100} /> <small>/ {maxHp}</small>
          {tempHp > 0 && <em className="hp-temp-num" title="PV temporários">+{tempHp}</em>}
        </b>
      </div>
      <div className="hp-bar" style={{ '--tick': tick + '%' }}>
        <div className={'hp-fill' + (hpPct < 35 ? ' low' : '')} style={{ width: hpPct + '%' }} />
        {tempPct > 0 && <div className="hp-temp" style={{ left: hpPct + '%', width: tempPct + '%' }} />}
      </div>
      {onChange && (
        <div className="hp-tools">
          {!open && (
            <button type="button" className="link-btn" onClick={() => setOpen(true)} aria-expanded="false">Alterar PV</button>
          )}
          {open && (
            <form className="hp-edit" onSubmit={e => { e.preventDefault(); act('damage') }}
              onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}>
              <input type="number" min={0} inputMode="numeric" autoFocus aria-label="Quantidade de PV" placeholder="0"
                value={amount} onChange={e => setAmount(e.target.value)} />
              {ACTIONS.map(a => (
                <button key={a.id} type={a.id === 'damage' ? 'submit' : 'button'} className={'hp-act ' + a.id} disabled={!valid}
                  onClick={a.id === 'damage' ? undefined : () => act(a.id)}>{a.label}</button>
              ))}
              <button type="button" className="link-btn" onClick={() => setOpen(false)}>Fechar</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
