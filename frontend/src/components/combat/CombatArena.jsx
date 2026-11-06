import { useEffect, useState } from 'react'
import { HEALTH_TONE, gameTime, nextUp, portraitOf, signed } from '../../data/combat.js'
import ConditionChips from '../sheet/ConditionChips.jsx'

// Trilha de iniciativa do confronto ativo, igual para o mestre e para os jogadores: um "estandarte" por combatente
// na ordem dos turnos, com o retrato, a iniciativa no brasão, a vida (números para o mestre e para os aliados;
// para os jogadores, o inimigo só mostra o estado) e o destaque de quem joga agora e de quem vem a seguir.
// master: liga os controles (iniciativa editável, PV, esconder, derrotar, tirar). selectedId/onSelect: ficha ao lado.
export default function CombatArena({ encounter, master, catalog, selectedId, onSelect, onInitiative, onHp, onToggle, onRemove, onRollMine, rolling }) {
  const order = encounter.order
  const current = order.find(c => c.id === encounter.currentId)
  const next = encounter.currentId != null ? nextUp(order, encounter.currentId) : null
  const pending = order.filter(c => c.initiative == null && !c.defeated).length
  const allies = order.filter(c => c.kind === 'PLAYER')
  const foes = order.filter(c => c.kind === 'ENEMY')
  const standing = list => list.filter(c => !c.defeated && c.health !== 'Caído').length

  return (
    <section className="cb-arena" aria-label={'Confronto ' + encounter.name}>
      <header className="cb-head">
        <span className="cb-crest" aria-hidden="true"><Swords /></span>
        <div className="cb-title">
          <small>{encounter.status === 'ACTIVE' ? 'Confronto em andamento' : encounter.status === 'DRAFT' ? 'Rascunho' : 'Encerrado'}</small>
          <h2>{encounter.name}</h2>
        </div>
        <div className="cb-round" title={'Tempo de jogo: ' + gameTime(encounter.round)}>
          <b>{encounter.round}</b><small>Rodada</small>
        </div>
      </header>

      <div className="cb-sides" aria-label="Forças em campo">
        <span className="cb-side ally"><b>{standing(allies)}</b>/{allies.length} aliados de pé</span>
        <span className="cb-vs">VS</span>
        <span className="cb-side foe"><b>{standing(foes)}</b>/{foes.length} inimigos de pé</span>
      </div>

      <p className={'cb-phase' + (current ? ' live' : '')} role="status">
        {current
          ? <>Vez de <b>{current.name}</b>{next && next.id !== current.id && <> · a seguir: {next.name}</>}</>
          : encounter.currentId != null
            ? 'Vez de alguém nas sombras…'
            : pending
              ? 'Fase de iniciativa: falta' + (pending > 1 ? 'm ' + pending : ' 1') + ' rolar'
              : 'Iniciativas prontas. Aguardando o mestre começar os turnos.'}
      </p>

      <ol className="cb-track">
        {order.map((c, n) => (
          <Slot key={c.id} c={c} n={n} master={master} catalog={catalog}
            current={c.id === encounter.currentId} next={next?.id === c.id && c.id !== encounter.currentId}
            selected={selectedId === c.id} onSelect={onSelect}
            onInitiative={onInitiative} onHp={onHp} onToggle={onToggle} onRemove={onRemove} onRollMine={onRollMine} rolling={rolling} />
        ))}
      </ol>
    </section>
  )
}

