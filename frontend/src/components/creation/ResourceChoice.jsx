import { useState } from 'react'
import { resourceCost, togglePick } from '../../data/rules.js'

// Escolha de recurso de classe (Sutra, Ira, Técnica, Vel, Invocação, Grande Espírito, Aspecto Feral):
// cartões com o pré-requisito e o texto. As opções vêm da prévia, já filtradas pelos pré-requisitos.
// Vel é opcional e conta pontos (◆) em vez de quantidade.
export default function ResourceChoice({ choice, current, resources, onChange, n }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)
  const byId = id => resources.find(r => r.id === id)
  const vel = choice.options.concat(current).some(id => byId(id)?.kind === 'VEL') || /^Vel/.test(choice.label)
  const used = vel ? current.reduce((sum, id) => sum + resourceCost(byId(id)), 0) : current.length
  // Escolhidos que a prévia não aceita mais (pré-requisito): aparecem para poder tirar.
  const stale = current.filter(id => !choice.options.includes(id))
  const q = query.trim().toLowerCase()
  const shown = [...stale, ...choice.options]
    .map(byId).filter(Boolean)
    .filter(r => !q || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q))
  const fits = r => !vel || current.includes(r.id) || used + resourceCost(r) <= choice.count
  const pick = id => onChange(togglePick(current, id, vel ? Infinity : choice.count))

  return (
    <div className="choice" style={{ '--n': n }}>
      <div className="choice-head">
        <span className="choice-label">{choice.label}</span>
        <span className={'choice-count' + ((vel ? used <= choice.count : used === choice.count) ? ' ok' : '')}>
          {vel ? `${used}/${choice.count} ◆` : `${used}/${choice.count}`}
        </span>
      </div>
      <div className="choice-source">{choice.source}</div>
      {choice.note && <p className="muted-note">{choice.note}</p>}
      {choice.options.length > 6 && (
        <input className="her-search res-search" type="search" placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)}
          aria-label={'Buscar em ' + choice.label} />
      )}
      {shown.length > 0 && (
        <div className="her-list res-list">
          {shown.map(r => {
            const on = current.includes(r.id)
            const blocked = stale.includes(r.id)
            const expanded = open === r.id
            return (
              <article key={r.id} className={'her' + (on ? ' on' : '') + (blocked ? ' locked' : '')}>
                <div className="her-head">
                  <span className="her-name">{r.name}</span>
                  {r.cost != null && <span className="her-cat res-cost" title={r.cost + ' ponto(s) de Vel'}>{'◆'.repeat(r.cost)}</span>}
                </div>
                {r.prerequisite && <div className="her-pre"><b>Pré-requisito:</b> {r.prerequisite}</div>}
                {(r.execution || r.components) && (
                  <div className="her-pre">
                    {r.execution && <><b>Execução:</b> {r.execution}</>}
                    {r.execution && r.components && ' · '}
                    {r.components && <><b>Componentes:</b> {r.components}</>}
                  </div>
                )}
                <p className={'her-desc' + (expanded ? ' open' : '')}>{r.description}</p>
                <button type="button" className="link-btn" onClick={() => setOpen(expanded ? null : r.id)} aria-expanded={expanded}>
                  {expanded ? 'Ver menos' : 'Ver mais'}
                </button>
                <div className="her-foot">
                  {blocked && <span className="her-reason">Pré-requisito não atendido</span>}
                  <button type="button" className={on ? 'ghost-btn small' : 'btn her-add'} aria-pressed={on}
                    disabled={!on && !fits(r)} onClick={() => pick(r.id)}>
                    {on ? 'Remover' : 'Escolher'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {shown.length === 0 && q && <p className="muted-note">Nada com essa busca.</p>}
    </div>
  )
}
