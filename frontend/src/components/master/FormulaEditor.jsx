import { useState } from 'react'
import { setFormulas } from '../../api/master.js'
import { CRAFT_NAMES, craftIdOf } from '../../data/rules.js'

// Mestre: marca as fórmulas que a ficha conhece, por ofício, até o nível do ofício (maiores: 1 + 1 a cada 4 níveis
// de personagem; menores: todas as disciplinas). Regra do livro: mod. de INT (mín. 1) fórmulas por nível de ofício.
// Cada clique salva; onSaved recebe a ficha devolvida.
export default function FormulaEditor({ token, character, catalog, onSaved, onError }) {
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(null)
  if (!catalog) return null
  const known = new Set(character.formulas ?? [])
  const crafts = (character.crafts ?? []).map(name => ({ name, id: craftIdOf(name) })).filter(k => k.id && catalog.crafts[k.id]?.length)
  if (crafts.length === 0) return <p className="muted-note">Os ofícios da ficha não têm fórmulas no livro.</p>
  const craftLevel = 1 + Math.floor((character.level - 1) / 4)
  const intMod = Math.floor((character.intel - 10) / 2)

  const toggle = key => {
    const next = known.has(key) ? [...known].filter(k => k !== key) : [...known, key]
    setBusy(true)
    setFormulas(token, character.id, next).then(onSaved).catch(onError).finally(() => setBusy(false))
  }

  return (
    <div className="formula-editor">
      {crafts.map(k => {
        const list = catalog.crafts[k.id]
        const major = list.some(f => f.level > 1)
        const allowed = list.filter(f => !major || f.level <= craftLevel)
        const mine = list.filter(f => known.has(k.id + ':' + f.id)).length
        return (
          <div key={k.id} className="formula-craft">
            <button type="button" className="link-btn" onClick={() => setOpen(o => (o === k.id ? null : k.id))} aria-expanded={open === k.id}>
              {CRAFT_NAMES[k.id]} · {mine}/{Math.max(1, intMod) * (major ? craftLevel : 1)} fórmulas {open === k.id ? '▴' : '▾'}
            </button>
            {open === k.id && (
              <div className="to-pick">
                {allowed.map(f => {
                  const key = k.id + ':' + f.id
                  return (
                    <button key={key} type="button" className={'to-chip' + (known.has(key) ? ' on' : '')} aria-pressed={known.has(key)}
                      disabled={busy} title={(f.dc ? 'CD ' + f.dc + ' · ' : '') + (f.description ?? '')} onClick={() => toggle(key)}>
                      {f.name}{f.discipline ? ' (' + f.discipline + ')' : ''} <small>{f.level}</small>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
