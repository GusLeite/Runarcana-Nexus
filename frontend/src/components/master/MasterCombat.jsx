import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addCombatant, createEncounter, createEnemy, deleteEncounter, deleteEnemy, endEncounter, fetchEncounters, fetchEnemies,
  passTurn, removeCombatant, resetEncounter, rollInitiatives, startEncounter, updateCombatant, updateEnemy,
} from '../../api/combat.js'
import { fetchCharacters, setHpFor } from '../../api/master.js'
import { fetchConditions } from '../../api/character.js'
import { serverRoll } from '../../api/rolls.js'
import useActiveCombat from '../../hooks/useActiveCombat.js'
import { applyHp, gameTime, mod, parseAttacks, portraitOf, signed } from '../../data/combat.js'
import { fileToIcon, isIconLink } from '../../utils/iconImage.js'
import { play } from '../../audio/engine.js'
import CombatArena from '../combat/CombatArena.jsx'
import CombatIntro from '../combat/CombatIntro.jsx'
import TurnBanner from '../combat/TurnBanner.jsx'
import DiceRoll from '../sheet/DiceRoll.jsx'
import '../../styles/combat.css'

const ATTRS = [['str', 'FOR'], ['dex', 'DES'], ['con', 'CON'], ['intel', 'INT'], ['wis', 'SAB'], ['cha', 'CAR']]
const EMPTY = { name: '', image: '', maxHp: '10', armorClass: '10', initiativeBonus: '0', speed: '9 m', str: '10', dex: '10', con: '10', intel: '10', wis: '10', cha: '10', attacks: '', notes: '' }
const toDraft = e => Object.fromEntries(Object.keys(EMPTY).map(k => [k, e[k] == null ? '' : String(e[k])]))
const toBody = d => ({
  ...d,
  image: d.image || null,
  ...Object.fromEntries(['maxHp', 'armorClass', 'initiativeBonus', ...ATTRS.map(a => a[0])].map(k => [k, d[k] === '' ? null : Number(d[k])])),
})

