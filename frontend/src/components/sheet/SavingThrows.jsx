import { ATTRIBUTES, formatModifier, modifier } from '../../data/rules.js'

// Testes de resistência: modificador do atributo + proficiência (se a classe der). Clicar rola.
export default function SavingThrows({ sheet, onRoll }) {
  const proficient = new Set(sheet.savingThrows ?? [])
  return (
    <>
      <h3 className="card-title">Resistências <small>clique para rolar</small></h3>
      <div className="saves">
        {ATTRIBUTES.map((a, n) => {
          const prof = proficient.has(a.id)
          const value = modifier(sheet[a.key]) + (prof ? sheet.proficiencyBonus : 0)
          return (
            <button
              key={a.id}
              type="button"
              className={'skill save' + (prof ? ' prof' : '')}
              style={{ '--n': n }}
              onClick={() => onRoll('Resistência de ' + a.name, value)}
              aria-label={`Resistência de ${a.name}${prof ? ', proficiente' : ''}, ${formatModifier(value)}. Rolar.`}
            >
              <span className="pip" aria-hidden="true" />
              <span className="skill-name">{a.name}</span>
              <span className="skill-mod">{formatModifier(value)}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
