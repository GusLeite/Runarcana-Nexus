import { useMemo, useState } from 'react'
import { ABILITY_TYPES, RECHARGES, formatModifier, groupAbilities, parseDice, spellLevelName } from '../../data/rules.js'
import AbilityIcon from './AbilityIcon.jsx'

const MANA = 'Pontos de Mana'
const EMPTY = { q: '', type: 'ALL', level: 'ALL', school: '', time: '', prepared: false, damage: false, conc: false, uses: false }
const TYPE_TABS = [['ALL', 'Tudo'], ['SPELL', 'Magias'], ['ABILITY', 'Habilidades'], ['PASSIVE', 'Passivas'], ['HERITAGE', 'Heranças']]

const fold = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const norm = s => fold(s).trim()

function matches(a, f, q) {
  if (f.type !== 'ALL' && a.type !== f.type) return false
  if (f.level !== 'ALL' && !(a.type === 'SPELL' && (a.spellLevel ?? 0) === f.level)) return false
  if (f.school && a.school !== f.school) return false
  if (f.time && norm(a.castingTime) !== f.time) return false
  if (f.prepared && a.prepared === false) return false
  if (f.damage && !a.damage) return false
  if (f.conc && !/concentra/i.test(a.duration ?? '')) return false
  if (f.uses && a.maxUses == null) return false
  return !q || fold(a.name + ' ' + (a.school ?? '') + ' ' + (a.description ?? '')).includes(q)
}

