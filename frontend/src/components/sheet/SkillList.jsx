import { useState } from 'react'
import { SKILL_NAMES, formatModifier, groupSkills } from '../../data/rules.js'

// Todas as perícias agrupadas pelo atributo; o losango aceso marca proficiência.
export default function SkillList({ skills, onRoll }) {
  const [onlyProficient, setOnlyProficient] = useState(false)
  const visible = onlyProficient ? skills.filter(s => s.proficient) : skills
  const best = Math.max(...skills.map(s => s.modifier))

  return (
    <>
      <div className="card-title skills-title">
        <h3>Perícias</h3>
        <div className="seg" role="group" aria-label="Filtro de perícias">
          <button type="button" className={onlyProficient ? '' : 'on'} aria-pressed={!onlyProficient} onClick={() => setOnlyProficient(false)}>Todas</button>
          <button type="button" className={onlyProficient ? 'on' : ''} aria-pressed={onlyProficient} onClick={() => setOnlyProficient(true)}>Proficientes</button>
        </div>
      </div>
      <div className="skills">
        {groupSkills(visible).map(({ attr, skills: group }) => (
          <div className="skill-group" key={attr.id}>
            <div className="skill-group-name">{attr.name}</div>
            {group.map((s, n) => {
              const name = SKILL_NAMES[s.skill] ?? s.skill
              return (
                <button
                  key={s.skill}
                  type="button"
                  className={'skill' + (s.proficient ? ' prof' : '') + (s.modifier === best ? ' best' : '')}
                  style={{ '--n': n }}
                  onClick={() => onRoll(name, s.modifier)}
                  aria-label={`${name}${s.proficient ? ', proficiente' : ''}, ${formatModifier(s.modifier)}. Rolar.`}
                >
                  <span className="pip" aria-hidden="true" />
                  <span className="skill-name">{name}</span>
                  <span className="skill-mod">{formatModifier(s.modifier)}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
