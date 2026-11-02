import { attributeById, formatModifier } from '../../data/rules.js'

// Ofícios da ficha (contas do back): atributo base, nível nos maiores (disciplinas nos menores) e o bônus do teste
// (mod. + metade da proficiência; inteira com especialidade). Clicar rola o d20.
export default function Crafts({ crafts, onRoll }) {
  return (
    <>
      <h3 className="card-title">Ofícios <small>clique para rolar</small></h3>
      <div className="saves">
        {crafts.map((k, n) => (
          <button key={k.name} type="button" className={'skill save prof' + (k.expertise ? ' expert' : '')} style={{ '--n': n }}
            disabled={k.bonus == null} onClick={() => onRoll('Ofício: ' + k.name, k.bonus)}
            title={(k.kind === 'MINOR' ? 'Ofício menor (disciplinas)' : k.level ? 'Ofício maior, nível ' + k.level : 'Ofício')
              + (k.learnedAt > 1 ? ' · aprendido no ' + k.learnedAt + 'º nível' : '')
              + (k.income ? ' · +' + k.income + ' PO por dia na produção' : '')
              + (k.masterwork ? ' · Obra-Prima com ' + k.masterwork + ' a menos na margem' : '')}>
            <span className="pip" aria-hidden="true" />
            <span className="skill-name">
              {k.name}{k.level ? ' ' + k.level : ''}
              {k.attribute && <small className="craft-attr"> {attributeById(k.attribute)?.abbr}</small>}
              {k.expertise && <small className="craft-attr"> · especialidade</small>}
              {k.income > 0 && <small className="craft-attr"> · +{k.income} PO/dia</small>}
              {k.masterwork > 0 && <small className="craft-attr"> · Obra-Prima −{k.masterwork}</small>}
            </span>
            <span className="skill-mod">{k.bonus == null ? '—' : formatModifier(k.bonus)}</span>
          </button>
        ))}
      </div>
      {crafts.some(k => k.formulas?.length) && (
        <div className="craft-formulas">
          {crafts.filter(k => k.formulas?.length).map(k => (
            <div key={k.name} className="craft-formula-row">
              <span className="craft-formula-name">{k.name} <small>{k.formulas.length}/{k.formulaLimit} fórmulas</small></span>
              <span className="craft-formula-list">
                {k.formulas.map(f => (
                  <span key={f.key} className="craft-formula" title={(f.dc ? 'CD ' + f.dc + ' · ' : '') + (f.description ?? '')}>
                    {f.name} <small>{f.level}</small>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
