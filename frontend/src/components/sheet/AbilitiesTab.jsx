import { useState } from 'react'
import { ABILITY_TYPES, RECHARGES, formatModifier, groupAbilities, parseDice, spellLevelName } from '../../data/rules.js'
import AbilityIcon from './AbilityIcon.jsx'

const KEYS = ['Q', 'W', 'E', 'R']
const MANA = 'Pontos de Mana'

// Tecla no estilo do LoL: habilidades ativas ganham Q/W/E/R na ordem; passivas, P.
export function keysFor(abilities) {
  const map = {}
  let i = 0
  for (const a of abilities) {
    if (a.type === 'PASSIVE') map[a.id] = 'P'
    else if (a.type === 'ABILITY' && i < KEYS.length) map[a.id] = KEYS[i++]
  }
  return map
}

// Aba de magias e habilidades: lista agrupada à esquerda e a dica da habilidade escolhida à direita.
// Quem cadastra é o mestre; aqui o jogador gasta usos, descansa e rola o dano.
export default function AbilitiesTab({ abilities, spellcasting, onSetUses, onRest, onRoll, onRollDice, onCast, busy, prepares }) {
  const [selectedId, setSelectedId] = useState(abilities[0]?.id ?? null)
  const selected = abilities.find(a => a.id === selectedId) ?? abilities[0]
  const keys = keysFor(abilities)
  const groups = groupAbilities(abilities)
  const hasUses = abilities.some(a => a.maxUses != null)

  return (
    <div className="abilities">
      <div className="abl-main">
        <div className="card-title abl-title">
          <h3>Magias e habilidades <small>{abilities.length} no total</small></h3>
          {(hasUses || prepares) && (
            <div className="rest-btns">
              <button type="button" className="ghost-btn small" disabled={busy} onClick={() => onRest('SHORT')} title="Recupera o que volta no descanso curto">
                Descanso curto
              </button>
              <button type="button" className="ghost-btn small" disabled={busy} onClick={() => onRest('LONG')} title={prepares ? 'Recupera todos os usos e troca as magias preparadas' : 'Recupera todos os usos'}>
                Descanso longo
              </button>
            </div>
          )}
        </div>

        {groups.length === 0 && (
          <p className="muted-note">Nenhuma magia ou habilidade ainda. Quando o mestre cadastrar, elas aparecem aqui.</p>
        )}

        {groups.map(group => (
          <div className="abl-group" key={group.key}>
            <div className="skill-group-name">{group.title}</div>
            {group.list.map((a, n) => (
              <div
                key={a.id}
                className={'abl-row' + (a.id === selected?.id ? ' on' : '') + ' t-' + a.type.toLowerCase() + (a.prepared === false ? ' unprepared' : '')}
                style={{ '--n': n }}
                onClick={() => setSelectedId(a.id)}
              >
                <button type="button" className="abl-pick" onClick={() => setSelectedId(a.id)} aria-label={'Ver ' + a.name}>
                  <AbilityIcon ability={a} hotkey={keys[a.id]} />
                  <span className="abl-info">
                    <span className="abl-name">{a.name}</span>
                    <span className="abl-meta">{metaLine(a)}{a.prepared != null && <em className={'prep-tag' + (a.prepared ? ' on' : '')}>{a.prepared ? 'preparada' : 'não preparada'}</em>}</span>
                  </span>
                </button>
                <div className="abl-actions">
                  {a.damage && parseDice(a.damage) && (
                    <button type="button" className="dmg-btn" onClick={e => { e.stopPropagation(); onRollDice(a.name, a.damage) }} title="Rolar dano">
                      {a.damage}
                    </button>
                  )}
                  {a.maxUses != null && <Pips ability={a} onSetUses={onSetUses} disabled={busy} />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="abl-side">
        {selected && (
          <AbilityDetail key={selected.id} ability={selected} hotkey={keys[selected.id]} onSetUses={onSetUses} onRollDice={onRollDice} busy={busy}
            onRoll={onRoll} cast={onCast && selected.type === 'SPELL' ? { spellcasting, mana: abilities.find(a => a.name === MANA), onCast } : null} />
        )}
      </div>
    </div>
  )
}

function metaLine(a) {
  const parts = [a.type === 'SPELL' ? spellLevelName(a.spellLevel ?? 0) : ABILITY_TYPES[a.type]?.name]
  if (a.castingTime) parts.push(a.castingTime)
  if (a.range) parts.push(a.range)
  return parts.join(' · ')
}

// Um losango por uso: aceso = disponível. Clicar num aceso gasta 1 uso; num apagado, recupera 1.
function Pips({ ability, onSetUses, disabled }) {
  const { maxUses, usesLeft } = ability
  return (
    <div className="pips" role="group" aria-label={`Usos: ${usesLeft} de ${maxUses}`} onClick={e => e.stopPropagation()}>
      {Array.from({ length: maxUses }, (_, i) => (
        <button
          key={i}
          type="button"
          className={'use-pip' + (i < usesLeft ? ' on' : '')}
          style={{ '--n': i }}
          disabled={disabled}
          onClick={() => onSetUses(ability, i < usesLeft ? usesLeft - 1 : usesLeft + 1)}
          aria-label={i < usesLeft ? 'Gastar 1 uso' : 'Recuperar 1 uso'}
        />
      ))}
    </div>
  )
}

// Dica no formato da descrição de habilidade do cliente: nome, custo/recarga, detalhes e texto.
export function AbilityDetail({ ability: a, hotkey, onSetUses, onRollDice, onRoll, cast, busy }) {
  const stats = [
    ['Tempo', a.castingTime],
    ['Alcance', a.range],
    ['Duração', a.duration],
    ['Componentes', a.components],
    ['Escola', a.school],
  ].filter(([, v]) => v)

  return (
    <div className={'abl-detail t-' + a.type.toLowerCase()} aria-live="polite">
      <div className="abl-detail-head">
        <AbilityIcon ability={a} hotkey={hotkey} big />
        <div>
          <div className="item-name">{a.name}</div>
          <div className="item-tags">
            <span className="abl-type">{ABILITY_TYPES[a.type]?.name}</span>
            {a.type === 'SPELL' && ' · ' + spellLevelName(a.spellLevel ?? 0)}
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <dl className="abl-stats">
          {stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      )}

      {a.saveDc != null && (
        <div className="spell-dc">
          <span>CD <b>{a.saveDc}</b></span>
          {onRoll ? (
            <button type="button" className="chip-btn" onClick={() => onRoll(a.name + ' · ataque de magia', a.spellAttack)}>Ataque de magia {formatModifier(a.spellAttack)}</button>
          ) : <span>Ataque {formatModifier(a.spellAttack)}</span>}
        </div>
      )}

      {cast && <CastBox spell={a} {...cast} busy={busy} />}

      {a.description && <p className="item-desc pre">{a.description}</p>}

      {(a.damage || a.maxUses != null) && (
        <div className="abl-detail-foot">
          {a.damage && parseDice(a.damage) && (
            <button type="button" className="btn roll-dmg" onClick={() => onRollDice(a.name, a.damage)}>ROLAR {a.damage}</button>
          )}
          {a.maxUses != null && (
            <div className="abl-uses">
              <span>{a.usesLeft} de {a.maxUses} usos · {RECHARGES[a.recharge] ?? ''}</span>
              <button type="button" className="ghost-btn small" disabled={busy || a.usesLeft === 0} onClick={() => onSetUses(a, a.usesLeft - 1)}>
                Usar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Conjurar: escolhe o nível (do nível da magia ao maior que a ficha conjura), mostra o custo em Mana e a Mana que fica.
// Truque não gasta nada; magia com usos próprios gasta o uso no nível dela enquanto houver.
function CastBox({ spell, spellcasting, mana, onCast, busy }) {
  const base = spell.spellLevel ?? 0
  const max = Math.max(base, spellcasting?.maxSpellLevel ?? 0)
  const [level, setLevel] = useState(base)
  if (base === 0) return <div className="cast-box"><span className="muted-note">Truque: conjura sem gastar Mana.</span></div>
  if (spell.prepared === false) return <div className="cast-box"><span className="muted-note">Não preparada: prepare no descanso longo.</span></div>
  const ownUse = level === base && spell.maxUses != null && spell.usesLeft > 0
  const cost = ownUse ? 0 : spellcasting?.manaCost?.[level] ?? null
  const left = mana?.usesLeft ?? 0
  const short = !ownUse && (cost == null || !mana || left < cost)
  const levels = Array.from({ length: max - base + 1 }, (_, i) => base + i)
  return (
    <div className="cast-box">
      {levels.length > 1 && (
        <label className="cast-level">
          Nível
          <select value={level} onChange={e => setLevel(Number(e.target.value))} disabled={busy}>
            {levels.map(l => <option key={l} value={l}>{l}º{spellcasting?.manaCost?.[l] != null ? ' · ' + spellcasting.manaCost[l] + ' Mana' : ''}</option>)}
          </select>
        </label>
      )}
      <span className={'cast-cost' + (short ? ' short' : '')}>
        {ownUse ? 'Usa 1 uso da magia' : mana ? `Custo ${cost ?? '?'} · Mana ${left}/${mana.maxUses}` : 'Sem Pontos de Mana'}
      </span>
      <button type="button" className="btn cast-btn" disabled={busy || short} onClick={() => onCast(spell, level)}>CONJURAR</button>
    </div>
  )
}
