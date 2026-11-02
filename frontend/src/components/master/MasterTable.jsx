import { useCallback, useEffect, useState } from 'react'
import { fetchConditions, fetchTable, setInspiration } from '../../api/master.js'
import { CLASS_NAMES } from '../../data/rules.js'
import { CHARACTERS } from '../../data/characters.js'
import ConditionChips from '../sheet/ConditionChips.jsx'
import ConditionEditor from './ConditionEditor.jsx'
import HpEditor from './HpEditor.jsx'

const POLL_MS = 5000
const artOf = name => CHARACTERS.find(c => c.id === name.trim().toLowerCase())

// Aba Mesa: todo mundo de uma vez durante o combate. Um cartão por personagem com PV, CA, Mana, inspiração,
// testes contra a morte e condições; ações rápidas de dano/cura, inspiração e condições. Atualiza a cada 5 s
// (sem atualizar enquanto um cartão está com as condições abertas, para não pular o que o mestre está mexendo).
export default function MasterTable({ token, onError, onToast }) {
  const [cards, setCards] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [openId, setOpenId] = useState(null)

  const load = useCallback(() => fetchTable(token).then(setCards).catch(onError), [token, onError])

  useEffect(() => {
    load()
    fetchConditions(token).then(setCatalog).catch(onError)
  }, [token, load, onError])

  useEffect(() => {
    if (openId != null) return
    const t = setInterval(() => { if (!document.hidden) load() }, POLL_MS)
    return () => clearInterval(t)
  }, [load, openId])

  // A ação devolve a ficha; o cartão troca só ela (CA e Mana não mudam por essas ações).
  const putCharacter = updated => setCards(list => list.map(c => (c.character.id === updated.id ? { ...c, character: updated } : c)))

  const toggleInspiration = c => {
    setInspiration(token, c.id, !(c.inspiration > 0))
      .then(() => {
        putCharacter({ ...c, inspiration: c.inspiration > 0 ? 0 : 1 })
        onToast(c.inspiration > 0 ? 'Inspiração de ' + c.characterName + ' tirada.' : c.characterName + ' ganhou inspiração.')
      })
      .catch(onError)
  }

  if (!cards) return <p className="muted-note">Carregando a mesa…</p>
  if (cards.length === 0) return <section className="card"><p className="muted-note">Nenhum personagem criado ainda.</p></section>

  return (
    <div className="table-grid">
      {cards.map(({ character: c, armorClass, manaLeft, manaMax }, n) => {
        const art = artOf(c.characterName)
        const down = c.currentHp === 0
        return (
          <section key={c.id} className={'card table-card' + (down ? ' down' : '')} style={{ '--i': n, '--h': art?.hue ?? 42 }}>
            <header className="tc-head">
              <span className="char-face" style={art ? { backgroundImage: `url("${art.img}")`, backgroundPosition: art.pos } : undefined} />
              <span className="char-info">
                <span className="char-name">{c.characterName}</span>
                <span className="char-sub">{CLASS_NAMES[c.characterClass] ?? c.characterClass}{c.subclass && ' · ' + c.subclass} · nível {c.level}</span>
              </span>
              <button type="button" className={'tc-insp' + (c.inspiration > 0 ? ' on' : '')} onClick={() => toggleInspiration(c)}
                title={c.inspiration > 0 ? 'Tirar a inspiração' : 'Dar inspiração'} aria-pressed={c.inspiration > 0}>◆</button>
            </header>

            <div className="tc-stats">
              <span className="tc-stat"><b>{armorClass}</b><small>CA</small></span>
              {manaMax != null && <span className="tc-stat mana"><b>{manaLeft}<i>/{manaMax}</i></b><small>Mana</small></span>}
              <span className="tc-stat"><b>{c.passivePerception}</b><small>Perc. passiva</small></span>
            </div>

            <HpEditor token={token} character={c} onSaved={putCharacter} onError={onError} compact />

            {down && (
              <div className="tc-death" aria-label="Testes contra a morte">
                <span>Testes contra a morte</span>
                <span className="tc-pips">
                  {[0, 1, 2].map(i => <i key={'s' + i} className={'death-pip ok' + (i < (c.deathSuccesses ?? 0) ? ' on' : '')} />)}
                  <em>·</em>
                  {[0, 1, 2].map(i => <i key={'f' + i} className={'death-pip fail' + (i < (c.deathFailures ?? 0) ? ' on' : '')} />)}
                </span>
              </div>
            )}

            <ConditionChips ids={c.conditions} exhaustion={c.exhaustion} catalog={catalog} />
            <button type="button" className="link-btn tc-cond" onClick={() => setOpenId(id => (id === c.id ? null : c.id))} aria-expanded={openId === c.id}>
              {openId === c.id ? 'Fechar condições' : 'Condições'}
            </button>
            {openId === c.id && <ConditionEditor token={token} character={c} catalog={catalog} onSaved={putCharacter} onError={onError} compact />}
          </section>
        )
      })}
    </div>
  )
}