// Aba de magias: um grimório aberto. Na página da esquerda, o índice com os filtros (tipo, círculo, escola,
// tempo de conjuração...); na da direita, a página da magia escolhida. Quem cadastra é o mestre; as magias de
// quem prepara se escolhem no descanso longo. Aqui o jogador gasta usos, descansa, conjura e rola o dano.
export default function AbilitiesTab({ abilities, spellcasting, onSetUses, onRest, onRoll, onRollDice, onCast, busy, prepares }) {
  const [selectedId, setSelectedId] = useState(abilities[0]?.id ?? null)
  const [f, setF] = useState(EMPTY)
  const set = patch => setF(prev => ({ ...prev, ...patch }))

  const q = fold(f.q.trim())
  const shown = useMemo(() => abilities.filter(a => matches(a, f, q)), [abilities, f, q])
  const groups = groupAbilities(shown)
  const selected = shown.find(a => a.id === selectedId) ?? shown[0]
  const page = selected ? shown.indexOf(selected) + 1 : 0

  const hasUses = abilities.some(a => a.maxUses != null)
  const types = new Set(abilities.map(a => a.type))
  const levels = [...new Set(abilities.filter(a => a.type === 'SPELL').map(a => a.spellLevel ?? 0))].sort((a, b) => a - b)
  const schools = [...new Set(abilities.map(a => a.school).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const times = [...new Map(abilities.filter(a => a.castingTime).map(a => [norm(a.castingTime), a.castingTime])).entries()]
  const hasPrep = abilities.some(a => a.prepared != null)
  const preparedCount = abilities.filter(a => a.prepared === true).length
  const filtered = JSON.stringify(f) !== JSON.stringify(EMPTY)

  return (
    <div className="grimoire">
      <div className="card-title abl-title">
        <h3>Grimório <small>{abilities.length} {abilities.length === 1 ? 'página' : 'páginas'}{hasPrep ? ` · ${preparedCount} preparadas` : ''}</small></h3>
        {(hasUses || prepares) && (
          <div className="rest-btns">
            <button type="button" className="ghost-btn small" disabled={busy} onClick={() => onRest('SHORT')} title="Recupera o que volta no descanso curto">
              Descanso curto
            </button>
            <button type="button" className="ghost-btn small" disabled={busy} onClick={() => onRest('LONG')} title={prepares ? 'Recupera todos os usos e abre a escolha das magias preparadas' : 'Recupera todos os usos'}>
              {prepares ? 'Descanso longo · preparar magias' : 'Descanso longo'}
            </button>
          </div>
        )}
      </div>

      {abilities.length === 0 ? (
        <p className="muted-note">Nenhuma magia ou habilidade ainda. Quando o mestre cadastrar, elas aparecem aqui.</p>
      ) : (
        <div className="tome">
          <div className="tome-page left">
            <div className="tome-filters">
              <input className="tome-search" type="search" placeholder="Procurar no grimório…" value={f.q} aria-label="Procurar no grimório"
                onChange={e => set({ q: e.target.value })} />

              {types.size > 1 && (
                <div className="tome-chips" role="group" aria-label="Tipo">
                  {TYPE_TABS.filter(([k]) => k === 'ALL' || types.has(k)).map(([k, label]) => (
                    <button key={k} type="button" className={'tm-chip' + (f.type === k ? ' on' : '')} aria-pressed={f.type === k}
                      onClick={() => set({ type: k, level: k === 'SPELL' || k === 'ALL' ? f.level : 'ALL' })}>{label}</button>
                  ))}
                </div>
              )}

              {levels.length > 0 && f.type !== 'ABILITY' && f.type !== 'PASSIVE' && f.type !== 'HERITAGE' && (
                <div className="tome-chips" role="group" aria-label="Círculo">
                  <button type="button" className={'tm-chip lv' + (f.level === 'ALL' ? ' on' : '')} aria-pressed={f.level === 'ALL'} onClick={() => set({ level: 'ALL' })}>Todos</button>
                  {levels.map(l => (
                    <button key={l} type="button" className={'tm-chip lv' + (f.level === l ? ' on' : '')} aria-pressed={f.level === l}
                      title={spellLevelName(l)} onClick={() => set({ level: f.level === l ? 'ALL' : l })}>{l === 0 ? 'T' : l + 'º'}</button>
                  ))}
                </div>
              )}

              {(schools.length > 1 || times.length > 1) && (
                <div className="tome-selects">
                  {schools.length > 1 && (
                    <select value={f.school} onChange={e => set({ school: e.target.value })} aria-label="Escola">
                      <option value="">Toda escola</option>
                      {schools.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  {times.length > 1 && (
                    <select value={f.time} onChange={e => set({ time: e.target.value })} aria-label="Tempo de conjuração">
                      <option value="">Todo tempo</option>
                      {times.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                    </select>
                  )}
                </div>
              )}

              <div className="tome-chips" role="group" aria-label="Características">
                {hasPrep && <Toggle on={f.prepared} onClick={() => set({ prepared: !f.prepared })}>Preparadas</Toggle>}
                <Toggle on={f.damage} onClick={() => set({ damage: !f.damage })}>Causa dano</Toggle>
                <Toggle on={f.conc} onClick={() => set({ conc: !f.conc })}>Concentração</Toggle>
                {hasUses && <Toggle on={f.uses} onClick={() => set({ uses: !f.uses })}>Com usos</Toggle>}
              </div>

              <div className="tome-count">
                <span>{shown.length} de {abilities.length}</span>
                {filtered && <button type="button" className="link-btn" onClick={() => setF(EMPTY)}>Limpar filtros</button>}
              </div>
            </div>

            <div className="tome-scroll">
              {groups.length === 0 && <p className="muted-note tome-none">Nada no grimório combina com esses filtros.</p>}
              {groups.map(group => (
                <div className="abl-group" key={group.key}>
                  <div className="tome-chapter"><span>{group.title}</span></div>
                  {group.list.map((a, n) => (
                    <div
                      key={a.id}
                      className={'abl-row' + (a.id === selected?.id ? ' on' : '') + ' t-' + a.type.toLowerCase() + (a.prepared === false ? ' unprepared' : '')}
                      style={{ '--n': n }}
                    >
                      <button type="button" className="abl-pick" onClick={() => setSelectedId(a.id)} aria-label={'Abrir ' + a.name} aria-current={a.id === selected?.id}>
                        <AbilityIcon ability={a} badge={a.type === 'SPELL' ? (a.spellLevel ? String(a.spellLevel) : 'T') : null} />
                        <span className="abl-info">
                          <span className="abl-name">{a.name}</span>
                          <span className="abl-meta">{metaLine(a)}{a.prepared != null && <em className={'prep-tag' + (a.prepared ? ' on' : '')}>{a.prepared ? 'preparada' : 'não preparada'}</em>}</span>
                        </span>
                      </button>
                      <div className="abl-actions">
                        {a.damage && parseDice(a.damage) && (
                          <button type="button" className="dmg-btn" onClick={() => onRollDice(a.name, a.damage)} title="Rolar dano">
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

            <div className="tome-legend" aria-hidden="true">
              <span><i className="lg-ability" /> Habilidade</span>
              <span><i className="lg-passive" /> Passiva</span>
              <span><i className="lg-spell" /> Magia</span>
            </div>
          </div>

          <div className="tome-spine" aria-hidden="true" />

          <div className="tome-page right">
            {selected ? (
              <AbilityDetail key={selected.id} ability={selected} onSetUses={onSetUses} onRollDice={onRollDice} busy={busy}
                onRoll={onRoll} cast={onCast && selected.type === 'SPELL' ? { spellcasting, mana: abilities.find(a => a.name === MANA), onCast } : null} />
            ) : (
              <p className="muted-note tome-none">Página em branco.</p>
            )}
            {prepares && <p className="tome-foot-note">As magias preparadas se trocam no descanso longo.</p>}
            {selected && <div className="tome-folio">— {page} —</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ on, onClick, children }) {
  return <button type="button" className={'tm-chip' + (on ? ' on' : '')} aria-pressed={on} onClick={onClick}>{children}</button>
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
export function AbilityDetail({ ability: a, onSetUses, onRollDice, onRoll, cast, busy }) {
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
        <AbilityIcon ability={a} badge={a.type === 'SPELL' ? (a.spellLevel ? String(a.spellLevel) : 'T') : null} big />
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
