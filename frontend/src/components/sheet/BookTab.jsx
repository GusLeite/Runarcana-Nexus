import { useEffect, useMemo, useState } from 'react'
import { fetchCompendium, fetchFormulas, fetchRituals, fetchSpells } from '../../api/book.js'
import { CRAFT_NAMES } from '../../data/rules.js'
import { RichText } from './DocumentsTab.jsx'

// Aba de consulta do livro: magias, rituais, tabelas e as páginas do compêndio (Familiares, Tecmaturgia).
// Lista com busca à esquerda e leitura à direita, no mesmo formato dos documentos. Os dados vêm uma vez só.
const MODES = [
  { id: 'spells', label: 'Magias' },
  { id: 'rituals', label: 'Rituais' },
  { id: 'tables', label: 'Tabelas' },
  { id: 'formulas', label: 'Fórmulas' },
  { id: 'pages', label: 'Compêndio' },
]
const SKILLS = { ARCANA: 'Arcanismo', NATURE: 'Natureza', RELIGION: 'Religião' }
const LIMIT = 80

const levelName = level => (level === 0 ? 'Truque' : level + 'º nível')
const norm = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function BookTab({ token, onError }) {
  const [data, setData] = useState(null)
  const [mode, setMode] = useState('spells')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [craft, setCraft] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([fetchSpells(token), fetchRituals(token), fetchCompendium(token), fetchFormulas(token)])
      .then(([spells, magic, compendium, formulas]) => alive && setData({ spells, rituals: magic.rituals, tables: magic.tables, pages: compendium.pages, formulas }))
      .catch(e => alive && onError(e))
    return () => { alive = false }
  }, [token, onError])

  const entries = useMemo(() => {
    if (!data) return []
    const q = norm(query)
    const list = {
      spells: data.spells.filter(s => level === 'all' || String(s.level) === level)
        .map(s => ({ id: 's:' + s.id, name: s.name, meta: levelName(s.level) + (s.ritual ? ' · ritual' : ''), item: s })),
      rituals: data.rituals.map(r => ({ id: 'r:' + r.id, name: r.name, meta: 'Ritual de ' + r.level + 'º nível', item: r })),
      tables: data.tables.map(t => ({ id: 't:' + t.id, name: t.name, meta: t.rows.length + ' linhas', item: t })),
      pages: data.pages.map(p => ({ id: 'p:' + p.id, name: p.title, meta: p.chapter, item: p })),
      formulas: [
        ...(craft === 'all' || craft === 'general' ? data.formulas.general : [])
          .map(f => ({ id: 'g:' + f.id, name: f.name, meta: 'Fórmula geral · nível ' + f.level, item: { ...f, craftName: f.crafts } })),
        ...Object.entries(data.formulas.crafts).filter(([id]) => craft === 'all' || craft === id)
          .flatMap(([id, list]) => list.map(f => ({ id: 'f:' + id + ':' + f.id, name: f.name,
            meta: CRAFT_NAMES[id] + (f.discipline ? ' (' + f.discipline + ')' : '') + ' · nível ' + f.level, item: { ...f, craftName: CRAFT_NAMES[id] } }))),
      ],
    }[mode]
    return q ? list.filter(e => norm(e.name).includes(q)) : list
  }, [data, mode, query, level, craft])

  const selected = entries.find(e => e.id === selectedId) ?? entries[0]
  const switchMode = m => { setMode(m); setQuery(''); setSelectedId(null) }

  if (!data) return <div className="sheet-state" role="status"><div className="hex-spinner" />Abrindo o livro…</div>

  return (
    <div className="documents book">
      <div className="doc-list">
        <div className="card-title inv-title">
          <h3>Livro <small>{entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}</small></h3>
          <div className="seg" role="group" aria-label="Parte do livro">
            {MODES.map(m => (
              <button key={m.id} type="button" className={mode === m.id ? 'on' : ''} aria-pressed={mode === m.id}
                onClick={() => switchMode(m.id)}>{m.label}</button>
            ))}
          </div>
        </div>
        <div className="book-filters">
          <input type="search" className="book-search" placeholder="Buscar pelo nome" value={query}
            onChange={e => { setQuery(e.target.value); setSelectedId(null) }} aria-label="Buscar no livro" />
          {mode === 'formulas' && (
            <select value={craft} onChange={e => { setCraft(e.target.value); setSelectedId(null) }} aria-label="Ofício">
              <option value="all">Todos os ofícios</option>
              <option value="general">Fórmulas gerais</option>
              {Object.entries(CRAFT_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
          {mode === 'spells' && (
            <select value={level} onChange={e => { setLevel(e.target.value); setSelectedId(null) }} aria-label="Nível da magia">
              <option value="all">Todos os níveis</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => <option key={l} value={String(l)}>{levelName(l)}</option>)}
            </select>
          )}
        </div>
        {entries.length === 0 && <p className="muted-note">Nada encontrado.</p>}
        <ul className="docs compact">
          {entries.slice(0, LIMIT).map((e, n) => (
            <li key={e.id}>
              <button type="button" className={'doc-row' + (e.id === selected?.id ? ' on' : '')} style={{ '--n': Math.min(n, 20) }}
                onClick={() => setSelectedId(e.id)}>
                <span className="doc-info">
                  <span className="doc-name">{e.name}</span>
                  <span className="doc-meta">{e.meta}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {entries.length > LIMIT && <p className="muted-note">Mostrando {LIMIT} de {entries.length}. Busque pelo nome para achar o resto.</p>}
      </div>

      <div className="doc-view">
        {selected ? (
          <article className="scroll book-entry" key={selected.id}>
            {mode === 'spells' && <SpellView spell={selected.item} />}
            {mode === 'rituals' && <RitualView ritual={selected.item} />}
            {mode === 'tables' && <TableView table={selected.item} title />}
            {mode === 'pages' && <PageView page={selected.item} />}
            {mode === 'formulas' && <FormulaView formula={selected.item} rule={data.formulas.rule} />}
          </article>
        ) : <div className="item-detail empty-detail"><p className="muted-note">Escolha uma entrada para ler.</p></div>}
      </div>
    </div>
  )
}

function Head({ kind, title, meta }) {
  return (
    <header className="scroll-head">
      <div>
        <div className="scroll-kind">{kind}</div>
        <h2 className="scroll-title">{title}</h2>
        {meta && <div className="scroll-meta">{meta}</div>}
      </div>
    </header>
  )
}

function Facts({ rows }) {
  const shown = rows.filter(([, v]) => v)
  return <dl className="book-facts">{shown.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
}

function SpellView({ spell }) {
  return (
    <>
      <Head kind={'Magia · ' + levelName(spell.level)} title={spell.name}
        meta={[spell.ritual && 'Ritual', spell.concentration && 'Concentração'].filter(Boolean).join(' · ')} />
      <div className="scroll-body">
        <Facts rows={[
          ['Tempo de conjuração', spell.castingTime], ['Alcance', spell.range],
          ['Componentes', spell.components && spell.components + (spell.material ? ' (' + spell.material + ')' : '')],
          ['Duração', spell.duration],
        ]} />
        <RichText text={spell.description ?? ''} />
        {spell.higherLevels && <><h4>Em níveis superiores</h4><RichText text={spell.higherLevels} /></>}
      </div>
    </>
  )
}

function RitualView({ ritual }) {
  return (
    <>
      <Head kind={'Ritual · ' + ritual.level + 'º nível'} title={ritual.name}
        meta={ritual.skills.map(s => SKILLS[s] ?? s).join(', ') + (ritual.prerequisite ? ' · pré-requisito: ' + ritual.prerequisite : '')} />
      <div className="scroll-body">
        <Facts rows={[
          ['Rebote', ritual.backlash && (ritual.backlashAt != null ? ritual.backlashAt + ' sucessos ou menos: ' : '') + ritual.backlash],
          ['Língua', ritual.language], ['Duração', ritual.duration], ['Componentes', ritual.components],
        ]} />
        <RichText text={ritual.description ?? ''} />
      </div>
    </>
  )
}

function TableView({ table, title }) {
  return (
    <>
      {title && <Head kind="Tabela" title={table.name} />}
      <div className="scroll-body">
        {table.description && <RichText text={table.description} />}
        {!title && table.name && <h4>{table.name}</h4>}
        <div className="book-table-wrap">
          <table className="book-table">
            <thead><tr>{table.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// Uma fórmula de Ofício: pré-requisito, ofício, CD, componente, valor, tempo, texto e o 20 natural.
export function FormulaView({ formula: f, rule }) {
  return (
    <>
      <Head kind={'Fórmula · ' + (f.craftName ?? '') + (f.discipline ? ' (' + f.discipline + ')' : '')} title={f.name}
        meta={'Nível ' + f.level + (f.prerequisite ? ' · pré-requisito: ' + f.prerequisite : '')} />
      <div className="scroll-body">
        <Facts rows={[['Ofício', f.craft ?? f.crafts], ['Parte', f.part], ['CD', f.dc], ['Componente', f.component], ['Valor', f.value],
          ['Tempo', f.time], ['Detalhe', f.detail]]} />
        <RichText text={f.description ?? ''} />
        {f.natural20 && <p><strong><em>20 natural.</em></strong> {f.natural20}</p>}
        {rule && <p className="muted-note">{rule}</p>}
      </div>
    </>
  )
}

function PageView({ page }) {
  return (
    <>
      <Head kind={page.chapter} title={page.title} />
      <div className="scroll-body">
        {page.sections.map((s, i) => (
          <section key={i} className={'book-section d' + s.depth}>
            {s.title && <h4>{s.title}</h4>}
            {s.text && <RichText text={s.text} />}
            {(s.tables ?? []).map((t, j) => <TableView key={j} table={t} />)}
          </section>
        ))}
      </div>
    </>
  )
}
