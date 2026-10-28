import { situationalFor } from '../../data/rules.js'

// No herói: resistências a dano (chips) e os efeitos situacionais de CA e iniciativa, das Heranças e Aprimoramentos.
export default function Situational({ sheet }) {
  const resistances = sheet.resistances ?? []
  const ac = situationalFor(sheet, 'AC')
  const init = situationalFor(sheet, 'INITIATIVE')
  if (!resistances.length && !ac.length && !init.length) return null
  return (
    <div className="situational">
      {resistances.length > 0 && (
        <ul className="cond-chips resist" aria-label="Resistências a dano">
          {resistances.map(r => <li key={r} className="cond-chip res">Resistência: {r}</li>)}
        </ul>
      )}
      {[...ac.map(t => ['CA', t]), ...init.map(t => ['Iniciativa', t])].map(([k, t]) => (
        <p key={k + t} className="sit-line"><b>{k}</b> ✦ {t}</p>
      ))}
    </div>
  )
}
