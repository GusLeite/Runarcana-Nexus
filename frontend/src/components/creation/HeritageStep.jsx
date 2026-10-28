import { useMemo, useState } from 'react'
import { HERITAGE_CATEGORIES, HERITAGE_SCOPES, addHeritage, heritageOptions, heritageTimes, removeHeritage, setHeritageOption } from '../../data/rules.js'

const FILTERS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'GENERAL', label: 'Gerais' },
  { id: 'REGION', label: 'De Região' },
  { id: 'ORIGIN', label: 'De Origem' },
]

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Compra das Heranças com os pontos que a origem dá. O back diz o que dá para escolher
// (preview.heritageOptions, com o motivo quando não dá) e quantos pontos de cada tipo sobram.
export default function HeritageStep({ heritages, preview, picks, onChange }) {
  const [category, setCategory] = useState('ALL')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)

  const pools = preview?.heritagePools ?? []
  const total = pools.reduce((s, p) => s + p.points, 0)
  const left = total - pools.reduce((s, p) => s + p.spent, 0)
  const status = useMemo(() => Object.fromEntries((preview?.heritageOptions ?? []).map(o => [o.id, o])), [preview])

  const list = useMemo(() => {
    const q = fold(query.trim())
    return heritages
      .filter(h => category === 'ALL' || h.category === category)
      .filter(h => !q || fold(h.name).includes(q) || fold(h.description).includes(q))
      .filter(h => !onlyAvailable || status[h.id]?.available || heritageTimes(picks, h.id) > 0)
      // Escolhidas primeiro, depois as disponíveis, cada grupo em ordem alfabética.
      .sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name, 'pt-BR'))
    function rank(h) {
      return (heritageTimes(picks, h.id) > 0 ? 2 : 0) + (status[h.id]?.available ? 1 : 0)
    }
  }, [heritages, category, query, onlyAvailable, status, picks])

  if (!total) {
    return (
      <>
        <h4 className="step-title">Heranças</h4>
        <p className="muted-note">A origem escolhida não dá pontos de Herança.</p>
      </>
    )
  }

  return (
    <>
      <h4 className="step-title">Heranças</h4>
      <p className="step-hint">
        Cada Herança custa 1 ponto e só pode ser escolhida uma vez, a menos que diga o contrário.
        Pontos de Região compram as Heranças da sua região e as Gerais.
      </p>

      <div className="her-pools">
        {pools.map(p => (
          <div className="her-pool" key={p.scope}>
            <span className="her-gems" aria-hidden="true">
              {Array.from({ length: p.points }, (_, i) => <span key={i} className={'her-gem' + (i < p.spent ? ' spent' : '')} />)}
            </span>
            <span><b>{p.points - p.spent}</b> de {p.points} {p.points === 1 ? 'ponto' : 'pontos'} de {HERITAGE_SCOPES[p.scope]}</span>
          </div>
        ))}
      </div>

      <div className="her-tools">
        <div className="seg" role="tablist" aria-label="Tipo de Herança">
          {FILTERS.map(f => (
            <button key={f.id} type="button" role="tab" aria-selected={category === f.id}
              className={category === f.id ? 'on' : ''} onClick={() => setCategory(f.id)}>{f.label}</button>
          ))}
        </div>
        <input className="her-search" type="search" placeholder="Buscar Herança…" value={query} onChange={e => setQuery(e.target.value)}
          aria-label="Buscar Herança" />
        <label className="her-only">
          <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} /> Só as que posso escolher
        </label>
      </div>

      {list.length === 0 && <p className="muted-note">Nenhuma Herança com esses filtros.</p>}

      <div className="her-list">
        {list.map((h, n) => {
          const s = status[h.id]
          const times = heritageTimes(picks, h.id)
          const max = h.maxTimes ?? 1
          const chosen = times > 0
          const canAdd = s?.available && left > 0 && times < max
          const option = picks.find(p => p.id === h.id)?.option ?? null
          const expanded = open === h.id
          return (
            <article key={h.id} className={'her' + (chosen ? ' on' : '') + (s?.available ? '' : ' locked')} style={{ '--n': Math.min(n, 12) }}>
              <div className="her-head">
                <span className="her-name">{h.name}</span>
                <span className={'her-cat c-' + h.category.toLowerCase()}>{HERITAGE_CATEGORIES[h.category]}</span>
                {max > 1 && <span className="her-times" title={'Pode ser escolhida até ' + max + ' vezes'}>{times}/{max}</span>}
              </div>
              {h.prerequisite && <div className="her-pre"><b>Pré-requisito:</b> {h.prerequisite}</div>}
              <p className={'her-desc' + (expanded ? ' open' : '')}>{h.description}</p>
              <button type="button" className="link-btn" onClick={() => setOpen(expanded ? null : h.id)} aria-expanded={expanded}>
                {expanded ? 'Recolher' : 'Ler tudo'}
              </button>

              {chosen && h.options?.length > 0 && (h.optionPerPick ? heritageOptions(picks, h.id) : [option]).map((current, i, all) => (
                <div className="her-options" key={i}>
                  <span className="her-options-label">
                    {all.length > 1 ? `${i + 1}ª escolha: ` : ''}{current ? 'Opção:' : 'Escolha uma opção:'}
                  </span>
                  <div className="to-pick">
                    {h.options.map(o => (
                      <button key={o} type="button" className={'to-chip' + (o === current ? ' on' : '')} aria-pressed={o === current}
                        onClick={() => onChange(setHeritageOption(picks, h.id, o, h.optionPerPick ? i : null))}>{o}</button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="her-foot">
                {!s?.available && !chosen && <span className="her-reason">{capitalize(s?.reason)}</span>}
                {chosen && <button type="button" className="ghost-btn small" onClick={() => onChange(removeHeritage(picks, h.id))}>Remover</button>}
                {(!chosen || max > 1) && (
                  <button type="button" className="btn her-add" disabled={!canAdd} onClick={() => onChange(addHeritage(picks, h.id, h.optionPerPick))}
                    title={!s?.available ? capitalize(s?.reason) : left === 0 ? 'Sem pontos sobrando' : undefined}>
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

const capitalize = s => (s ? s[0].toUpperCase() + s.slice(1) : s)
