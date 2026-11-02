import { ATTRIBUTES, formatModifier, modifier, situationalFor } from '../../data/rules.js'

// Testes de resistência: modificador do atributo + proficiência (se a classe der; em dobro com especialidade). Clicar rola.
export default function SavingThrows({ sheet, onRoll }) {
  const proficient = new Set(sheet.savingThrows ?? [])
  const expert = new Set(sheet.savingThrowExpertise ?? [])
  return (
    <>
      <h3 className="card-title">Resistências <small>clique para rolar</small></h3>
      <div className="saves">
        {ATTRIBUTES.map((a, n) => {
          const prof = proficient.has(a.id)
          const exp = prof && expert.has(a.id)
          const value = modifier(sheet[a.key]) + (prof ? sheet.proficiencyBonus * (exp ? 2 : 1) : 0)
          const notes = situationalFor(sheet, 'SAVE:' + a.id)
          return (
            <button
              key={a.id}
              type="button"
              className={'skill save' + (prof ? ' prof' : '') + (exp ? ' expert' : '')}
              style={{ '--n': n }}
              onClick={() => onRoll('Resistência de ' + a.name, value)}
              aria-label={`Resistência de ${a.name}${exp ? ', especialista' : prof ? ', proficiente' : ''}, ${formatModifier(value)}. Rolar.`}
            >
              <span className="pip" aria-hidden="true" />
              <span className="skill-name" title={notes.join('\n') || undefined}>{a.name}{notes.length > 0 && <i className="sit-mark">✦</i>}</span>
              <span className="skill-mod">{formatModifier(value)}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