// Aba COMBATE do mestre. Em cima, o confronto ativo (trilha de iniciativa, turnos, PV, reforços, ficha do inimigo e
// rolagens atrás do escudo); embaixo, o bestiário (fichas reaproveitáveis com retrato enviado ou por link) e a
// montagem de confrontos (quantos de cada inimigo e quais personagens), com ATIVAR, que prende a tela dos jogadores.
export default function MasterCombat({ token, onError, onToast }) {
  const [enemies, setEnemies] = useState(null)
  const [encounters, setEncounters] = useState([])
  const [characters, setCharacters] = useState([])
  const [catalog, setCatalog] = useState(null)
  const [active, putActive, reloadActive] = useActiveCombat(token)
  const [intro, setIntro] = useState(null)
  const [selected, setSelected] = useState(null)
  const [roll, setRoll] = useState(null)
  const [busy, setBusy] = useState(false)

  const loadEncounters = useCallback(() => fetchEncounters(token).then(setEncounters).catch(onError), [token, onError])
  useEffect(() => {
    fetchEnemies(token).then(setEnemies).catch(onError)
    fetchCharacters(token).then(setCharacters).catch(onError)
    fetchConditions(token).then(setCatalog).catch(() => {})
    loadEncounters()
  }, [token, onError, loadEncounters])

  // A lista de confrontos acompanha o ativo (abrir, encerrar, revisões).
  const activeRev = active ? active.id + ':' + active.status + ':' + active.revision : 'none'
  useEffect(() => { loadEncounters() }, [activeRev, loadEncounters])

  // Ação no confronto: o back devolve a visão nova (ou { encounter, ... }).
  const act = useCallback((call, done) => {
    setBusy(true)
    return call()
      .then(res => {
        const view = res?.order ? res : res?.encounter
        if (view?.status === 'ACTIVE') putActive(view)
        else if (view) reloadActive()
        done?.(res)
        return res
      })
      .catch(err => { onError(err); throw err })
      .finally(() => setBusy(false))
  }, [putActive, reloadActive, onError])

  const start = enc => act(() => startEncounter(token, enc.id), view => {
    setSelected(null)
    setIntro(view)
    onToast('Confronto ativado: a tela dos jogadores foi para o COMBATE.')
  }).catch(() => {})

  const create = (body, andStart) => act(() => createEncounter(token, body), view => {
    onToast('Confronto "' + view.name + '" montado.')
    loadEncounters()
    if (andStart) start(view)
  }).catch(() => {})

  const id = active?.id
  const onInitiative = (c, value) => act(() => updateCombatant(token, id, c.id, value == null ? { clearInitiative: true } : { initiative: value })).catch(() => {})
  const onToggle = (c, field) => act(() => updateCombatant(token, id, c.id, { [field]: !c[field] })).catch(() => {})
  const onRemove = c => act(() => removeCombatant(token, id, c.id), () => onToast(c.name + ' saiu do confronto.')).catch(() => {})
  const onHp = (c, kind, amount) => {
    play(kind === 'heal' ? 'heal' : 'damage')
    if (c.kind === 'PLAYER') {
      const next = applyHp({ currentHp: c.currentHp, maxHp: c.maxHp, tempHp: c.tempHp ?? 0 }, kind, amount)
      setHpFor(token, c.characterId, next.currentHp, next.tempHp).then(reloadActive).catch(onError)
    } else {
      const next = kind === 'heal' ? Math.min(c.maxHp, c.currentHp + amount) : Math.max(0, c.currentHp - amount)
      act(() => updateCombatant(token, id, c.id, { currentHp: next }), () => {
        if (next === 0 && c.currentHp > 0) onToast(c.name + ' foi derrotado!')
      }).catch(() => {})
    }
  }

  const rollFor = who => act(() => rollInitiatives(token, id, who), res => {
    play('rattle')
    const n = res.rolled.length
    onToast(n ? 'Iniciativa rolada para ' + n + (n > 1 ? ' combatentes.' : ' combatente.') : 'Ninguém para rolar.')
  }).catch(() => {})

  const turn = step => act(() => passTurn(token, id, step)).catch(() => {})

  const [ending, setEnding] = useState(false)
  useEffect(() => {
    if (!ending) return undefined
    const t = setTimeout(() => setEnding(false), 4000)
    return () => clearTimeout(t)
  }, [ending])
  const end = () => {
    if (!ending) { setEnding(true); return }
    setEnding(false)
    act(() => endEncounter(token, id), () => { play('victory'); onToast('Confronto encerrado. Os jogadores voltaram à ficha.') }).catch(() => {})
  }

  // Atalhos durante a luta: N (ou →) passa o turno, B (ou ←) volta. Fora de campos de texto.
  useEffect(() => {
    if (!active) return undefined
    const key = e => {
      if (e.target.closest('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') { e.preventDefault(); turn(1) }
      if (e.key === 'b' || e.key === 'B' || e.key === 'ArrowLeft') { e.preventDefault(); turn(-1) }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  const selectedCombatant = active?.order.find(c => c.id === selected)
  const sheet = selectedCombatant?.enemyId != null ? enemies?.find(e => e.id === selectedCombatant.enemyId) : null
  const closeIntro = useCallback(() => setIntro(null), [])
  const closeRoll = useCallback(() => setRoll(null), [])
  const behindShield = (label, body) => serverRoll(token, { label, secret: true, ...body }).then(setRoll).catch(onError)

  return (
    <div className="cb-master">
      {active && (
        <div className="cb-live">
          <CombatArena encounter={active} master catalog={catalog} selectedId={selected} onSelect={c => setSelected(s => (s === c.id ? null : c.id))}
            onInitiative={onInitiative} onHp={onHp} onToggle={onToggle} onRemove={onRemove} />
          <aside className="cb-side-col">
            <section className="card cb-control">
              <div className="card-title"><h3>Comando</h3><small className="muted-note">{gameTime(active.round)} de jogo</small></div>
              <p className="cb-label">Iniciativa</p>
              <div className="seg cb-seg" role="group" aria-label="Rolar iniciativa">
                <button type="button" disabled={busy} onClick={() => rollFor('ENEMIES')}>Inimigos</button>
                <button type="button" disabled={busy} onClick={() => rollFor('MISSING')}>Quem falta</button>
                <button type="button" disabled={busy} onClick={() => rollFor('ALL')}>Todos</button>
              </div>
              <p className="muted-note cb-hint">Os jogadores podem rolar a própria na tela deles. Clique no número para ajustar (↑ ↓ mudam de 1 em 1).</p>
              <p className="cb-label">Turnos</p>
              <div className="cb-turns">
                <button type="button" className="ghost-btn" disabled={busy || active.currentId == null} onClick={() => turn(-1)} title="Voltar um turno (B)">◀</button>
                <button type="button" className="btn cb-next" disabled={busy} onClick={() => turn(1)} title="Atalho: N">
                  {active.currentId == null ? 'COMEÇAR OS TURNOS' : 'PRÓXIMO TURNO ▶'}
                </button>
              </div>
              <Reinforcements enemies={enemies ?? []} characters={characters} active={active} busy={busy}
                onAdd={body => act(() => addCombatant(token, id, body), () => onToast(body.characterId ? 'Personagem entrou na luta.' : 'Reforços chegaram.')).catch(() => {})} />
              <button type="button" className={'cb-end' + (ending ? ' armed' : '')} onClick={end} disabled={busy}>
                {ending ? 'CONFIRMAR: ENCERRAR' : 'ENCERRAR CONFRONTO'}
              </button>
            </section>
            {selectedCombatant && (
              <EnemySheet combatant={selectedCombatant} sheet={sheet} onClose={() => setSelected(null)} onRoll={behindShield} />
            )}
          </aside>
        </div>
      )}

      <div className="cb-prep">
        <Bestiary token={token} enemies={enemies} setEnemies={setEnemies} onError={onError} onToast={onToast} />
        <div className="cb-prep-col">
          <Builder enemies={enemies ?? []} characters={characters} busy={busy} onCreate={create} hasActive={!!active} />
          <EncounterList encounters={encounters} busy={busy} onStart={start}
            onReset={enc => act(() => resetEncounter(token, enc.id), () => { loadEncounters(); onToast('Confronto pronto para recomeçar.') }).catch(() => {})}
            onDelete={enc => deleteEncounter(token, enc.id).then(() => { loadEncounters(); reloadActive(); onToast('Confronto apagado.') }).catch(onError)} />
        </div>
      </div>

      {intro && <CombatIntro encounter={intro} onDone={closeIntro} />}
      {active && !intro && <TurnBanner encounter={active} />}
      <DiceRoll roll={roll} onClose={closeRoll} />
    </div>
  )
}

// Ficha do inimigo escolhido na trilha: atributos, ataques com rolagem atrás do escudo e as notas do mestre.
function EnemySheet({ combatant, sheet, onClose, onRoll }) {
  const art = portraitOf(combatant)
  const attacks = parseAttacks(sheet?.attacks)
  return (
    <section className="card cb-sheet">
      <header className="cb-sheet-head">
        <span className="cb-sheet-face" style={{ backgroundImage: art.bg, backgroundPosition: art.pos }} />
        <div>
          <h3>{combatant.name}</h3>
          <small>{combatant.kind === 'PLAYER' ? 'Personagem' : sheet ? 'Ficha: ' + sheet.name : 'Ficha apagada do bestiário'}</small>
        </div>
        <button type="button" className="map-call-close" onClick={onClose} aria-label="Fechar a ficha">×</button>
      </header>
      <div className="cb-sheet-stats">
        <span><b>{combatant.currentHp ?? '—'}</b>/{combatant.maxHp ?? '—'}<small>PV</small></span>
        <span><b>{combatant.armorClass ?? '—'}</b><small>CA</small></span>
        <span><b>{signed(combatant.initiativeBonus ?? 0)}</b><small>Iniciativa</small></span>
        {sheet?.speed && <span><b>{sheet.speed}</b><small>Desloc.</small></span>}
      </div>
      {sheet && (
        <>
          <ul className="cb-attrs">
            {ATTRS.map(([k, label]) => (
              <li key={k}>
                <button type="button" onClick={() => onRoll(combatant.name + ': ' + label, { kind: 'CHECK', mod: mod(sheet[k]) })} title={'Rolar ' + label + ' atrás do escudo'}>
                  <small>{label}</small><b>{signed(mod(sheet[k]))}</b><i>{sheet[k]}</i>
                </button>
              </li>
            ))}
          </ul>
          {attacks.length > 0 && (
            <ul className="cb-attacks">
              {attacks.map((a, i) => (
                <li key={i}>
                  <span>{a.line}</span>
                  {a.hit != null && <button type="button" className="cb-tool" onClick={() => onRoll(combatant.name + ': ataque', { kind: 'CHECK', mod: a.hit })} title="Rolar o ataque atrás do escudo">⚔ {signed(a.hit)}</button>}
                  {a.damage && <button type="button" className="cb-tool" onClick={() => onRoll(combatant.name + ': dano', { kind: 'DICE', expr: a.damage })} title="Rolar o dano atrás do escudo">✦ {a.damage}</button>}
                </li>
              ))}
            </ul>
          )}
          {sheet.notes && <p className="cb-notes"><b>Notas do mestre</b>{sheet.notes}</p>}
        </>
      )}
      <p className="muted-note cb-hint">Rolagens daqui ficam atrás do escudo: os jogadores só veem que o mestre rolou.</p>
    </section>
  )
}

// Reforços no meio da luta: mais inimigos do bestiário (de surpresa, escondidos, se quiser) ou um personagem que chegou.
function Reinforcements({ enemies, characters, active, busy, onAdd }) {
  const [enemyId, setEnemyId] = useState('')
  const [count, setCount] = useState(1)
  const [hidden, setHidden] = useState(false)
  const outside = characters.filter(ch => !active.order.some(c => c.characterId === ch.id))
  return (
    <details className="cb-reinforce">
      <summary>Reforços</summary>
      <div className="cb-reinforce-row">
        <select value={enemyId} onChange={e => setEnemyId(e.target.value)} aria-label="Inimigo">
          <option value="">Inimigo do bestiário…</option>
          {enemies.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="number" min="1" max="20" value={count} onChange={e => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} aria-label="Quantos" />
      </div>
      <label className="cb-check"><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} /> Escondidos (emboscada)</label>
      <button type="button" className="ghost-btn" disabled={busy || !enemyId} onClick={() => onAdd({ enemyId: Number(enemyId), count, hidden })}>Trazer para a luta</button>
      {outside.length > 0 && (
        <div className="cb-chips">
          {outside.map(ch => <button key={ch.id} type="button" className="chip" disabled={busy} onClick={() => onAdd({ characterId: ch.id })}>+ {ch.characterName}</button>)}
        </div>
      )}
    </details>
  )
}

// Bestiário: lista de fichas e o formulário (nova, editar, duplicar, apagar).
function Bestiary({ token, enemies, setEnemies, onError, onToast }) {
  const [editing, setEditing] = useState(null) // null | { id?, draft }
  const [query, setQuery] = useState('')
  const list = useMemo(() => (enemies ?? []).filter(e => e.name.toLowerCase().includes(query.trim().toLowerCase())), [enemies, query])

  const save = draft => {
    const body = toBody(draft)
    const call = editing.id ? updateEnemy(token, editing.id, body) : createEnemy(token, body)
    return call.then(saved => {
      setEnemies(all => {
        const rest = (all ?? []).filter(e => e.id !== saved.id)
        return [...rest, saved].sort((a, b) => a.name.localeCompare(b.name))
      })
      setEditing(null)
      play('confirm')
      onToast(saved.name + (editing.id ? ' salvo.' : ' entrou no bestiário.'))
    }).catch(onError)
  }
  const remove = enemy => deleteEnemy(token, enemy.id).then(() => {
    setEnemies(all => all.filter(e => e.id !== enemy.id))
    setEditing(null)
    onToast(enemy.name + ' saiu do bestiário.')
  }).catch(onError)

  return (
    <section className="card cb-bestiary">
      <div className="card-title">
        <h3>Bestiário</h3>
        <button type="button" className="btn" onClick={() => setEditing({ draft: { ...EMPTY } })}>+ NOVO INIMIGO</button>
      </div>
      {editing && (
        <EnemyForm key={editing.id ?? 'new'} initial={editing.draft} isNew={!editing.id} onSave={save} onCancel={() => setEditing(null)}
          onDelete={editing.id ? () => remove(enemies.find(e => e.id === editing.id)) : null} />
      )}
      {enemies && enemies.length > 4 && (
        <input className="cb-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar no bestiário…" aria-label="Buscar inimigo" />
      )}
      {!enemies ? <p className="muted-note">Carregando…</p> : enemies.length === 0 ? (
        <p className="muted-note">Nenhum inimigo ainda. Crie a primeira ficha: nome, retrato, PV, CA e iniciativa bastam.</p>
      ) : (
        <ul className="cb-beasts">
          {list.map(e => {
            const art = portraitOf({ kind: 'ENEMY', name: e.name, image: e.image })
            return (
              <li key={e.id}>
                <span className="cb-beast-face" style={{ backgroundImage: art.bg, backgroundPosition: art.pos }} />
                <span className="cb-beast-info">
                  <b>{e.name}</b>
                  <small>PV {e.maxHp} · CA {e.armorClass} · Inic. {signed(e.initiativeBonus)}</small>
                </span>
                <button type="button" className="link-btn" onClick={() => setEditing({ id: e.id, draft: toDraft(e) })}>Editar</button>
                <button type="button" className="link-btn" onClick={() => setEditing({ draft: { ...toDraft(e), name: e.name + ' (cópia)' } })}>Duplicar</button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function EnemyForm({ initial, isNew, onSave, onCancel, onDelete }) {
  const [draft, setDraft] = useState(initial)
  const [imageError, setImageError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))
  const uploaded = draft.image.startsWith('data:')
  const art = portraitOf({ kind: 'ENEMY', name: draft.name || '?', image: draft.image && (uploaded || isIconLink(draft.image)) ? draft.image : null })
  const fileRef = useRef(null)

  const chooseFile = file => {
    if (!file) return
    setImageError(null)
    fileToIcon(file, 384).then(img => set('image', img)).catch(err => setImageError(err.message))
  }
  const submit = e => {
    e.preventDefault()
    if (!draft.name.trim()) return setImageError('Dê um nome ao inimigo.')
    setSaving(true)
    onSave(draft).finally(() => setSaving(false))
  }

  return (
    <form className="cb-form" onSubmit={submit}>
      <div className="cb-form-top">
        <button type="button" className="cb-form-face" style={{ backgroundImage: art.bg, backgroundPosition: art.pos }}
          onClick={() => fileRef.current?.click()} title="Enviar retrato" aria-label="Enviar retrato">
          <span>{draft.image ? 'Trocar' : 'Enviar retrato'}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e => { chooseFile(e.target.files[0]); e.target.value = '' }} />
        <div className="cb-form-id">
          <label className="mlabel" htmlFor="cb-name">Nome</label>
          <input id="cb-name" value={draft.name} maxLength={80} onChange={e => set('name', e.target.value)} placeholder="Ex.: Lobo de Freljord" autoFocus />
          <label className="mlabel" htmlFor="cb-link">Link da imagem</label>
          <input id="cb-link" value={uploaded ? '' : draft.image} disabled={uploaded} maxLength={1000}
            placeholder={uploaded ? 'Imagem enviada (tire para usar um link)' : 'https://…'} onChange={e => set('image', e.target.value.trim())} />
          {draft.image && <button type="button" className="link-btn danger" onClick={() => set('image', '')}>Tirar imagem</button>}
          {!uploaded && draft.image && !isIconLink(draft.image) && <p className="err">O link deve começar com http:// ou https://.</p>}
          {imageError && <p className="err">{imageError}</p>}
        </div>
      </div>
      <div className="cb-form-nums">
        <Num label="PV" value={draft.maxHp} onChange={v => set('maxHp', v)} />
        <Num label="CA" value={draft.armorClass} onChange={v => set('armorClass', v)} />
        <Num label="Iniciativa" value={draft.initiativeBonus} onChange={v => set('initiativeBonus', v)} signedNum />
        <label className="cb-num wide"><small>Deslocamento</small><input value={draft.speed} maxLength={60} onChange={e => set('speed', e.target.value)} /></label>
      </div>
      <div className="cb-form-attrs">
        {ATTRS.map(([k, label]) => (
          <label key={k} className="cb-num"><small>{label} <i>{draft[k] !== '' && signed(mod(Number(draft[k])))}</i></small>
            <input inputMode="numeric" value={draft[k]} onChange={e => set(k, e.target.value.replace(/\D/g, '').slice(0, 2))} />
          </label>
        ))}
      </div>
      <label className="mlabel" htmlFor="cb-attacks">Ataques e habilidades <small>uma por linha; "+4" e "2d6+2" viram botões de rolar</small></label>
      <textarea id="cb-attacks" rows={3} maxLength={4000} value={draft.attacks} onChange={e => set('attacks', e.target.value)} placeholder={'Mordida +4, 2d4+2 perfurante\nUivo: aliados a 9 m ganham vantagem'} />
      <label className="mlabel" htmlFor="cb-notes">Notas do mestre <small>só você vê</small></label>
      <textarea id="cb-notes" rows={2} maxLength={4000} value={draft.notes} onChange={e => set('notes', e.target.value)} placeholder="Táticas, fraquezas, o que carrega…" />
      <div className="cb-form-actions">
        <button type="submit" className="btn" disabled={saving}>{isNew ? 'CRIAR FICHA' : 'SALVAR'}</button>
        <button type="button" className="ghost-btn" onClick={onCancel}>Cancelar</button>
        {onDelete && (
          <button type="button" className={'link-btn danger' + (confirm ? ' armed' : '')} onClick={() => (confirm ? onDelete() : setConfirm(true))}>
            {confirm ? 'Confirmar: apagar ficha' : 'Apagar ficha'}
          </button>
        )}
      </div>
    </form>
  )
}

function Num({ label, value, onChange, signedNum }) {
  return (
    <label className="cb-num"><small>{label}</small>
      <input inputMode="numeric" value={value} onChange={e => onChange(e.target.value.replace(signedNum ? /[^\d-]/g : /\D/g, '').slice(0, 6))} />
    </label>
  )
}

// Montar o confronto: nome, quantos de cada ficha e quais personagens entram (todos marcados de início).
function Builder({ enemies, characters, busy, onCreate, hasActive }) {
  const [name, setName] = useState('')
  const [counts, setCounts] = useState({})
  const [out, setOut] = useState(() => new Set())
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  const picks = Object.entries(counts).filter(([, n]) => n > 0).map(([enemyId, count]) => ({ enemyId: Number(enemyId), count }))
  const players = characters.filter(c => !out.has(c.id))
  const bump = (id, d) => setCounts(c => ({ ...c, [id]: Math.max(0, Math.min(20, (c[id] ?? 0) + d)) }))
  const submit = andStart => {
    onCreate({ name: name.trim() || 'Confronto', enemies: picks, characterIds: players.map(c => c.id) }, andStart)
    setName('')
    setCounts({})
  }

  return (
    <section className="card cb-builder">
      <div className="card-title"><h3>Montar confronto</h3></div>
      <input value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Nome (ex.: Emboscada na Ponte de Ferro)" aria-label="Nome do confronto" />
      <p className="cb-label">Inimigos <small>{total ? total + ' no total' : 'escolha no bestiário'}</small></p>
      {enemies.length === 0 ? <p className="muted-note">Crie fichas no bestiário primeiro.</p> : (
        <ul className="cb-picks">
          {enemies.map(e => {
            const n = counts[e.id] ?? 0
            const art = portraitOf({ kind: 'ENEMY', name: e.name, image: e.image })
            return (
              <li key={e.id} className={n ? 'on' : ''}>
                <span className="cb-beast-face sm" style={{ backgroundImage: art.bg, backgroundPosition: art.pos }} />
                <span className="cb-pick-name">{e.name}</span>
                <span className="cb-stepper">
                  <button type="button" onClick={() => bump(e.id, -1)} disabled={!n} aria-label={'Menos ' + e.name}>−</button>
                  <b>{n}</b>
                  <button type="button" onClick={() => bump(e.id, 1)} aria-label={'Mais ' + e.name}>+</button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <p className="cb-label">Personagens <small>{players.length} de {characters.length}</small></p>
      <div className="cb-chips">
        {characters.map(c => (
          <button key={c.id} type="button" className={'chip' + (out.has(c.id) ? '' : ' on')} aria-pressed={!out.has(c.id)}
            onClick={() => setOut(s => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n })}>
            {c.characterName}
          </button>
        ))}
      </div>
      <div className="cb-form-actions">
        <button type="button" className="btn cb-go" disabled={busy || (!total && !players.length)} onClick={() => submit(true)}
          title={hasActive ? 'Encerra o confronto ativo e começa este' : 'Monta e já leva os jogadores para o combate'}>⚔ MONTAR E ATIVAR</button>
        <button type="button" className="ghost-btn" disabled={busy || (!total && !players.length)} onClick={() => submit(false)}>Só montar</button>
      </div>
    </section>
  )
}

const STATUS = { DRAFT: 'Pronto', ACTIVE: 'Em andamento', ENDED: 'Encerrado' }

function EncounterList({ encounters, busy, onStart, onReset, onDelete }) {
  const [armed, setArmed] = useState(null)
  if (!encounters.length) return null
  return (
    <section className="card cb-encounters">
      <div className="card-title"><h3>Confrontos</h3></div>
      <ul>
        {encounters.map(enc => {
          const foes = enc.order.filter(c => c.kind === 'ENEMY').length
          const allies = enc.order.length - foes
          return (
            <li key={enc.id} className={'cb-enc ' + enc.status.toLowerCase()}>
              <span className="cb-enc-faces" aria-hidden="true">
                {enc.order.filter(c => c.kind === 'ENEMY').slice(0, 4).map(c => {
                  const art = portraitOf(c)
                  return <i key={c.id} style={{ backgroundImage: art.bg, backgroundPosition: art.pos }} />
                })}
              </span>
              <span className="cb-enc-info">
                <b>{enc.name}</b>
                <small>{STATUS[enc.status]} · {foes} inimigo{foes === 1 ? '' : 's'} · {allies} personage{allies === 1 ? 'm' : 'ns'}{enc.status !== 'DRAFT' && ' · ' + enc.round + 'ª rodada'}</small>
              </span>
              {enc.status === 'DRAFT' && <button type="button" className="btn" disabled={busy} onClick={() => onStart(enc)}>ATIVAR</button>}
              {enc.status === 'ENDED' && <button type="button" className="ghost-btn" disabled={busy} onClick={() => onReset(enc)}>Recomeçar</button>}
              {enc.status !== 'ACTIVE' && (
                <button type="button" className="link-btn danger" onClick={() => (armed === enc.id ? (setArmed(null), onDelete(enc)) : setArmed(enc.id))}>
                  {armed === enc.id ? 'Confirmar' : 'Apagar'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
