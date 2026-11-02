import { useEffect, useState } from 'react'
import { fetchCatalog, fetchTableSettings, updateTableSettings } from '../../api/master.js'

// Aba "Regras da mesa" do mestre: decide o modo de traços da Runinata (ou deixa o jogador escolher).
// O assistente de criação usa o modo travado e não deixa trocar.
export default function MasterRules({ token, onError, onToast }) {
  const [budgets, setBudgets] = useState(null)
  const [selected, setSelected] = useState(undefined)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchCatalog(token).then(c => setBudgets(c.traits?.budgets ?? [])).catch(onError)
    fetchTableSettings(token).then(s => setSelected(s.traitBudget ?? null)).catch(onError)
  }, [token, onError])

  const choose = async id => {
    if (busy || id === selected) return
    setBusy(true)
    try {
      const s = await updateTableSettings(token, { traitBudget: id })
      setSelected(s.traitBudget ?? null)
      onToast(id ? 'Modo da Runinata travado: ' + budgets.find(b => b.id === id)?.name + '.' : 'Os jogadores voltam a escolher o modo da Runinata.')
    } catch (err) {
      onError(err)
    }
    setBusy(false)
  }

  if (!budgets || selected === undefined) {
    return <section className="card"><div className="hex-spinner" /></section>
  }

  const options = [{ id: null, name: 'O jogador escolhe', description: 'Cada jogador escolhe o modo no assistente de criação, combinando com você.' }, ...budgets]
  return (
    <section className="card rules-card" style={{ '--i': 1 }}>
      <h3 className="card-title">Runinata: modo de traços</h3>
      <p className="muted-note">
        Quantos Traços Menores e Maiores a Runinata recebe. Travando um modo, o assistente de criação usa ele e o jogador não troca.
      </p>
      <div className="rules-options" role="radiogroup" aria-label="Modo de traços da Runinata">
        {options.map(o => {
          const on = o.id === selected
          return (
            <button key={o.id ?? 'free'} type="button" role="radio" aria-checked={on} disabled={busy}
              className={'rules-option' + (on ? ' on' : '')} onClick={() => choose(o.id)}>
              <span className="rules-option-name">{o.name}</span>
              {o.minor != null && <span className="rules-option-facts">{o.minor} menores · {o.major} maiores</span>}
              {o.description && <span className="rules-option-desc">{o.description}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
