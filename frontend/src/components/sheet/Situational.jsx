import { situationalFor } from '../../data/rules.js'

// Defesas contra tipos de dano, na ordem dos chips: [campo da ficha, rótulo, classe do chip].
const DAMAGE = [
  ['immunities', 'Imunidade', 'imm'],
  ['conditionImmunities', 'Imune a', 'imm'],
  ['absorptions', 'Absorção', 'abs'],
  ['resistances', 'Resistência', 'res'],
  ['vulnerabilities', 'Vulnerabilidade', 'vul'],
]

// No herói: imunidades (a dano e a condições), absorções, resistências e vulnerabilidades (chips) e os efeitos situacionais
// de CA e iniciativa, das Heranças e Aprimoramentos.
export default function Situational({ sheet }) {
  const damage = DAMAGE.flatMap(([field, label, cls]) => (sheet[field] ?? []).map(t => ({ key: field + t, text: label + (label.endsWith(' a') ? ' ' : ': ') + t, cls })))
    // RD contra um tipo de dano (Glacinata: "RD 2: gélido").
    .concat(Object.entries(sheet.typedReductions ?? {}).map(([t, n]) => ({ key: 'rd' + t, text: 'RD ' + n + ': ' + t, cls: 'res' })))
  const ac = situationalFor(sheet, 'AC')
  const init = situationalFor(sheet, 'INITIATIVE')
  if (!damage.length && !ac.length && !init.length) return null
  return (
    <div className="situational">
      {damage.length > 0 && (
        <ul className="cond-chips resist" aria-label="Defesas contra tipos de dano">
          {damage.map(d => <li key={d.key} className={'cond-chip ' + d.cls}>{d.text}</li>)}
        </ul>
      )}
      {[...ac.map(t => ['CA', t]), ...init.map(t => ['Iniciativa', t])].map(([k, t]) => (
        <p key={k + t} className="sit-line"><b>{k}</b> ✦ {t}</p>
      ))}
    </div>
  )
}
