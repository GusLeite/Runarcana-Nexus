import { ATTRIBUTES, formatModifier, modifier } from '../../data/rules.js'

// Os seis atributos em hexágonos hextech; o modificador fica em destaque e o valor embaixo.
export default function AttributeGrid({ sheet, onRoll }) {
  return (
    <div className="attrs">
      {ATTRIBUTES.map(attr => {
        const score = sheet[attr.key]
        const mod = modifier(score)
        return (
          <button
            key={attr.key}
            type="button"
            className="attr"
            onClick={() => onRoll(attr.name, mod)}
            aria-label={`${attr.name} ${score}, modificador ${formatModifier(mod)}. Rolar teste.`}
          >
            <span className="attr-abbr">{attr.abbr}</span>
            <span className="attr-mod">{formatModifier(mod)}</span>
            <span className="attr-score">{score}</span>
          </button>
        )
      })}
    </div>
  )
}
