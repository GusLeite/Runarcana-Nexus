import { situationalFor } from '../../data/rules.js'

// No herói: resistências e vulnerabilidades a dano (chips) e os efeitos situacionais de CA e iniciativa, das Heranças e Aprimoramentos.
export default function Situational({ sheet }) {
  const resistances = sheet.resistances ?? []
  const vulnerabilities = sheet.vulnerabilities ?? []
  const ac = situationalFor(sheet, 'AC')
  const init = situationalFor(sheet, 'INITIATIVE')
  if (!resistances.length && !vulnerabilities.length && !ac.length && !init.length) return null
  return (
    <div className="situational">
      {(resistances.length > 0 || vulnerabilities.length > 0) && (
        <ul className="cond-chips resist" aria-label="Resistências e vulnerabilidades a dano">
          {resistances.map(r => <li key={'r' + r} className="cond-chip res">Resistência: {r}</li>)}
          {vulnerabilities.map(v => <li key={'v' + v} className="cond-chip vul">Vulnerabilidade: {v}</li>)}
        </ul>
      )}
      {[...ac.map(t => ['CA', t]), ...init.map(t => ['Iniciativa', t])].map(([k, t]) => (
        <p key={k + t} className="sit-line"><b>{k}</b> ✦ {t}</p>
      ))}
    </div>
  )
}
