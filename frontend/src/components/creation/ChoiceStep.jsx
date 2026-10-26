import { choiceOptionName } from '../../data/rules.js'
import ResourceChoice from './ResourceChoice.jsx'

// Escolhas que as opções pedem (ex.: "+1 em 1 atributo", "2 perícias de Arcanista").
// A lista vem da prévia do back, já sem as perícias que o personagem ganhou de outro lugar.
// Recursos de classe (Sutras, Iras, Técnicas...) usam cartões com o texto de cada opção.
export default function ChoiceStep({ choices, picks, onChange, crafts, resources = [] }) {
  if (!choices.length) {
    return (
      <>
        <h4 className="step-title">Escolhas</h4>
        <p className="muted-note">Nada para escolher com a origem, a região, a classe e o passado atuais.</p>
      </>
    )
  }
  return (
    <>
      <h4 className="step-title">Escolhas</h4>
      {choices.map((c, n) => {
        const current = picks[c.key] ?? []
        if (c.type === 'RESOURCE_CHOICE') {
          return <ResourceChoice key={c.key} choice={c} current={current} resources={resources} n={n}
            onChange={list => onChange(c.key, list)} />
        }
        // Sem opções cadastradas: só o aviso (não bloqueia a criação).
        if (!c.options.length) {
          return (
            <div className="choice pending" key={c.key} style={{ '--n': n }}>
              <div className="choice-head"><span className="choice-label">{c.label}</span></div>
              <div className="choice-source">{c.source}</div>
              <p className="muted-note">{c.note}</p>
            </div>
          )
        }
        const full = current.length >= c.count
        const toggle = id => onChange(c.key, current.includes(id) ? current.filter(x => x !== id) : full ? current : [...current, id])
        return (
          <div className="choice" key={c.key} style={{ '--n': n }}>
            <div className="choice-head">
              <span className="choice-label">{c.label}</span>
              <span className={'choice-count' + (current.length === c.count ? ' ok' : '')}>{current.length}/{c.count}</span>
            </div>
            <div className="choice-source">{c.source}</div>
            {optionGroups(c).map(g => (
              <div key={g.title ?? 'all'} className="choice-group">
                {g.title && <div className="choice-group-title">{g.title}</div>}
                <div className="to-pick">
                  {g.options.map(id => {
                    const on = current.includes(id)
                    return (
                      <button key={id} type="button" className={'to-chip' + (on ? ' on' : '')} aria-pressed={on}
                        disabled={!on && full} onClick={() => toggle(id)}>
                        {g.title ? choiceOptionName(c.type, id, crafts).replace(/^[^:]+: /, '') : choiceOptionName(c.type, id, crafts)}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}

// Proficiência mista (perícia, ofício ou arma) e especialidade em perícia ou ofício em grupos; as outras numa lista só.
const PROFICIENCY_GROUPS = [['SKILL', 'Perícias'], ['CRAFT', 'Ofícios'], ['MARTIAL_WEAPON', 'Armas']]

function optionGroups(c) {
  const mixed = c.type === 'PROFICIENCY_CHOICE' || c.options.some(o => /^(SKILL|CRAFT):/.test(o))
  if (!mixed) return [{ title: null, options: c.options }]
  return PROFICIENCY_GROUPS
    .map(([kind, title]) => ({ title, options: c.options.filter(o => o.split(':')[0] === kind) }))
    .filter(g => g.options.length)
}
