import { ATTRIBUTES, formatModifier, modifier } from '../../data/rules.js'
import Num from './Num.jsx'

// Os seis atributos em hexágonos hextech; o modificador fica em destaque e o valor embaixo.
// Entram um a um (--n) e os números contam até o valor.
export default function AttributeGrid({ sheet, onRoll }) {
  return (
    <div className="attrs">
      {ATTRIBUTES.map((attr, i) => {
        const score = sheet[attr.key]
        const mod = modifier(score)
        return (
          <button
            key={attr.key}
            type="button"
            className="attr"
            style={{ '--n': i }}
            onClick={() => onRoll(attr.name, mod)}
            aria-label={`${attr.name} ${score}, modificador ${formatModifier(mod)}. Rolar teste.`}
          >
            <span className="attr-abbr">{attr.abbr}</span>
            <span className="attr-mod"><Num value={mod} format={formatModifier} /></span>
            <span className="attr-score"><Num value={score} /></span>
          </button>
        )
      })}
    </div>
  )
}
