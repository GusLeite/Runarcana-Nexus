import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { craftFormula, fetchWorkbench } from '../../api/workbench.js'
import { play } from '../../audio/engine.js'
import { OUTCOME_TEXT, STATIONS, chances, faces, fold, splitComponents, stationOf, tierOf } from '../../data/workbench.js'
import { RARITIES } from '../../data/rules.js'
import ItemIcon from './ItemIcon.jsx'
import { CoinIcon } from './icons.jsx'
import '../../styles/workbench.css'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const WORK_MS = 1600
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const wait = ms => new Promise(r => setTimeout(r, ms))
const signed = n => (n >= 0 ? '+' : '−') + Math.abs(n)

// Emblemas das estações (64×64): traço claro; .f preenchido com a cor da estação; .tool é a parte que trabalha.
const EMBLEMS = {
  forge: <>
    <path className="f" d="M8 30h36c0 6-5 9-11 9h-1l3 9h6v5H15v-5h6l3-9h-3c-7 0-13-3-13-9Z" />
    <path d="M44 30h12c-2 5-7 7-12 7" />
    <g className="tool"><path d="M47 4 33 26" /><path className="f" d="m40 2 12 7-3 5-12-7Z" /></g>
  </>,
  alchemy: <>
    <path d="M26 6h12M28 6v14L15 44a8 8 0 0 0 7 12h20a8 8 0 0 0 7-12L36 20V6" />
    <path className="f" d="M19 38h26l4 7a6 6 0 0 1-5 9H20a6 6 0 0 1-5-9Z" />
    <g className="tool"><circle cx="27" cy="44" r="2" /><circle cx="35" cy="47" r="2.6" /><circle cx="31" cy="31" r="1.6" /></g>
  </>,
  kitchen: <>
    <path className="f" d="M9 28h46l-4 18a9 9 0 0 1-9 7H22a9 9 0 0 1-9-7Z" />
    <path d="M5 28h54M14 56l-3 5M50 56l3 5" />
    <g className="tool"><path d="M24 22c-3-4 3-6 0-11M32 22c-3-4 3-6 0-11M40 22c-3-4 3-6 0-11" /></g>
  </>,
  gems: <>
    <path className="f" d="M19 12h26l11 13-24 31L8 25Z" />
    <path d="M8 25h48M19 12l6 13 7 31 7-31 6-13M25 25l7-13 7 13" />
    <g className="tool"><path d="M52 6l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" /></g>
  </>,
  loom: <>
    <rect className="f" x="10" y="20" width="22" height="30" rx="3" />
    <path d="M8 18h26M8 52h26M14 26h14M14 32h14M14 38h14M14 44h14" />
    <g className="tool"><path d="M56 6 40 40" /><ellipse cx="54" cy="10" rx="1.6" ry="3" transform="rotate(25 54 10)" /><path d="M40 40c-4 8-10 12-18 14" /></g>
  </>,
  gears: <>
    <g className="tool"><circle className="f" cx="24" cy="36" r="13" strokeDasharray="5 3.2" strokeWidth="6" /><circle cx="24" cy="36" r="4" /></g>
    <g className="tool rev"><circle cx="45" cy="18" r="9" strokeDasharray="4 3" strokeWidth="5" /><circle cx="45" cy="18" r="2.6" /></g>
  </>,
  runes: <>
    <circle cx="32" cy="32" r="26" />
    <g className="tool"><circle cx="32" cy="32" r="20" strokeDasharray="2 5" /></g>
    <path className="f" d="M32 12 50 44H14Z" />
    <path d="M32 22v14M27 30l5 6 5-6M28 40h8" />
  </>,
  carving: <>
    <path className="f" d="M8 38h34v16H8Z" />
    <path d="M8 46h34M20 38v8M30 46v8" />
    <g className="tool"><path d="m54 6-16 22" /><path className="f" d="m38 28-4 8 7-5Z" /><path d="M50 4l6 4" /></g>
  </>,
  quill: <>
    <path className="f" d="M50 6C36 8 22 20 18 40l6-2c8-6 18-16 26-32Z" />
    <path d="M18 40 12 56M24 38c-2-6 0-14 6-20" />
    <g className="tool"><path d="M10 58h20" strokeDasharray="3 3" /></g>
  </>,
}

