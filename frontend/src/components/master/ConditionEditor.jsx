import { useState } from 'react'
import { setConditions } from '../../api/master.js'

// Mestre: liga/desliga as condições de uma ficha (chips com a regra na dica) e ajusta a Exaustão (0 até o máximo).
// Cada mudança salva na hora; onSaved recebe a ficha (CharacterResponse) devolvida.
export default function ConditionEditor({ token, character, catalog, onSaved, onError, compact }) {
  const [busy, setBusy] = useState(false)
  if (!catalog) return null
  const on = new Set(character.conditions ?? [])
  const exhaustion = character.exhaustion ?? 0
  const max = catalog.exhaustionMax ?? 10

  const save = (ids, level) => {
    setBusy(true)
    setConditions(token, character.id, ids, level)
      .then(onSaved)
      .catch(onError)
      .finally(() => setBusy(false))
  }
  const toggle = id => save(on.has(id) ? [...on].filter(x => x !== id) : [...on, id], null)

  return (
    <div className={'cond-editor' + (compact ? ' compact' : '')}>
      <div className="to-pick">
        {catalog.conditions.map(c => (
          <button key={c.id} type="button" className={'to-chip' + (on.has(c.id) ? ' on' : '')} aria-pressed={on.has(c.id)}
            title={c.text} disabled={busy} onClick={() => toggle(c.id)}>{c.name}</button>
        ))}
      </div>
      <div className="exh-row" title={catalog.exhaustion}>
        <span className="mlabel">Exaustão</span>
        <button type="button" className="ghost-btn small" disabled={busy || exhaustion <= 0} onClick={() => save(null, exhaustion - 1)} aria-label="Diminuir exaustão">−</button>
        <b>{exhaustion}<small>/{max}</small></b>
        <button type="button" className="ghost-btn small" disabled={busy || exhaustion >= max} onClick={() => save(null, exhaustion + 1)} aria-label="Aumentar exaustão">+</button>
      </div>
    </div>
  )
}
