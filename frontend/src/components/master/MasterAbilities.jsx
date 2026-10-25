import { useEffect, useState } from 'react'
import { createAbility, deleteAbility, fetchAbilities, fetchCharacters } from '../../api/master.js'
import { ABILITY_TYPES, CLASS_NAMES, RECHARGES, parseDice, spellLevelName } from '../../data/rules.js'
import { CHARACTERS } from '../../data/characters.js'
import { AbilityDetail } from '../sheet/AbilitiesTab.jsx'

const EMPTY = {
  name: '', type: 'ABILITY', spellLevel: 1, school: '', castingTime: '', range: '', duration: '',
  components: '', damage: '', maxUses: '', recharge: 'LONG_REST', description: '',
}
const artOf = name => CHARACTERS.find(c => c.id === name.trim().toLowerCase())
const noop = () => {}

// Aba de habilidades do mestre: escolhe o personagem, cadastra com prévia e apaga.
export default function MasterAbilities({ token, onError, onToast }) {
  const [characters, setCharacters] = useState([])
  const [characterId, setCharacterId] = useState(null)
  const [abilities, setAbilities] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    fetchCharacters(token)
      .then(list => {
        setCharacters(list)
        setCharacterId(id => id ?? list[0]?.id ?? null)
      })
      .catch(onError)
  }, [token, onError])

  useEffect(() => {
    if (characterId == null) return
    setAbilities([])
    fetchAbilities(token, characterId).then(setAbilities).catch(onError)
  }, [token, characterId, onError])

  const character = characters.find(c => c.id === characterId)
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const isSpell = form.type === 'SPELL'
  const uses = form.maxUses === '' ? null : Number(form.maxUses)

  // Mesmo formato que o jogador recebe, para a prévia usar o componente da ficha.
  const draft = {
    id: 0,
    name: form.name || 'Nome da habilidade',
    type: form.type,
    spellLevel: isSpell ? Number(form.spellLevel) : null,
    school: form.school || null,
    castingTime: form.castingTime || null,
    range: form.range || null,
    duration: form.duration || null,
    components: form.components || null,
    damage: form.damage.replace(/\s/g, '') || null,
    description: form.description || null,
    maxUses: uses,
    usesLeft: uses,
    recharge: uses ? form.recharge : 'NONE',
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return setMsg('Dê um nome à habilidade.')
    if (form.damage.trim() && !parseDice(form.damage)) return setMsg('O dano deve ser como 2d6 ou 2d6+4.')
    if (uses != null && (!Number.isInteger(uses) || uses < 1)) return setMsg('Os usos devem ser um número maior que 0 (ou vazio para uso livre).')
    setBusy(true)
    setMsg(null)
    try {
      const { id, usesLeft, ...body } = draft
      const created = await createAbility(token, characterId, { ...body, name: form.name.trim(), recharge: uses ? form.recharge : null })
      setAbilities(list => [...list, created])
      setForm(f => ({ ...EMPTY, type: f.type, spellLevel: f.spellLevel }))
      onToast(created.name + ' adicionada a ' + character.characterName + '.')
    } catch (err) {
      if (err.status === 401) onError(err)
      else setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = ability => {
    deleteAbility(token, characterId, ability.id)
      .then(() => { setAbilities(list => list.filter(a => a.id !== ability.id)); onToast(ability.name + ' removida.') })
      .catch(onError)
      .finally(() => setConfirmId(null))
  }

  return (
    <>
      <section className="card pick-card" style={{ '--i': 0 }}>
        <h3 className="card-title">Personagem</h3>
        {characters.length === 0 && <p className="muted-note">Nenhum personagem criado ainda.</p>}
        <div className="char-pick" role="radiogroup" aria-label="Personagem">
          {characters.map(c => {
            const art = artOf(c.characterName)
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={c.id === characterId}
                aria-label={`${c.characterName}, ${CLASS_NAMES[c.characterClass] ?? c.characterClass}, nível ${c.level}`}
                className={'char-chip' + (c.id === characterId ? ' on' : '')}
                style={{ '--h': art?.hue ?? 42 }}
                onClick={() => { setCharacterId(c.id); setConfirmId(null) }}
              >
                <span className="char-face" style={art ? { backgroundImage: `url("${art.img}")`, backgroundPosition: art.pos } : undefined} />
                <span className="char-info">
                  <span className="char-name">{c.characterName}</span>
                  <span className="char-sub">{CLASS_NAMES[c.characterClass] ?? c.characterClass} · nível {c.level}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {character && (
        <div className="master-grid three">
          <section className="card" style={{ '--i': 1 }}>
            <form onSubmit={submit} noValidate>
              <h3 className="card-title">Nova para {character.characterName}</h3>
              <div className="mform">
                <label htmlFor="a-name">Nome</label>
                <input id="a-name" value={form.name} maxLength={120} onChange={e => set('name', e.target.value)} placeholder="Ex.: Seta Estelar" />

                <span className="mlabel">Tipo</span>
                <div className="seg wide-seg" role="radiogroup" aria-label="Tipo">
                  {Object.entries(ABILITY_TYPES).map(([id, t]) => (
                    <button key={id} type="button" role="radio" aria-checked={form.type === id} className={form.type === id ? 'on' : ''} onClick={() => set('type', id)}>
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="mrow">
                  {isSpell && (
                    <div>
                      <label htmlFor="a-lvl">Círculo</label>
                      <select id="a-lvl" value={form.spellLevel} onChange={e => set('spellLevel', e.target.value)}>
                        {Array.from({ length: 10 }, (_, i) => <option key={i} value={i}>{spellLevelName(i)}</option>)}
                      </select>
                    </div>
                  )}
                  {isSpell && (
                    <div>
                      <label htmlFor="a-school">Escola</label>
                      <input id="a-school" value={form.school} onChange={e => set('school', e.target.value)} placeholder="Evocação" />
                    </div>
                  )}
                  <div>
                    <label htmlFor="a-time">Tempo</label>
                    <input id="a-time" value={form.castingTime} onChange={e => set('castingTime', e.target.value)} placeholder="1 ação" />
                  </div>
                  <div>
                    <label htmlFor="a-range">Alcance</label>
                    <input id="a-range" value={form.range} onChange={e => set('range', e.target.value)} placeholder="36 m" />
                  </div>
                  <div>
                    <label htmlFor="a-dur">Duração</label>
                    <input id="a-dur" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="Instantânea" />
                  </div>
                  {isSpell && (
                    <div>
                      <label htmlFor="a-comp">Componentes</label>
                      <input id="a-comp" value={form.components} onChange={e => set('components', e.target.value)} placeholder="V, S, M" />
                    </div>
                  )}
                  <div>
                    <label htmlFor="a-dmg">Dano</label>
                    <input id="a-dmg" value={form.damage} onChange={e => set('damage', e.target.value)} placeholder="2d6+4" />
                  </div>
                  <div>
                    <label htmlFor="a-uses">Usos <small>vazio = livre</small></label>
                    <input id="a-uses" type="number" min="1" value={form.maxUses} onChange={e => set('maxUses', e.target.value)} placeholder="—" />
                  </div>
                  {uses != null && (
                    <div>
                      <label htmlFor="a-rech">Recupera em</label>
                      <select id="a-rech" value={form.recharge} onChange={e => set('recharge', e.target.value)}>
                        {Object.entries(RECHARGES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <label htmlFor="a-desc">Descrição</label>
                <textarea id="a-desc" className="note-body mdesc" value={form.description} maxLength={4000} onChange={e => set('description', e.target.value)} placeholder="O que a habilidade faz." />
              </div>
              {msg && <div className="err" role="alert">{msg}</div>}
              <button className="btn" type="submit" disabled={busy}>{busy ? 'SALVANDO…' : 'ADICIONAR'}</button>
            </form>
          </section>

          <section className="card preview-card" style={{ '--i': 2 }}>
            <h3 className="card-title">Prévia <small>como o jogador vê</small></h3>
            <AbilityDetail ability={draft} onSetUses={noop} onRollDice={noop} busy />
          </section>

          <section className="card" style={{ '--i': 3 }}>
            <h3 className="card-title">De {character.characterName} <small>{abilities.length}</small></h3>
            {abilities.length === 0 && <p className="muted-note">Nenhuma magia ou habilidade ainda.</p>}
            <ul className="docs">
              {abilities.map(a => (
                <li key={a.id} className={'sent-row t-' + a.type.toLowerCase()}>
                  <span className={'abl-icon t-' + a.type.toLowerCase()} aria-hidden="true">
                    <span className="abl-glyph">{a.name.trim().charAt(0).toUpperCase()}</span>
                  </span>
                  <span className="doc-info">
                    <span className="doc-name">{a.name}</span>
                    <span className="doc-meta">
                      {a.type === 'SPELL' ? spellLevelName(a.spellLevel ?? 0) : ABILITY_TYPES[a.type]?.name}
                      {a.damage && ' · ' + a.damage}
                      {a.maxUses != null && ' · ' + a.maxUses + ' usos'}
                    </span>
                  </span>
                  {confirmId === a.id ? (
                    <span className="confirm">
                      <button type="button" className="danger-btn" onClick={() => remove(a)}>Apagar</button>
                      <button type="button" className="ghost-btn small" onClick={() => setConfirmId(null)}>Não</button>
                    </span>
                  ) : (
                    <button type="button" className="ghost-btn small" onClick={() => setConfirmId(a.id)} aria-label={'Apagar ' + a.name}>Apagar</button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  )
}
