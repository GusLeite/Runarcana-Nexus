import { CHARACTERS } from '../../data/characters.js'
import '../../styles/lore.css'

export const playerName = username => {
  if (username === 'mestre') return 'Mestre'
  return CHARACTERS.find(c => c.id === username)?.name ?? username
}

// Texto curto de quem conhece algo: "Todos", "Rudo, Proto" ou "Só o mestre".
export const audienceLabel = ({ toAll, recipients }) => {
  if (toAll) return 'Todos'
  return recipients?.length ? recipients.map(playerName).join(', ') : 'Só o mestre'
}

// Escolhe quem conhece algo: todos, alguns personagens ou, sem nada marcado, só o mestre.
export default function AudiencePicker({ players, toAll, recipients, onChange }) {
  const togglePlayer = username => {
    const next = recipients.includes(username) ? recipients.filter(u => u !== username) : [...recipients, username]
    onChange({ toAll: false, recipients: next })
  }
  return (
    <div className="lore-chips" role="group" aria-label="Quem conhece">
      <button type="button" className={'lore-chip' + (toAll ? ' on' : '')} aria-pressed={toAll} onClick={() => onChange({ toAll: !toAll, recipients: [] })}>Todos</button>
      {players.map(username => {
        const on = !toAll && recipients.includes(username)
        return <button key={username} type="button" className={'lore-chip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => togglePlayer(username)}>{playerName(username)}</button>
      })}
      {!toAll && recipients.length === 0 && <span className="lore-chips-hint">Só o mestre vê</span>}
    </div>
  )
}
