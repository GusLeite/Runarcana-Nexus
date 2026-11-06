import { useEffect, useMemo, useState } from 'react'
import { setSkills } from '../../api/master.js'
import { SKILL_NAMES, formatModifier, groupSkills } from '../../data/rules.js'

// Os três estados de uma perícia, na ordem do seletor.
const STATES = [
  { id: 'NONE', short: '—', name: 'Sem proficiência' },
  { id: 'PROFICIENT', short: '◆', name: 'Proficiente' },
  { id: 'EXPERTISE', short: '◆◆', name: 'Especialidade' },
]
const stateName = id => STATES.find(s => s.id === id)?.name ?? id
const stateOf = s => (s.expertise ? 'EXPERTISE' : s.proficient ? 'PROFICIENT' : 'NONE')
const profTimes = state => (state === 'EXPERTISE' ? 2 : state === 'PROFICIENT' ? 1 : 0)

// Mestre: tira proficiência, dá proficiência ou especialidade em qualquer perícia. As mudanças ficam num rascunho
// (com o bônus novo já calculado) até SALVAR; o ajuste fica à parte das regras e sobrevive à subida de nível.
// ↺ volta a perícia ao que a criação e os níveis deram. onSaved recebe a ficha devolvida.
export default function SkillEditor({ token, character, onSaved, onError }) {
  const [draft, setDraft] = useState({})
  const [filter, setFilter] = useState('ALL')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  useEffect(() => { setDraft({}); setMsg(null) }, [character.id])

  const pb = character.proficiencyBonus ?? 2
  const skills = character.skills ?? []
  const rows = useMemo(() => skills.map(s => {
    const current = stateOf(s)
    // 'BASE' no rascunho = voltar ao das regras.
    const wanted = draft[s.skill] === 'BASE' ? s.base ?? current : draft[s.skill] ?? current
    const modifier = s.modifier + (profTimes(wanted) - profTimes(current)) * pb
    return { ...s, current, wanted, saved: s.modifier, modifier, changed: s.skill in draft }
  }), [skills, draft, pb])

  const changes = rows.filter(r => r.changed)
  const visible = rows.filter(r => filter === 'ALL' ? true
    : filter === 'PROF' ? r.wanted !== 'NONE'
      : r.adjusted || r.changed)
  const adjustedCount = rows.filter(r => r.adjusted).length

  // Escolher o que já está salvo desfaz a mudança do rascunho. Escolher o mesmo das regras também desfaz o ajuste
  // (o back tira o ajuste quando o estado é igual ao das regras).
  const choose = (s, state) => setDraft(d => {
    const next = { ...d }
    if (state === s.current) delete next[s.skill]
    else next[s.skill] = state
    return next
  })
  const restore = s => setDraft(d => ({ ...d, [s.skill]: 'BASE' }))

  const save = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const updated = await setSkills(token, character.id, draft)
      setDraft({})
      onSaved(updated)
    } catch (err) {
      if (err.status === 401) onError(err)
      else setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="skill-editor">
      <div className="se-head">
        <p className="muted-note">
          Bônus de proficiência {formatModifier(pb)}. O ajuste vale por cima da criação e continua depois da subida de nível.
        </p>
        <div className="seg" role="group" aria-label="Filtro de perícias">
          {[['ALL', 'Todas'], ['PROF', 'Proficientes'], ['ADJ', 'Ajustadas' + (adjustedCount ? ' · ' + adjustedCount : '')]].map(([id, label]) => (
            <button key={id} type="button" className={filter === id ? 'on' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
      </div>

      {visible.length === 0 && <p className="muted-note">Nenhuma perícia ajustada pelo mestre nesta ficha.</p>}
      <div className="se-groups">
        {groupSkills(visible).map(({ attr, skills: group }) => (
          <div className="se-group" key={attr.id}>
            <div className="skill-group-name">{attr.name}</div>
            {group.map(s => {
              const name = SKILL_NAMES[s.skill] ?? s.skill
              return (
                <div key={s.skill} className={'se-row' + (s.changed ? ' changed' : '') + (s.adjusted ? ' adjusted' : '')}>
                  <span className={'se-name' +(s.wanted !== 'NONE' ? ' prof' : '') + (s.wanted === 'EXPERTISE' ? ' expert' : '')}>
                    <span className="pip" aria-hidden="true" />
                    <span>{name}</span>
                    {s.adjusted && !s.changed && (
                      <i className="se-badge" title={'Ajuste do mestre. Pelas regras: ' + stateName(s.base)}>mestre</i>
                    )}
                  </span>
                  <b className={'se-mod' + (s.modifier !== s.saved ? ' moved' : '')}>
                    {formatModifier(s.modifier)}
                  </b>
                  <div className="se-states" role="radiogroup" aria-label={name}>
                    {STATES.map(st => (
                      <button key={st.id} type="button" role="radio" aria-checked={s.wanted === st.id} title={st.name}
                        className={'se-state s-' + st.id.toLowerCase() + (s.wanted === st.id ? ' on' : '')}
                        disabled={busy} onClick={() => choose(s, st.id)}>
                        {st.short}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="se-restore" disabled={busy || !s.adjusted || draft[s.skill] === 'BASE'}
                    title={s.adjusted ? 'Voltar ao das regras: ' + stateName(s.base) : 'Igual às regras'}
                    aria-label={'Voltar ' + name + ' ao das regras'} onClick={() => restore(s)}>↺</button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {changes.length > 0 && (
        <div className="se-pending" role="status">
          <span className="mlabel first">{changes.length === 1 ? '1 mudança' : changes.length + ' mudanças'} para salvar</span>
          <ul>
            {changes.map(r => (
              <li key={r.skill}>
                <b>{SKILL_NAMES[r.skill] ?? r.skill}</b>: {stateName(r.current)} → {stateName(r.wanted)}
                {draft[r.skill] === 'BASE' && <small> (volta às regras)</small>}
                <em>{formatModifier(r.saved) + ' → ' + formatModifier(r.modifier)}</em>
              </li>
            ))}
          </ul>
          {msg && <div className="err" role="alert">{msg}</div>}
          <div className="lvl-release-actions">
            <button className="btn" type="button" disabled={busy} onClick={save}>SALVAR PERÍCIAS</button>
            <button className="ghost-btn" type="button" disabled={busy} onClick={() => { setDraft({}); setMsg(null) }}>Descartar</button>
          </div>
        </div>
      )}
    </div>
  )
}
