import { DAMAGE_TYPES, attributeById, critDice, formatModifier, parseDice } from '../../data/rules.js'

// Ataques com arma (contas do back-end): o bônus rola o d20 (com o modo das rolagens e a margem de crítico),
// o dano rola os dados; "Crítico" rola os dados multiplicados e "2 mãos" o dano versátil.
// Embaixo, cada Estilo de Luta que vale para a arma (bônus e dano já somados; o Combatente usa um por vez).
export default function Attacks({ attacks, onRoll, onRollDice }) {
  return (
    <>
      <h3 className="card-title">Ataques <small>clique para rolar</small></h3>
      <ul className="attacks">
        {attacks.map((a, n) => {
          const crit = critDice(a.damage, a.critMultiplier)
          const type = DAMAGE_TYPES[a.damageType]
          const details = [
            attributeById(a.attribute)?.abbr + (a.proficient ? '' : ' · sem proficiência'),
            a.range ? 'Alcance ' + a.range : null,
            a.critRange < 20 || a.critMultiplier > 2 ? `Crítico ${a.critRange < 20 ? a.critRange + '–20 ' : ''}×${a.critMultiplier}` : null,
            a.mastery ? 'Maestria: ' + a.mastery : null,
          ].filter(Boolean)
          return (
            <li key={a.key} className={'attack' + (a.proficient ? '' : ' unprof')} style={{ '--n': n }} title={a.properties ?? undefined}>
              <button type="button" className="attack-hit" onClick={() => onRoll(a.name + ' · ataque', a.attackBonus, a.critRange)}
                aria-label={`Atacar com ${a.name}, ${formatModifier(a.attackBonus)}`}>
                {formatModifier(a.attackBonus)}
              </button>
              <span className="attack-info">
                <span className="attack-name">{a.name}</span>
                <span className="attack-meta">{details.join(' · ')}</span>
              </span>
              <span className="attack-dmg">
                {parseDice(a.damage) ? (
                  <button type="button" className="chip-btn" onClick={() => onRollDice(a.name + ' · dano', a.damage)}>
                    {a.damage}{type && ' ' + type}
                  </button>
                ) : a.damage && <span className="chip-flat">{a.damage}{type && ' ' + type}</span>}
                {a.versatileDamage && (
                  <button type="button" className="chip-btn" title="Dano com as duas mãos" onClick={() => onRollDice(a.name + ' · dano (2 mãos)', a.versatileDamage)}>
                    2 mãos {a.versatileDamage}
                  </button>
                )}
                {crit && (
                  <button type="button" className="chip-btn crit" title={`Crítico: ${crit}`} onClick={() => onRollDice(a.name + ' · crítico', crit)}>
                    Crítico
                  </button>
                )}
              </span>
              {a.styles?.length > 0 && (
                <span className="attack-styles">
                  {a.styles.map(s => (
                    <span key={s.name} className="attack-style" title={s.note ?? undefined}>
                      <em>{s.name}</em>
                      <button type="button" className="chip-btn" onClick={() => onRoll(a.name + ' · ' + s.name, s.attackBonus, a.critRange)}>
                        {formatModifier(s.attackBonus)}
                      </button>
                      {parseDice(s.damage) && (
                        <button type="button" className="chip-btn" onClick={() => onRollDice(a.name + ' · ' + s.name, s.damage)}>{s.damage}</button>
                      )}
                    </span>
                  ))}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
