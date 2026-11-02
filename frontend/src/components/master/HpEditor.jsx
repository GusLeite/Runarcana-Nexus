import { useState } from 'react'
import { setHpFor, setMaxHpBonus } from '../../api/master.js'

// Mestre: dano e cura em qualquer ficha (o dano gasta os PV temporários primeiro, como na ficha do jogador)
// e PV temporários. Cada ação salva na hora; onSaved recebe a ficha devolvida.
export default function HpEditor({ token, character, onSaved, onError, compact }) {
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const { currentHp, maxHp } = character
  const temp = character.tempHp ?? 0
  const n = Math.max(0, Math.floor(Number(amount) || 0))

  const save = (hp, tempHp) => {
    setBusy(true)
    setHpFor(token, character.id, hp, tempHp)
      .then(c => { onSaved(c); setAmount('') })
      .catch(onError)
      .finally(() => setBusy(false))
  }
  const damage = () => {
    const fromTemp = Math.min(temp, n)
    save(Math.max(0, currentHp - (n - fromTemp)), temp - fromTemp)
  }
  const pct = maxHp ? Math.round((currentHp / maxHp) * 100) : 0
  const bonus = character.maxHpBonus ?? 0
  // Bônus nos PV máximos (item, maldição): soma ao que já tem.
  const changeMax = delta => {
    setBusy(true)
    setMaxHpBonus(token, character.id, bonus + delta)
      .then(c => { onSaved(c); setAmount('') })
      .catch(onError)
      .finally(() => setBusy(false))
  }

  return (
    <div className={'hp-editor' + (compact ? ' compact' : '')}>
      <div className="hp-line">
        <span className="hp-bar"><span style={{ width: pct + '%' }} className={pct < 35 ? 'low' : ''} /></span>
        <b>{currentHp}<small>/{maxHp}{temp > 0 && ' +' + temp}</small></b>
      </div>
      <div className="hp-actions">
        <input type="number" min="0" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} aria-label="Quantidade de PV"
          onKeyDown={e => { if (e.key === 'Enter' && n > 0) { e.preventDefault(); damage() } }} placeholder="PV" />
        <button type="button" className="ghost-btn small" disabled={busy || n === 0} onClick={damage}>Dano</button>
        <button type="button" className="ghost-btn small" disabled={busy || n === 0} onClick={() => save(Math.min(maxHp, currentHp + n), temp)}>Cura</button>
        <button type="button" className="ghost-btn small" disabled={busy || amount === ''} onClick={() => save(currentHp, n)}>PV temp.</button>
        {!compact && (
          <>
            <button type="button" className="ghost-btn small" disabled={busy || n === 0} onClick={() => changeMax(n)} title="Soma ao bônus de PV máximos">PV máx. +</button>
            <button type="button" className="ghost-btn small" disabled={busy || n === 0} onClick={() => changeMax(-n)} title="Tira do bônus de PV máximos">PV máx. −</button>
          </>
        )}
      </div>
      {bonus !== 0 && <small className="hp-bonus">Bônus do mestre nos PV máximos: {bonus > 0 ? '+' + bonus : bonus}</small>}
    </div>
  )
}
