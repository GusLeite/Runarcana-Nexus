import { useState } from 'react'
import { MOVEMENT_NAMES, formatFeet } from '../../data/rules.js'

// Deslocamento da ficha. Com mais de um tipo (natação, escalada, voo…), clicar passa para o próximo;
// só com caminhada, mostra o valor puro, como antes.
export default function SpeedToggle({ speeds }) {
  const [index, setIndex] = useState(0)
  if (!speeds?.length) return '—'
  const current = speeds[index % speeds.length]
  if (speeds.length === 1) return formatFeet(current.feet)
  const n = (index % speeds.length) + 1
  const next = speeds[n % speeds.length]
  return (
    <button type="button" className="speed-toggle" onClick={() => setIndex(i => i + 1)}
      title={'Clique para ver: ' + MOVEMENT_NAMES[next.type]}
      aria-label={MOVEMENT_NAMES[current.type] + ': ' + formatFeet(current.feet) + '. Clique para ver ' + MOVEMENT_NAMES[next.type]}>
      <span className="speed-value" key={current.type}>{formatFeet(current.feet)}</span>
      <span className="speed-type">{MOVEMENT_NAMES[current.type]}</span>
      <span className="speed-count">{n}/{speeds.length}</span>
    </button>
  )
}
