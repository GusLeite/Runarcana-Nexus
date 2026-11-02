import { useEffect, useRef, useState } from 'react'
import Num from './Num.jsx'
import { CoinIcon } from './icons.jsx'

// Ouro no topo da ficha. Clicar abre "Gastar": o jogador só gasta (o mestre é quem dá ouro).
// onSpend(amount) devolve uma promessa; se o back recusar, o campo continua aberto com o valor.
export default function Purse({ gold, onSpend }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const box = useRef(null)
  const n = Number(amount)
  const valid = /^\d+$/.test(amount.trim()) && n >= 1 && n <= gold

  // Clicar fora fecha.
  useEffect(() => {
    if (!open) return
    const close = e => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const spend = e => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    onSpend(n)
      .then(() => { setAmount(''); setOpen(false) })
      .catch(() => {})
      .finally(() => setBusy(false))
  }

  return (
    <div className="purse-wrap" ref={box}>
      <button type="button" className="purse" title="Ouro: clique para gastar" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <CoinIcon />
        <b><Num value={gold} duration={1000} /></b>
      </button>
      {open && (
        <form className="purse-pop" onSubmit={spend} onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}>
          <label htmlFor="purse-amount">Gastar ouro</label>
          <div className="purse-row">
            <input id="purse-amount" type="number" min={1} max={gold} inputMode="numeric" autoFocus placeholder="0"
              value={amount} onChange={e => setAmount(e.target.value)} />
            <button type="submit" className="hp-act" disabled={!valid || busy}>Gastar</button>
          </div>
          <small>Você tem {gold} PO. Só o mestre dá ouro.</small>
        </form>
      )}
    </div>
  )
}
