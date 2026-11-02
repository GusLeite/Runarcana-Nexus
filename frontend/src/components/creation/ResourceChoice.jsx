import { useState } from 'react'
import { ChoiceHead } from './ChoiceParts.jsx'
import { Sigil } from './OptionTile.jsx'
import { gemOf } from '../../data/choiceLore.js'
import { resourceCost, togglePick } from '../../data/rules.js'

// Escolha de recurso de classe (Sutra, Ira, Técnica, Vel, Invocação, Grande Espírito, Aspecto Feral):
// cartões com o pré-requisito e o texto. As opções vêm da prévia, já filtradas pelos pré-requisitos.
// Vel é opcional e conta pontos (◆) em vez de quantidade.
export default function ResourceChoice({ choice, current, resources, onChange, n, gem }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)
  const byId = id => resources.find(r => r.id === id)
  const vel = choice.options.concat(current).some(id => byId(id)?.kind === 'VEL') || /^Vel/.test(choice.label)
  const used = vel ? current.reduce((sum, id) => sum + resourceCost(byId(id)), 0) : current.length
  // Escolhidos que a prévia não aceita mais (pré-requisito): aparecem para poder tirar.
  // Runa inicial: só as runas do Pulso escolhido (gem.name); sem Pulso, nenhuma.
  const allowed = gem ? choice.options.filter(id => byId(id)?.groups?.includes(gem.name)) : choice.options
  const stale = current.filter(id => !allowed.includes(id))
  const done = vel ? used <= choice.count : used === choice.count
  const q = query.trim().toLowerCase()
  const shown = [...stale, ...allowed]
    .map(byId).filter(Boolean)
    .filter(r => !q || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q))
  const fits = r => !vel || current.includes(r.id) || used + resourceCost(r) <= choice.count
  const pick = id => onChange(togglePick(current, id, vel ? Infinity : choice.count))

  return (
    <div className={'choice' + (done ? ' done' : '')} style={{ '--n': n }}>
      <ChoiceHead type="RESOURCE_CHOICE" label={choice.label} source={choice.source} used={used} total={choice.count}
        done={done} suffix={vel ? ' ◆' : ''} />
      {choice.note && !gem && <p className="muted-note">{choice.note}</p>}
      {allowed.length > 6 && (
        <input className="her-search res-search" type="search" placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)}
          aria-label={'Buscar em ' + choice.label} />
      )}
      {gem && !gem.name && (
        <p className="gem-hint">Escolha o <b>Pulso Rúnico</b> acima: a Runa inicial vem da gema escolhida.</p>
      )}
      {shown.length > 0 && (
        <div className="her-list res-list">
          {shown.map(r => {
            const on = current.includes(r.id)
            const blocked = stale.includes(r.id)
            const expanded = open === r.id
            const rg = r.kind === 'RUNA' ? gemOf(r.groups?.find(g => gemOf(g))) : null
            return (
              <article key={r.id} className={'her' + (on ? ' on' : '') + (blocked ? ' locked' : '') + (rg ? ' gemmed' : '')}
                style={rg ? { '--gem': rg.color } : undefined}>
                <div className="her-head">
                  {rg && <Sigil paths={rg.sigil} className="her-gem-sigil" />}
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
