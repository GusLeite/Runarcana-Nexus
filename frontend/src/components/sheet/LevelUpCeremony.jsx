import { useEffect, useRef, useState } from 'react'

const R = 70
const LEN = 2 * Math.PI * R
const RAYS = 16
const SPARKS = 22
// O número troca quando o anel termina de encher.
const FLIP_AT = 1100

// Cerimônia depois de subir de nível: o anel de nível enche do nível antigo até o novo, o número vira,
// raios e faíscas sobem e, embaixo, o resumo do que foi ganho (levelUpGains). Esc, clique fora ou CONTINUAR fecham.
export default function LevelUpCeremony({ gains, name, onClose }) {
  const [shown, setShown] = useState(gains.fromLevel)
  const box = useRef()

  useEffect(() => {
    const t = setTimeout(() => setShown(gains.toLevel), FLIP_AT)
    box.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [gains.toLevel, onClose])

  const lines = summary(gains)

  return (
    <div className="lvc-overlay" role="presentation" onClick={onClose}>
      <div className="lvc" role="dialog" aria-modal="true" aria-labelledby="lvc-title" tabIndex={-1} ref={box} onClick={e => e.stopPropagation()}>
        <div className="lvc-burst" aria-hidden="true">
          {Array.from({ length: RAYS }, (_, i) => <span key={i} className="lvc-ray" style={{ '--a': (360 / RAYS) * i + 'deg' }} />)}
          {Array.from({ length: SPARKS }, (_, i) => (
            <span key={i} className="lvc-spark" style={{ '--x': ((i * 47) % 100) - 50 + 'px', '--d': 1.4 + ((i * 7) % 10) / 10 + 's', '--dl': 0.9 + ((i * 13) % 8) / 10 + 's' }} />
          ))}
        </div>
        <div className="lvc-ring">
          <svg viewBox="0 0 160 160" aria-hidden="true">
            <circle cx="80" cy="80" r={R} className="lvc-track" />
            <circle cx="80" cy="80" r={R} className="lvc-fill" strokeDasharray={LEN}
              style={{ '--from': LEN * (1 - gains.fromLevel / 20), '--to': LEN * (1 - gains.toLevel / 20) }} />
          </svg>
          <div className="lvc-num" aria-live="polite">
            <small>NÍVEL</small>
            <span key={shown} className={shown === gains.toLevel ? 'lvc-new' : ''}>{shown}</span>
          </div>
        </div>
        <h2 className="lvc-title" id="lvc-title">{name} subiu de nível!</h2>
        {lines.length > 0 && (
          <ul className="lvc-gains">
            {lines.map((l, i) => (
              <li key={l.label} style={{ '--i': i }}>
                <span className="lvc-label">{l.label}</span>
                <span className="lvc-value">{l.value}</span>
              </li>
            ))}
          </ul>
        )}
        <button className="btn lvc-ok" type="button" onClick={onClose}>CONTINUAR</button>
      </div>
    </div>
  )
}

// Linhas do resumo, na ordem em que importam na mesa.
function summary(g) {
  const out = []
  const change = c => c.from + ' → ' + c.to
  if (g.newClasses.length) out.push({ label: 'Nova classe', value: g.newClasses.join(', ') })
  if (g.subclass) out.push({ label: 'Subclasse', value: g.subclass })
  if (g.maxHp) out.push({ label: 'PV máximos', value: change(g.maxHp) + ' (+' + (g.maxHp.to - g.maxHp.from) + ')' })
  if (g.proficiency) out.push({ label: 'Proficiência', value: '+' + g.proficiency.from + ' → +' + g.proficiency.to })
  if (g.attributes.length) out.push({ label: 'Atributos', value: g.attributes.map(a => a.abbr + ' ' + change(a)).join(' · ') })
  if (g.abilities.length) out.push({ label: 'Habilidades', value: g.abilities.join(', ') })
  if (g.spells.length) out.push({ label: 'Magias', value: g.spells.join(', ') })
  if (g.heritages.length) out.push({ label: 'Heranças', value: g.heritages.join(', ') })
  if (g.crafts.length) out.push({ label: 'Ofícios', value: g.crafts.join(', ') })
  if (g.languages.length) out.push({ label: 'Idiomas', value: g.languages.join(', ') })
  return out
}
