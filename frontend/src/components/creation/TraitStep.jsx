import { useMemo, useState } from 'react'
import { TRAIT_TIERS, addTrait, formatPoints, removeTrait, setTraitDetail, traitTimes } from '../../data/rules.js'

const TABS = [
  { id: 'MINOR', label: 'Menores' },
  { id: 'MAJOR', label: 'Maiores' },
  { id: 'SUPERIOR', label: 'Superiores' },
  { id: 'DRAWBACK', label: 'Desvantagens' },
]

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Runinata: no lugar dos traços fixos de uma origem, escolhe o modo combinado com o mestre (quantos Traços
// Menores e Maiores), os traços e as desvantagens (que dão pontos de Origem). A conta vem do back
// (preview.traitBudget), assim como o que dá para escolher (preview.traitOptions, com o motivo quando não dá).
export default function TraitStep({ system, preview, draft, onChange }) {
  const [tab, setTab] = useState('MINOR')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)

  const status = useMemo(() => Object.fromEntries((preview?.traitOptions ?? []).map(o => [o.id, o])), [preview])
  const drawbacksTab = tab === 'DRAWBACK'
  const picks = drawbacksTab ? draft.drawbacks : draft.traits
  const setPicks = list => onChange(drawbacksTab ? 'drawbacks' : 'traits', list)
  const budget = preview?.traitBudget
  // Modo travado pelo mestre: só ele aparece, sem poder trocar.
  const locked = !!budget?.locked
  const names = useMemo(() => Object.fromEntries(system.traits.map(t => [t.id, t.name])), [system])

  const list = useMemo(() => {
    const q = fold(query.trim())
    const source = drawbacksTab ? system.drawbacks : system.traits.filter(t => t.tier === tab)
    return source
      .filter(t => !q || fold(t.name).includes(q) || fold(t.description).includes(q))
      .filter(t => !onlyAvailable || status[t.id]?.available || traitTimes(picks, t.id) > 0)
      .sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name, 'pt-BR'))
    function rank(t) {
      return traitTimes(picks, t.id) > 0 ? 1 : 0
    }
  }, [system, tab, drawbacksTab, query, onlyAvailable, status, picks])

  return (
    <>
      <h4 className="step-title">Traços</h4>
      <p className="step-hint">
        A Runinata monta a própria origem. O modo, combinado com o mestre, diz quantos Traços Menores e Maiores você recebe.
        Desvantagens dão pontos de Origem, que compram mais traços (Menor {system.costs.MINOR}, Maior {system.costs.MAJOR},
        Superior {system.costs.SUPERIOR}). Se precisar, um traço de cada tipo do modo vira pontos sozinho.
      </p>

      {locked && <p className="trait-converted">O mestre definiu o modo da mesa: {system.budgets.find(b => b.id === budget.budget)?.name}.</p>}
      <div className="options compact trait-budgets" role="radiogroup" aria-label="Modo de traços">
        {system.budgets.filter(b => !locked || b.id === budget.budget).map((b, n) => {
          const on = locked || b.id === draft.traitBudget
          return (
            <button key={b.id} type="button" role="radio" aria-checked={on} className={'option' + (on ? ' on' : '')} style={{ '--n': n }}
              disabled={locked} onClick={() => onChange('traitBudget', b.id)}>
              <span className="option-head"><span className="option-name">{b.name}</span></span>
              <span className="option-facts">
                <span className="fact-chip">{b.minor} menores</span>
                <span className="fact-chip">{b.major} maiores</span>
              </span>
              {b.description && <span className="option-desc">{b.description}</span>}
            </button>
          )
        })}
      </div>

      {budget && (
        <div className="her-pools trait-pools">
          <Pool label="Traços Menores" used={budget.minorUsed} total={budget.minorSlots} />
          <Pool label="Traços Maiores" used={budget.majorUsed} total={budget.majorSlots} />
          <div className="her-pool">
            <span><b>{formatPoints(budget.points - budget.pointsSpent)}</b> de {formatPoints(budget.points)} pontos de Origem</span>
          </div>
          {(budget.minorConverted || budget.majorConverted) && (
            <p className="trait-converted">
              {[budget.minorConverted && '1 Traço Menor', budget.majorConverted && '1 Traço Maior'].filter(Boolean).join(' e ')} do modo
              {budget.minorConverted && budget.majorConverted ? ' viraram' : ' virou'} pontos de Origem.
            </p>
          )}
        </div>
      )}

      <div className="her-tools">
        <div className="seg" role="tablist" aria-label="Tipo de traço">
          {TABS.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <input className="her-search" type="search" placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar traço" />
        <label className="her-only">
          <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} /> Só os que posso escolher
        </label>
      </div>

      {list.length === 0 && <p className="muted-note">Nada com esses filtros.</p>}

      <div className="her-list">
        {list.map((t, n) => {
          const s = status[t.id]
          const times = traitTimes(picks, t.id)
          const max = t.maxTimes ?? 1
          const chosen = times > 0
          const expanded = open === t.id
          const details = picks.filter(p => p.id === t.id).map(p => p.detail ?? '')
          return (
            <article key={t.id} className={'her' + (chosen ? ' on' : '') + (s?.available ? '' : ' locked')} style={{ '--n': Math.min(n, 12) }}>
              <div className="her-head">
                <span className="her-name">{t.name}</span>
                {drawbacksTab
                  ? <span className="her-cat c-drawback">+{formatPoints(t.points)} {t.points === 1 ? 'ponto' : 'pontos'}</span>
                  : <span className={'her-cat c-' + t.tier.toLowerCase()}>{TRAIT_TIERS[t.tier]}</span>}
                {max > 1 && <span className="her-times" title={'Pode ser escolhido até ' + max + ' vezes'}>{times}/{max}</span>}
              </div>
              {drawbacksTab && <div className="her-pre"><b>{t.group}</b></div>}
              {t.requires?.length > 0 && <div className="her-pre"><b>Pré-requisito:</b> {t.requires.map(id => names[id] ?? id).join(' ou ')}</div>}
              {t.background && <div className="her-pre"><b>Libera:</b> a escolha de um Passado</div>}
              <p className={'her-desc' + (expanded ? ' open' : '')}>{t.description}</p>
              {t.description.length > 160 && (
                <button type="button" className="link-btn" onClick={() => setOpen(expanded ? null : t.id)} aria-expanded={expanded}>
                  {expanded ? 'Recolher' : 'Ler tudo'}
                </button>
              )}

              {chosen && t.detail && (
                <div className="trait-details">
                  <span className="her-options-label">{t.detail}</span>
                  {details.map((d, i) => (
                    <input key={i} className="her-search" value={d} placeholder={times > 1 ? 'Escolha ' + (i + 1) : 'Responda aqui'}
                      aria-label={t.detail + (times > 1 ? ' (' + (i + 1) + ')' : '')}
                      onChange={e => setPicks(setTraitDetail(picks, t.id, i, e.target.value))} />
                  ))}
                </div>
              )}

              <div className="her-foot">
                {!s?.available && !chosen && <span className="her-reason">{capitalize(s?.reason)}</span>}
                {chosen && <button type="button" className="ghost-btn small" onClick={() => setPicks(removeTrait(picks, t.id))}>Remover</button>}
                {(!chosen || max > 1) && (
                  <button type="button" className="btn her-add" disabled={!s?.available} onClick={() => setPicks(addTrait(picks, t.id))}
                    title={!s?.available ? capitalize(s?.reason) : undefined}>
                    {chosen ? 'Escolher de novo' : 'Escolher'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function Pool({ label, used, total }) {
  return (
    <div className="her-pool">
      <span className="her-gems" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => <span key={i} className={'her-gem' + (i < used ? ' spent' : '')} />)}
      </span>
      <span><b>{total - used}</b> de {total} {label}</span>
    </div>
  )
}

const capitalize = s => (s ? s[0].toUpperCase() + s.slice(1) : s)
