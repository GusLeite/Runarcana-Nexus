import { useEffect, useState } from 'react'
import { fetchCharacters, fetchConditions, fetchFormulas, setPendingLevels } from '../../api/master.js'
import ConditionEditor from './ConditionEditor.jsx'
import HpEditor from './HpEditor.jsx'
import FormulaEditor from './FormulaEditor.jsx'
import { CLASS_NAMES } from '../../data/rules.js'
import { CHARACTERS } from '../../data/characters.js'

const artOf = name => CHARACTERS.find(c => c.id === name.trim().toLowerCase())

// Aba Fichas do mestre: escolhe o personagem, mexe no que é da mesa (PV, fórmulas, condições) e libera a subida de
// nível. As escolhas do nível (classe, dado de vida, Aprimoramentos, Heranças...) são do jogador, na própria ficha.
export default function MasterSheets({ token, onError, onToast }) {
  const [characters, setCharacters] = useState([])
  const [characterId, setCharacterId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [conditions, setConditionCatalog] = useState(null)
  const [formulas, setFormulaCatalog] = useState(null)

  useEffect(() => {
    fetchConditions(token).then(setConditionCatalog).catch(onError)
    fetchFormulas(token).then(setFormulaCatalog).catch(onError)
    fetchCharacters(token)
      .then(list => {
        setCharacters(list)
        setCharacterId(id => id ?? list[0]?.id ?? null)
      })
      .catch(onError)
  }, [token, onError])

  const character = characters.find(c => c.id === characterId)
  const pending = character?.pendingLevels ?? 0
  const put = updated => setCharacters(list => list.map(c => (c.id === updated.id ? updated : c)))

  useEffect(() => setMsg(null), [characterId])

  const release = async next => {
    setBusy(true)
    setMsg(null)
    try {
      const updated = await setPendingLevels(token, character.id, next)
      put(updated)
      onToast(next > pending
        ? updated.characterName + ' pode subir para o ' + (updated.level + next) + 'º nível.'
        : next === 0 ? 'Subida de nível de ' + updated.characterName + ' cancelada.' : 'Agora são ' + next + ' nível(is) liberado(s).')
    } catch (err) {
      if (err.status === 401) onError(err)
      else setMsg(err.message)
    } finally {
      setBusy(false)
    }
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
              <button key={c.id} type="button" role="radio" aria-checked={c.id === characterId}
                className={'char-chip' + (c.id === characterId ? ' on' : '')} style={{ '--h': art?.hue ?? 42 }}
                onClick={() => setCharacterId(c.id)}>
                <span className="char-face" style={art ? { backgroundImage: `url("${art.img}")`, backgroundPosition: art.pos } : undefined} />
                <span className="char-info">
                  <span className="char-name">{c.characterName}</span>
                  <span className="char-sub">
                    {classesText(c)} · nível {c.level}{c.pendingLevels > 0 && <b className="char-pending"> · +{c.pendingLevels} liberado</b>}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {character && (
        <div className="master-grid">
          {conditions && (
            <section className="card" style={{ '--i': 1 }}>
              <h3 className="card-title">Na mesa <small>{character.characterName}</small></h3>
              <HpEditor token={token} character={character} onError={onError} onSaved={put} />
              {character.crafts?.length > 0 && (
                <>
                  <span className="mlabel">Fórmulas de Ofício</span>
                  <FormulaEditor token={token} character={character} catalog={formulas} onError={onError} onSaved={put} />
                </>
              )}
              <span className="mlabel">Condições</span>
              <ConditionEditor token={token} character={character} catalog={conditions} onError={onError} onSaved={put} />
            </section>
          )}

          <section className="card lvl-release" style={{ '--i': 2 }}>
            <h3 className="card-title">Subida de nível <small>{character.characterName}</small></h3>
            {!character.canLevelUp ? (
              <p className="muted-note">
                {character.level >= 20 ? character.characterName + ' já está no 20º nível.'
                  : 'Esta ficha não foi criada pelo assistente: sem as escolhas da criação, não dá para subir de nível.'}
              </p>
            ) : (
              <>
                <div className="lvl-facts">
                  <div><span className="lvl-k">Nível atual</span><b>{character.level}</b></div>
                  <div><span className="lvl-k">Liberado</span><b>{pending > 0 ? '+' + pending + ' → ' + (character.level + pending) + 'º' : '—'}</b></div>
                </div>
                <p className="muted-note">
                  {pending > 0
                    ? 'Aguardando ' + character.characterName + ' fazer as escolhas na ficha (classe, dado de vida, o que ganha no nível).'
                    : 'Liberar mostra o aviso na ficha do jogador; ele escolhe o que ganha e aplica.'}
                </p>
                {msg && <div className="err" role="alert">{msg}</div>}
                <div className="lvl-release-actions">
                  <button className="btn" type="button" disabled={busy || character.level + pending >= 20} onClick={() => release(pending + 1)}>
                    {pending > 0 ? 'LIBERAR MAIS UM NÍVEL' : 'LIBERAR O ' + (character.level + 1) + 'º NÍVEL'}
                  </button>
                  {pending > 0 && (
                    <button className="ghost-btn" type="button" disabled={busy} onClick={() => release(pending - 1)}>
                      {pending > 1 ? 'Tirar um nível' : 'Cancelar a subida'}
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}

function classesText(c) {
  if (c.classLevels?.length > 1) return c.classLevels.map(l => l.name + ' ' + l.level).join(' / ')
  return CLASS_NAMES[c.characterClass] ?? c.characterClass
}
