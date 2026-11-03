import { choiceOptionName, equipmentCategory } from '../../data/rules.js'
import ResourceChoice from './ResourceChoice.jsx'
import { ChoiceHead, ChoiceSigil } from './ChoiceParts.jsx'
import OptionTile from './OptionTile.jsx'

// Escolhas que as opções pedem (ex.: "+1 em 1 atributo", "2 perícias de Arcanista").
// A lista vem da prévia do back, já sem as perícias que o personagem ganhou de outro lugar.
// Cada escolha é um cartão com o símbolo do tipo, o progresso em gemas e as opções em azulejos.
// Recursos de classe (Sutras, Iras, Técnicas...) usam cartões com o texto de cada opção.
// Magias (SPELL_CHOICE) mostram o nome que vem da prévia (optionNames).
// Equipamento inicial: o da classe (escolhas EQUIPMENT_CHOICE) ou, trocando, a riqueza inicial da classe (wealth).
export default function ChoiceStep({ choices, picks, onChange, crafts, resources = [], items = [], lore, wealth, onWealth }) {
  const wealthBox = wealth?.formula && (
    <div className="choice wealth-choice" style={{ '--n': 0 }}>
      <ChoiceHead type="WEALTH" label="Equipamento inicial" source="Como você começa a aventura" />
      <div className="opt-grid wealth-pick">
        <button type="button" className={'opt wide' + (!wealth.selected ? ' on' : '')} aria-pressed={!wealth.selected}
          onClick={() => onWealth(false)}>
          <i className="opt-gem" /><span className="opt-name">Equipamento da classe</span>
          <span className="opt-sub">Kit pronto, com os itens da sua classe</span>
        </button>
        <button type="button" className={'opt wide' + (wealth.selected ? ' on' : '')} aria-pressed={wealth.selected}
          onClick={() => onWealth(true)}>
          <i className="opt-gem" /><span className="opt-name">Riqueza inicial</span>
          <span className="opt-sub">{wealth.formula} PO para comprar o que quiser</span>
        </button>
      </div>
      {wealth.selected && <p className="muted-note">Sem o equipamento da classe: os dados são rolados ao criar a ficha e o ouro entra na ficha.</p>}
    </div>
  )
  if (!choices.length) {
    return (
      <>
        <h4 className="step-title">Escolhas</h4>
        {wealthBox}
        <div className="choice-empty">
          <ChoiceSigil type="" />
          <p>Nada para escolher com a origem, a região, a classe e o passado atuais.</p>
        </div>
      </>
    )
  }
  // Vel é opcional e escolhas sem opções cadastradas não bloqueiam: ficam fora da contagem do resumo.
  const required = choices.filter(c => c.type === 'RESOURCE_CHOICE' ? !/^Vel/.test(c.label) : c.options.length)
  const doneCount = required.filter(c => (picks[c.key] ?? []).length >= c.count).length
  // A Runa inicial vem do Pulso Rúnico escolhido (a gema): sem ele, não há o que mostrar.
  const pulse = picks[choices.find(c => /^Pulso Rúnico/.test(c.label))?.key]?.[0] ?? null
  const allDone = required.length > 0 && doneCount === required.length
  return (
    <>
      <div className="choice-top">
        <h4 className="step-title">Escolhas</h4>
        {required.length > 0 && (
          <div className={'choice-summary' + (allDone ? ' ok' : '')}>
            <span>{allDone ? 'Tudo escolhido' : `${doneCount} de ${required.length} feitas`}</span>
            <div className="choice-summary-bar"><div style={{ width: (doneCount / required.length * 100) + '%' }} /></div>
          </div>
        )}
      </div>
      {wealthBox}
      {choices.map((c, n) => {
        // Só o que ainda está nas opções (a prévia pode ter tirado uma que outra escolha pegou).
        const current = (picks[c.key] ?? []).filter(id => c.type === 'RESOURCE_CHOICE' || !c.options.length || c.options.includes(id))
        if (c.type === 'RESOURCE_CHOICE') {
          return <ResourceChoice key={c.key} choice={c} current={current} resources={resources} n={n + 1}
            gem={/^Runa inicial/.test(c.label) ? { name: pulse } : null}
            onChange={list => onChange(c.key, list)} />
        }
        // Sem opções cadastradas: só o aviso (não bloqueia a criação).
        if (!c.options.length) {
          return (
            <div className="choice pending" key={c.key} style={{ '--n': n + 1 }}>
              <ChoiceHead type={c.type} label={c.label} source={c.source} />
              <p className="muted-note">{c.note}</p>
            </div>
          )
        }
        const full = current.length >= c.count
        const toggle = id => onChange(c.key, current.includes(id) ? current.filter(x => x !== id) : full ? current : [...current, id])
        return (
          <div className={'choice' + (current.length === c.count ? ' done' : '')} key={c.key} style={{ '--n': n + 1 }}>
            <ChoiceHead type={c.type} label={c.label} source={c.source} used={current.length} total={c.count}
              done={current.length === c.count} />
            {c.note && <p className="muted-note">{c.note}</p>}
            {optionGroups(c, items).map(g => (
              <div key={g.title ?? 'all'} className="choice-group">
                {g.title && <div className="choice-group-title"><span>{g.title}</span></div>}
                <div className={'opt-grid' + (c.type === 'SIZE_CHOICE' ? ' sizes' : c.type === 'FEATURE' ? ' gems' : '')}>
                  {g.options.map((id, i) => {
                    const on = current.includes(id)
                    const label = c.optionNames?.[id] ?? (g.title && c.type !== 'EQUIPMENT_CHOICE' ? choiceOptionName(c.type, id, crafts).replace(/^[^:]+: /, '') : choiceOptionName(c.type, id, crafts, items))
                    return <OptionTile key={id} type={c.type} id={id} label={label} on={on} disabled={!on && full}
                      onClick={() => toggle(id)} crafts={crafts} lore={lore} tileCount={i} />
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
const PROFICIENCY_GROUPS = [['SKILL', 'Perícias'], ['CRAFT', 'Ofícios'], ['ARMOR', 'Armaduras'], ['WEAPON', 'Armas'], ['MARTIAL_WEAPON', 'Arma marcial']]

function optionGroups(c, items) {
  // Equipamento com muitas opções ("qualquer arma simples"): agrupa pela categoria do catálogo.
  if (c.type === 'EQUIPMENT_CHOICE' && c.options.length > 6) {
    const groups = new Map()
    c.options.forEach(o => {
      const title = equipmentCategory(o, items) ?? 'Outros'
      groups.set(title, [...(groups.get(title) ?? []), o])
    })
    return [...groups].map(([title, options]) => ({ title, options }))
  }
  const mixed = c.type === 'PROFICIENCY_CHOICE' || c.options.some(o => /^(SKILL|CRAFT):/.test(o))
  if (!mixed) return [{ title: null, options: c.options }]
  return PROFICIENCY_GROUPS
    .map(([kind, title]) => ({ title, options: c.options.filter(o => o.split(':')[0] === kind) }))
    .filter(g => g.options.length)
}