function Emblem({ station }) {
  return <svg className="emblem" viewBox="0 0 64 64" aria-hidden="true">{EMBLEMS[station] ?? EMBLEMS.forge}</svg>
}

// Faíscas e brasas: posições sorteadas uma vez por montagem.
function useParticles(n, seed) {
  return useMemo(() => Array.from({ length: n }, (_, i) => ({
    a: Math.round(Math.random() * 360) + 'deg',
    d: Math.round(60 + Math.random() * 110) + 'px',
    x: Math.round(Math.random() * 100) + '%',
    dl: (Math.random() * (seed === 'ember' ? 6 : 0.25)).toFixed(2) + 's',
    s: (0.6 + Math.random() * 0.9).toFixed(2),
    k: i,
  })), [n, seed])
}

// Aba BANCADA: o grimório de fórmulas à esquerda e a estação de trabalho do ofício à direita.
export default function WorkbenchTab({ token, gold, onCrafted, onError, onGo }) {
  const [data, setData] = useState(null)
  const [craft, setCraft] = useState('all')
  const [query, setQuery] = useState('')
  const [onlyReady, setOnlyReady] = useState(false)
  const [key, setKey] = useState(null)
  const [tier, setTier] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | working | result
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([])
  const [showText, setShowText] = useState(false)
  const hammer = useRef()
  const sparks = useParticles(18, 'spark')
  const embers = useParticles(16, 'ember')

  useEffect(() => {
    let live = true
    fetchWorkbench(token).then(d => { if (live) setData(d) }).catch(err => { if (live) { setData({ recipes: [] }); onError(err) } })
    return () => { live = false; clearInterval(hammer.current) }
  }, [token, onError])

  const recipes = useMemo(() => data?.recipes ?? [], [data])
  const crafts = useMemo(() => {
    const m = new Map()
    recipes.forEach(r => m.set(r.craftId, { id: r.craftId, name: r.craftName, n: (m.get(r.craftId)?.n ?? 0) + 1 }))
    return [...m.values()]
  }, [recipes])

  const affordable = useCallback(r => {
    const t = tierOf(r, 0)
    return r.craftable && t.cost != null && t.cost <= gold
  }, [gold])

  const visible = useMemo(() => {
    const q = fold(query.trim())
    return recipes.filter(r => (craft === 'all' || r.craftId === craft)
      && (!q || fold(r.name).includes(q) || fold(r.component).includes(q))
      && (!onlyReady || affordable(r)))
  }, [recipes, craft, query, onlyReady, affordable])

  const recipe = recipes.find(r => r.key === key) ?? visible[0] ?? null
  const station = stationOf(recipe?.craftId)
  const st = STATIONS[station]
  const t = recipe ? tierOf(recipe, tier) : null
  const odds = recipe && t?.dc != null ? chances(recipe.bonus ?? 0, t.dc, recipe.masterworkAt) : null
  const track = recipe && t?.dc != null ? faces(recipe.bonus ?? 0, t.dc, recipe.masterworkAt) : null
  const parts = splitComponents(recipe?.component)
  const blocked = !recipe ? 'Escolha uma fórmula.'
    : !recipe.craftable ? recipe.note
      : t.cost > gold ? 'Faltam ' + (t.cost - gold) + ' PO para os materiais.'
        : null

  const pick = r => {
    if (phase === 'working') return
    setKey(r.key)
    setTier(0)
    setShowText(false)
    if (phase === 'result') setPhase('idle')
    play('page')
  }

  const work = async () => {
    if (!recipe || blocked || phase === 'working') return
    const fast = reduced()
    setPhase('working')
    setResult(null)
    play(station === 'alchemy' || station === 'kitchen' ? 'consume' : 'clack')
    clearInterval(hammer.current)
    if (!fast) hammer.current = setInterval(() => play(station === 'alchemy' || station === 'kitchen' ? 'consume' : 'clack', 0.7), 420)
    try {
      const [res] = await Promise.all([craftFormula(token, recipe.key, tier), wait(fast ? 250 : WORK_MS)])
      clearInterval(hammer.current)
      const outcome = res.outcome.toLowerCase()
      setResult({ ...res, outcome, consumable: recipe.consumable, station })
      setPhase('result')
      play(outcome === 'masterwork' ? 'crit' : outcome === 'success' ? 'success' : outcome === 'failed' ? 'error' : 'fumble')
      setLog(l => [{ id: Date.now(), name: res.name, outcome, item: res.item, d20: res.d20, total: res.total, dc: res.dc, cost: res.cost, refund: res.refund, station }, ...l].slice(0, 8))
      onCrafted(res.sheet)
    } catch (err) {
      clearInterval(hammer.current)
      setPhase('idle')
      onError(err)
    }
  }

  if (!data) return <div className="sheet-state" role="status"><div className="hex-spinner" />Acendendo a forja…</div>

  if (!recipes.length) {
    return (
      <div className="bench bench-empty">
        <div className="bench-empty-art"><Emblem station="forge" /></div>
        <h2>A bancada está fria</h2>
        <p>Você ainda não conhece nenhuma fórmula. Com um Ofício, as fórmulas de nível 0 aparecem aqui; as outras o mestre marca na sua ficha.</p>
      </div>
    )
  }

  const outcomeText = result ? OUTCOME_TEXT[result.outcome] : null
  const rarity = result?.outcome === 'masterwork' ? RARITIES.Uncommon : RARITIES.Common

  return (
    <div className="bench" style={{ '--fx': st.hue, '--fx2': st.hue2 }}>
      <header className="bench-head">
        <div>
          <span className="bench-kicker">OFICINA · {st.name.toUpperCase()}</span>
          <h2>Bancada de Fabricação</h2>
          <p className="bench-rule">{data.rule}</p>
        </div>
        <div className="bench-purse" title="Seu ouro">
          <span>Bolsa</span>
          <b><CoinIcon />{gold}</b>
        </div>
      </header>

      <div className="bench-crafts" role="tablist" aria-label="Ofícios">
        <button type="button" role="tab" aria-selected={craft === 'all'} className={'bench-chip' + (craft === 'all' ? ' on' : '')} onClick={() => setCraft('all')}>
          Todos <i>{recipes.length}</i>
        </button>
        {crafts.map(k => (
          <button key={k.id} type="button" role="tab" aria-selected={craft === k.id} className={'bench-chip' + (craft === k.id ? ' on' : '')}
            style={{ '--c': STATIONS[stationOf(k.id)].hue }} onClick={() => setCraft(k.id)}>
            <Emblem station={stationOf(k.id)} />{k.name} <i>{k.n}</i>
          </button>
        ))}
      </div>

      <div className="bench-body">
        <aside className="grimoire" aria-label="Fórmulas">
          <div className="grimoire-tools">
            <input type="search" placeholder="Buscar fórmula ou material…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar fórmula" />
            <label className="grimoire-ready">
              <input type="checkbox" checked={onlyReady} onChange={e => setOnlyReady(e.target.checked)} /> Só o que dá para fazer agora
            </label>
          </div>
          <ul className="grimoire-list">
            {visible.map((r, i) => {
              const rt = tierOf(r, 0)
              const ok = affordable(r)
              return (
                <li key={r.key} style={{ '--n': Math.min(i, 20), '--c': STATIONS[stationOf(r.craftId)].hue }}>
                  <button type="button" className={'grimoire-row' + (recipe?.key === r.key ? ' on' : '') + (ok ? '' : ' dim')} onClick={() => pick(r)}>
                    <span className="grimoire-sigil"><Emblem station={stationOf(r.craftId)} /></span>
                    <span className="grimoire-name">
                      <b>{r.name}</b>
                      <small>{r.craftName}{r.discipline ? ' · ' + r.discipline : ''} · {r.level === 0 ? 'nível 0' : 'nível ' + r.level}</small>
                    </span>
                    <span className="grimoire-meta">
                      {rt.dc != null ? <em>CD {rt.dc}{r.tiers > 1 ? '+' : ''}</em> : <em className="var">CD ?</em>}
                      {rt.cost != null && <span><CoinIcon />{rt.cost}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
            {!visible.length && <li className="grimoire-none">Nenhuma fórmula com esse filtro.</li>}
          </ul>
        </aside>

        {recipe && (
          <section className={'station st-' + station + ' ' + phase + (result ? ' ' + result.outcome : '')} aria-live="polite">
            <div className="bench-top">
              <div className="bench-lamp" aria-hidden="true" />
              <div className="bench-rack" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <div className="embers" aria-hidden="true">
                {embers.map(e => <i key={e.k} style={{ left: e.x, '--dl': e.dl, '--s': e.s }} />)}
              </div>

              <div className="station-core">
                <div className="station-ring" aria-hidden="true" />
                <div className="station-emblem"><Emblem station={station} /></div>
                {phase === 'working' && (
                  <div className="sparks" aria-hidden="true">
                    {sparks.map(s => <i key={s.k} style={{ '--a': s.a, '--d': s.d, '--dl': s.dl, '--s': s.s }} />)}
                  </div>
                )}
                <ul className="mats" aria-label="Materiais">
                  {parts.map((p, i) => (
                    <li key={p + i} style={{ '--i': i, '--ang': (parts.length === 1 ? 0 : -62 + (i * 124) / (parts.length - 1)) + 'deg' }}><span>{p}</span></li>
                  ))}
                </ul>
              </div>

              {phase === 'working' && <div className="station-status">{st.working}</div>}

              {phase === 'result' && result && (
                <div className={'forge-result ' + result.outcome} role="status">
                  {result.outcome === 'masterwork' && <div className="mw-rays" aria-hidden="true" />}
                  <div className="fr-die" aria-label={'d20: ' + result.d20}><span>{result.d20}</span></div>
                  <h3>{outcomeText.title}</h3>
                  <p className="fr-math">d20 {result.d20} {signed(result.bonus)} = <b>{result.total}</b> contra CD {result.dc}</p>
                  {result.item ? (
                    <div className="fr-item">
                      <div className="slot mini" style={{ '--r': rarity.color }}>
                        <ItemIcon item={{ name: result.item, kind: result.consumable ? 'CONSUMABLE' : null }} />
                      </div>
                      <div><b>{result.item}</b><small>{outcomeText.sub}</small></div>
                    </div>
                  ) : (
                    <p className="fr-loss">
                      {outcomeText.sub}{' '}
                      {result.refund > 0 ? <>Voltaram <b>{result.refund} PO</b> dos {result.cost}.</> : result.cost > 0 ? <>Perdeu <b>{result.cost} PO</b>.</> : null}
                    </p>
                  )}
                  <div className="fr-actions">
                    <button type="button" className="ghost-btn" onClick={() => setPhase('idle')}>Voltar à bancada</button>
                    {result.item && <button type="button" className="ghost-btn" onClick={() => onGo('inventory')}>Ver na mochila</button>}
                  </div>
                </div>
              )}
            </div>

            <div className="recipe">
              <div className="recipe-title">
                <div>
                  <span className="recipe-craft">{recipe.craftName}{recipe.discipline ? ' · ' + recipe.discipline : ''} · {recipe.level === 0 ? 'Fórmula comum' : 'Nível ' + recipe.level}</span>
                  <h3>{recipe.name}</h3>
                  {recipe.prerequisite && <span className="recipe-pre">Pré-requisito: {recipe.prerequisite}</span>}
                </div>
                {recipe.tiers > 1 && (
                  <div className="recipe-tiers" role="radiogroup" aria-label="Grau">
                    {Array.from({ length: recipe.tiers }, (_, i) => (
                      <button key={i} type="button" role="radio" aria-checked={tier === i} className={tier === i ? 'on' : ''}
                        disabled={phase === 'working'} onClick={() => { setTier(i); if (phase === 'result') setPhase('idle') }}>{ROMAN[i] ?? i + 1}</button>
                    ))}
                  </div>
                )}
              </div>

              <dl className="recipe-stats">
                <div><dt>CD</dt><dd>{t.dc ?? recipe.dcText ?? '—'}</dd></div>
                <div><dt>Bônus</dt><dd>{recipe.bonus == null ? '—' : signed(recipe.bonus)}</dd></div>
                <div><dt>Valor</dt><dd>{recipe.tiers > 1 && t.value != null ? t.value + ' PO' : recipe.valueText ?? '—'}</dd></div>
                <div className="cost"><dt>Materiais</dt><dd><CoinIcon />{t.cost ?? '?'}</dd></div>
                <div><dt>Tempo</dt><dd>{recipe.time ?? 'Padrão'}</dd></div>
              </dl>

              {track && (
                <div className="d20-track" aria-label={'Chance de sucesso: ' + odds.success + '%'}>
                  <div className="d20-track-head">
                    <span>Faces do d20</span>
                    <span><b className="ok">{odds.success}%</b> sucesso · <b className="mw">{odds.masterwork}%</b> obra-prima</span>
                  </div>
                  <ol>
                    {track.map((o, i) => (
                      <li key={i} className={o + (result && phase === 'result' && result.d20 === i + 1 ? ' hit' : '')} title={(i + 1) + ': ' + OUTCOME_TEXT[o].title.toLowerCase()}>{i + 1}</li>
                    ))}
                  </ol>
                  <div className="d20-legend"><i className="ruined" />perde tudo<i className="failed" />volta metade<i className="success" />sucesso<i className="masterwork" />obra-prima</div>
                </div>
              )}

              <div className="recipe-text">
                <p className={showText ? 'open' : ''}>{recipe.description}</p>
                {recipe.description?.length > 220 && (
                  <button type="button" className="link-btn" onClick={() => setShowText(v => !v)}>{showText ? 'Ver menos' : 'Ver o texto inteiro'}</button>
                )}
                {recipe.natural20 && <p className="recipe-nat"><b>No 20 natural:</b> {recipe.natural20}</p>}
              </div>

              <button type="button" className="forge-btn" onClick={work} disabled={!!blocked || phase === 'working'} title={blocked ?? ''}>
                <span>{phase === 'working' ? st.working.toUpperCase() : st.verb}</span>
                {!blocked && phase !== 'working' && <small>gasta {t.cost} PO de materiais</small>}
                {blocked && <small>{blocked}</small>}
              </button>
            </div>
          </section>
        )}
      </div>

      {log.length > 0 && (
        <section className="bench-log" aria-label="Registro da oficina">
          <h4>Registro da oficina</h4>
          <ol>
            {log.map(l => (
              <li key={l.id} className={l.outcome} style={{ '--c': STATIONS[l.station].hue }}>
                <span className="bl-die">{l.d20}</span>
                <span className="bl-name"><b>{l.item ?? l.name}</b><small>{OUTCOME_TEXT[l.outcome].title.replace('!', '').replace('…', '')} · {l.total} vs CD {l.dc}</small></span>
                <span className="bl-gold">{l.refund > 0 ? '−' + (l.cost - l.refund) : l.cost > 0 ? '−' + l.cost : '0'} PO</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
