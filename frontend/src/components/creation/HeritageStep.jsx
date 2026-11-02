import { useMemo, useState } from 'react'
import { HERITAGE_CATEGORIES, HERITAGE_SCOPES, addHeritage, heritageOptions, heritageTimes, removeHeritage, setHeritageOption } from '../../data/rules.js'

const FILTERS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'GENERAL', label: 'Gerais' },
  { id: 'REGION', label: 'De Região' },
  { id: 'ORIGIN', label: 'De Origem' },
]

// Símbolo por tipo de Herança (viewBox 100×100): Geral = escudo, Região = marcador de mapa, Origem = broto.
const SIGILS = {
  GENERAL: ['M16 14H84V52C84 72 66 84 50 92 34 84 16 72 16 52Z', 'M50 30V62M34 46H66'],
  REGION: ['M50 92C30 66 22 52 22 38a28 28 0 0 1 56 0C78 52 70 66 50 92Z', 'M50 46a10 10 0 1 0 .01 0'],
  ORIGIN: ['M50 92V44', 'M50 64C28 64 20 48 20 28 40 28 50 40 50 56', 'M50 50C50 34 62 22 82 22 82 42 70 54 50 58']
}

function HeritageSigil({ category, className = '' }) {
  return (
    <svg className={'ch-sigil ' + className} viewBox="0 0 100 100" aria-hidden="true">
      {(SIGILS[category] ?? SIGILS.GENERAL).map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Compra das Heranças com os pontos que a origem dá. O back diz o que dá para escolher
// (preview.heritageOptions, com o motivo quando não dá) e quantos pontos de cada tipo sobram.
// Cada Herança é uma linha: medalhão do tipo, nome, resumo de 2 linhas ("Ler tudo" abre) e a ação à direita.
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

  const counts = Object.fromEntries(FILTERS.map(f => [f.id, heritages.filter(h => f.id === 'ALL' || h.category === f.id).length]))
  const chosenList = heritages.filter(h => heritageTimes(picks, h.id) > 0)

  return (
    <>
      <div className="choice-top">
        <h4 className="step-title">Heranças</h4>
        <span className={'hr-left' + (left === 0 ? ' done' : '')}>
          {left === 0 ? 'Todos os pontos usados' : left + (left === 1 ? ' ponto sobrando' : ' pontos sobrando')}
        </span>
      </div>

      <div className="hr-pools">
        {pools.map(p => (
          <div className={'hr-pool c-' + p.scope.toLowerCase() + (p.spent >= p.points ? ' spent' : '')} key={p.scope}>
            <HeritageSigil category={p.scope} className="hr-pool-sigil" />
            <div className="hr-pool-text">
              <span className="hr-pool-label">Pontos de {HERITAGE_SCOPES[p.scope]}</span>
              <span className="her-gems" aria-hidden="true">
                {Array.from({ length: p.points }, (_, i) => <span key={i} className={'her-gem' + (i < p.spent ? ' spent' : '')} />)}
              </span>
            </div>
            <b className="hr-pool-count">{p.points - p.spent}<small>/{p.points}</small></b>
          </div>
        ))}
      </div>
      <p className="hr-hint">Cada Herança custa 1 ponto e só vale uma vez, a menos que diga o contrário. Pontos de Região compram as da sua região e as Gerais.</p>

      {chosenList.length > 0 && (
        <div className="hr-chosen" aria-label="Heranças escolhidas">
          <span className="hr-chosen-title">Suas Heranças</span>
          {chosenList.map(h => (
            <button key={h.id} type="button" className={'hr-chip c-' + h.category.toLowerCase()} title="Remover"
              onClick={() => onChange(removeHeritage(picks, h.id))}>
              <HeritageSigil category={h.category} />{h.name}{heritageTimes(picks, h.id) > 1 ? ' ×' + heritageTimes(picks, h.id) : ''}<i aria-hidden="true">×</i>
            </button>
          ))}
        </div>
      )}

      <div className="hr-tools">
        <div className="seg" role="tablist" aria-label="Tipo de Herança">
          {FILTERS.map(f => (
            <button key={f.id} type="button" role="tab" aria-selected={category === f.id}
              className={category === f.id ? 'on' : ''} onClick={() => setCategory(f.id)}>{f.label} <small>{counts[f.id]}</small></button>
          ))}
        </div>
        <input className="her-search" type="search" placeholder="Buscar Herança…" value={query} onChange={e => setQuery(e.target.value)}
          aria-label="Buscar Herança" />
        <label className="hr-switch">
          <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} />
          <span className="hr-switch-track" aria-hidden="true" /> Só as que posso escolher
        </label>
      </div>

      {list.length === 0 && <p className="muted-note">Nenhuma Herança com esses filtros.</p>}

      <div className="hr-list">
        {list.map((h, n) => {
          const s = status[h.id]
          const times = heritageTimes(picks, h.id)
          const max = h.maxTimes ?? 1
          const chosen = times > 0
          const canAdd = s?.available && left > 0 && times < max
          const option = picks.find(p => p.id === h.id)?.option ?? null
          // Escolhas de antes (na subida de nível, as da criação): a prévia conta todas.
          const before = Math.max(0, (preview?.heritages?.find(l => l.id === h.id)?.times ?? times) - times)
          const expanded = open === h.id
          const locked = !s?.available && !chosen
          return (
            <article key={h.id} className={'hr-card c-' + h.category.toLowerCase() + (chosen ? ' on' : '') + (locked ? ' locked' : '')}
              style={{ '--n': Math.min(n, 12) }}>
              <div className="hr-medal"><HeritageSigil category={h.category} /></div>
              <div className="hr-body">
                <div className="hr-top">
                  <span className="hr-name">{h.name}</span>
                  <span className="hr-tag">{HERITAGE_CATEGORIES[h.category]}</span>
                  {max > 1 && <span className="hr-times" title={'Pode ser escolhida até ' + max + ' vezes'}>{times}/{max}</span>}
                </div>
                <p className={'hr-desc' + (expanded ? ' open' : '')}>{h.description}</p>
                <button type="button" className="link-btn" onClick={() => setOpen(expanded ? null : h.id)} aria-expanded={expanded}>
                  {expanded ? 'Recolher' : 'Ler tudo'}
                </button>
                {expanded && !locked && h.prerequisite && <div className="hr-pre"><b>Pré-requisito:</b> {h.prerequisite}</div>}

                {chosen && h.options?.length > 0 && (h.optionPerPick ? heritageOptions(picks, h.id) : [option]).map((current, i, all) => (
                  <div className="hr-options" key={i}>
                    <span className="hr-options-label">
                      {all.length > 1 || before > 0 ? `${before + i + 1}ª escolha: ` : ''}{current ? 'Opção:' : 'Escolha uma opção:'}
                    </span>
                    <div className="opt-grid hr-opt-grid">
                      {/* repeatOptions ("Aprimorar Fonte"): só da 2ª escolha em diante. */}
                      {h.options.filter(o => before + i > 0 || !h.repeatOptions?.includes(o)).map(o => (
                        <button key={o} type="button" className={'opt' + (o === current ? ' on' : '')} aria-pressed={o === current}
                          onClick={() => onChange(setHeritageOption(picks, h.id, o, h.optionPerPick ? i : null))}>
                          <i className="opt-gem" /><span className="opt-name">{o}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {locked && <div className="hr-reason">{capitalize(s?.reason)}</div>}
              </div>
              <div className="hr-act">
                {chosen && <span className="hr-check" title="Escolhida">✓</span>}
                {(!chosen || max > 1) && (
                  <button type="button" className="btn her-add" disabled={!canAdd} onClick={() => onChange(addHeritage(picks, h.id, h.optionPerPick))}
                    title={!s?.available ? capitalize(s?.reason) : left === 0 ? 'Sem pontos sobrando' : undefined}>
                    {chosen ? '+1' : 'Escolher'}
                  </button>
                )}
                {chosen && <button type="button" className="ghost-btn small" onClick={() => onChange(removeHeritage(picks, h.id))}>Remover</button>}
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

const capitalize = s => (s ? s[0].toUpperCase() + s.slice(1) : s)