function Slot({ c, n, master, catalog, current, next, selected, onSelect, onInitiative, onHp, onToggle, onRemove, onRollMine, rolling }) {
  const art = portraitOf(c)
  const ally = c.kind === 'PLAYER'
  const numbers = c.currentHp != null && c.maxHp != null
  const ratio = numbers ? Math.max(0, Math.min(1, c.currentHp / Math.max(1, c.maxHp))) : null
  const down = c.defeated || c.health === 'Caído'
  const tone = HEALTH_TONE[c.health] ?? 'ok'
  const cls = ['cb-slot', ally ? 'ally' : 'foe', current && 'current', next && 'next', down && 'down', c.hidden && 'hidden', c.mine && 'mine', selected && 'selected']
    .filter(Boolean).join(' ')

  return (
    <li className={cls} style={{ '--i': n, '--h': art.hue ?? (ally ? 170 : 355) }}>
      {current && <span className="cb-flag" aria-hidden="true">VEZ</span>}
      {next && <span className="cb-flag soon" aria-hidden="true">A SEGUIR</span>}
      <span className="cb-pos" aria-label={'Posição ' + (n + 1)}>{n + 1}</span>

      <button type="button" className="cb-face" onClick={onSelect ? () => onSelect(c) : undefined} disabled={!onSelect}
        style={{ backgroundImage: art.bg, backgroundPosition: art.pos }}
        aria-label={onSelect ? 'Ver a ficha de ' + c.name : c.name}>
        {down && <span className="cb-skull" aria-hidden="true">✝</span>}
      </button>

      <div className="cb-main">
        <div className="cb-name">
          <b>{c.name}</b>
          {c.mine && <em className="cb-tag me">você</em>}
          {c.hidden && <em className="cb-tag shade" title="Os jogadores não veem este inimigo">escondido</em>}
          {!c.mine && !c.hidden && <em className={'cb-tag ' + (ally ? 'ally' : 'foe')}>{ally ? 'aliado' : 'inimigo'}</em>}
        </div>

        {numbers ? (
          <div className={'cb-life ' + tone} title={c.health}>
            <span className="cb-bar"><i style={{ width: ratio * 100 + '%' }} />{c.tempHp > 0 && <s style={{ width: Math.min(1, c.tempHp / c.maxHp) * 100 + '%' }} />}</span>
            <span className="cb-hp">{c.currentHp}<small>/{c.maxHp}</small>{c.tempHp > 0 && <em> +{c.tempHp}</em>}</span>
            {c.armorClass != null && <span className="cb-ac" title="Classe de Armadura"><b>{c.armorClass}</b>CA</span>}
          </div>
        ) : (
          <div className={'cb-life vague ' + tone}>
            <span className="cb-bar"><i /></span>
            <span className="cb-state">{c.health}</span>
          </div>
        )}

        {ally && c.health === 'Caído' && (
          <span className="cb-death" aria-label="Testes contra a morte">
            {[0, 1, 2].map(i => <i key={'s' + i} className={'death-pip ok' + (i < (c.deathSuccesses ?? 0) ? ' on' : '')} />)}
            <em>·</em>
            {[0, 1, 2].map(i => <i key={'f' + i} className={'death-pip fail' + (i < (c.deathFailures ?? 0) ? ' on' : '')} />)}
          </span>
        )}
        {ally && <ConditionChips ids={c.conditions ?? []} exhaustion={c.exhaustion ?? 0} catalog={catalog} />}

        {master && (
          <div className="cb-tools">
            <HpQuick c={c} onHp={onHp} />
            {!ally && (
              <button type="button" className={'cb-tool' + (c.hidden ? ' on' : '')} onClick={() => onToggle(c, 'hidden')}
                title={c.hidden ? 'Revelar aos jogadores' : 'Esconder dos jogadores'} aria-pressed={c.hidden}>{c.hidden ? '◌' : '◉'}</button>
            )}
            <button type="button" className={'cb-tool' + (c.defeated ? ' on' : '')} onClick={() => onToggle(c, 'defeated')}
              title={c.defeated ? 'Voltar à luta' : 'Marcar como derrotado (sai dos turnos)'} aria-pressed={c.defeated}>✝</button>
            <button type="button" className="cb-tool danger" onClick={() => onRemove(c)} title="Tirar do confronto">×</button>
          </div>
        )}
      </div>

      <div className="cb-init">
        {master ? (
          <InitInput c={c} onCommit={onInitiative} />
        ) : c.initiative != null ? (
          <span className="cb-init-num">{c.initiative}</span>
        ) : c.mine ? (
          <button type="button" className="cb-roll-mine" onClick={onRollMine} disabled={rolling}>
            {rolling ? '…' : <>ROLAR<small>d20 {signed(c.initiativeBonus ?? 0)}</small></>}
          </button>
        ) : (
          <span className="cb-init-num wait" title="Ainda não rolou">?</span>
        )}
        {c.initiativeD20 != null && (
          <small className={'cb-d20' + (c.initiativeD20 === 20 ? ' crit' : c.initiativeD20 === 1 ? ' fumble' : '')}>
            d20 {c.initiativeD20}{c.initiativeBonus != null && ' ' + signed(c.initiativeBonus)}
          </small>
        )}
        {c.initiative != null && c.initiativeD20 == null && <small className="cb-d20 manual">ajustada</small>}
      </div>
    </li>
  )
}

// Iniciativa editável do mestre: digita e confirma com Enter ou saindo do campo; vazio tira a iniciativa.
function InitInput({ c, onCommit }) {
  const [value, setValue] = useState(c.initiative ?? '')
  useEffect(() => setValue(c.initiative ?? ''), [c.initiative])
  const commit = () => {
    const text = String(value).trim()
    if (text === '' ? c.initiative == null : Number(text) === c.initiative) return
    if (text !== '' && !/^-?\d{1,2}$/.test(text)) { setValue(c.initiative ?? ''); return }
    onCommit(c, text === '' ? null : Number(text))
  }
  return (
    <input className="cb-init-input" inputMode="numeric" value={value} placeholder="?" aria-label={'Iniciativa de ' + c.name}
      onChange={e => setValue(e.target.value)} onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const n = (Number(value) || 0) + (e.key === 'ArrowUp' ? 1 : -1)
          setValue(n)
          onCommit(c, n)
        }
      }} />
  )
}

// Dano/cura rápidos do mestre: digita o valor e escolhe. Personagem gasta os temporários antes (como na Mesa).
function HpQuick({ c, onHp }) {
  const [amount, setAmount] = useState('')
  if (c.currentHp == null) return null
  const go = kind => {
    const n = Number(amount)
    if (!n || n < 0) return
    onHp(c, kind, n)
    setAmount('')
  }
  return (
    <span className="cb-hpq">
      <input inputMode="numeric" value={amount} placeholder="PV" aria-label={'PV de ' + c.name}
        onChange={e => setAmount(e.target.value.replace(/\D/g, '').slice(0, 5))}
        onKeyDown={e => { if (e.key === 'Enter') go(e.shiftKey ? 'heal' : 'damage') }}
        title="Enter: dano · Shift+Enter: cura" />
      <button type="button" className="cb-tool hurt" onClick={() => go('damage')} title="Dano">−</button>
      <button type="button" className="cb-tool heal" onClick={() => go('heal')} title="Cura">+</button>
    </span>
  )
}

export function Swords() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 8 L36 34 L32 38 L6 12 L6 8 Z" fill="currentColor" opacity=".9" />
      <path d="M54 8 L28 34 L32 38 L58 12 L58 8 Z" fill="currentColor" opacity=".9" />
      <path d="M22 40 L30 48 M42 40 L34 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M17 47 L13 51 M47 47 L51 51" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="11" cy="53" r="3.5" fill="currentColor" />
      <circle cx="53" cy="53" r="3.5" fill="currentColor" />
    </svg>
  )
}
