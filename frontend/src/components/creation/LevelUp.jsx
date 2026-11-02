import { useEffect, useMemo, useState } from 'react'
import { ATTRIBUTES, CLASS_NAMES, HERITAGE_LEVELS, heritageChoices, pendingChoices, keepChoices, levelChoices, rollDie } from '../../data/rules.js'
import ChoiceStep from './ChoiceStep.jsx'
import HeritageStep from './HeritageStep.jsx'
import '../../styles/creation.css'
import '../../styles/master.css'

const PREVIEW_DELAY = 220
const EMPTY_LEVEL = { classId: null, subclassId: null, hpRoll: null, choices: {}, heritages: [] }

// Subida de um nível, feita pelo jogador quando o mestre libera: a classe do nível (a mesma ou uma nova,
// multiclasse), o dado de vida (rolado aqui ou digitado), as escolhas do nível e as Heranças dos níveis 5, 9, 13 e 17.
// As contas são do back (onPreview → /character/me/level-up/preview); onApply salva na ficha.
export default function LevelUp({ character, catalog, onPreview, onApply, onApplied, onCancel, onError }) {
  const [draft, setDraft] = useState(EMPTY_LEVEL)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const ownClasses = character.classLevels?.length ? character.classLevels
    : [{ classId: character.characterClass, name: CLASS_NAMES[character.characterClass], level: character.level, subclass: character.subclass }]
  const classId = draft.classId ?? ownClasses[0]?.classId
  const klass = catalog.classes.find(k => k.id === classId)
  const isNew = !!classId && !ownClasses.some(c => c.classId === classId)
  const newLevel = character.level + 1

  const request = useMemo(() => [{ ...draft, classId }], [draft, classId])

  useEffect(() => {
    if (!classId) return
    const t = setTimeout(() => {
      onPreview(request).then(setPreview).catch(onError)
    }, PREVIEW_DELAY)
    return () => clearTimeout(t)
  }, [classId, request, onPreview, onError])

  // As do nível, as das Heranças novas deste nível e as que ficaram pendentes (fonte dominante, Magia Inata no 5º...).
  const choices = useMemo(() => {
    const now = [...levelChoices(preview?.preview?.choices, newLevel), ...heritageChoices(preview?.preview?.choices, draft.heritages)]
    return [...now, ...pendingChoices(preview?.preview?.choices, draft.choices, now)]
  }, [preview, newLevel, draft.heritages, draft.choices])
  // Trocar a classe ou a opção de um recurso tira as escolhas que não existem mais.
  useEffect(() => {
    if (!preview) return
    setDraft(d => {
      const kept = keepChoices(d.choices, choices)
      return Object.keys(kept).length === Object.keys(d.choices).length ? d : { ...d, choices: kept }
    })
  }, [preview, choices])

  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }))
  const pickClass = id => setDraft({ ...EMPTY_LEVEL, classId: id, hpRoll: draft.hpRoll })
  const errors = preview?.preview?.errors ?? []

  const apply = async () => {
    setBusy(true)
    setMsg(null)
    try {
      onApplied(await onApply(request))
    } catch (err) {
      if (err.status === 401) onError(err)
      else setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="master-grid">
      <section className="card lvl-card" style={{ '--i': 1 }}>
        <h3 className="card-title">{newLevel}º nível <small>de {character.characterName}</small></h3>

        <span className="mlabel first">Classe do nível</span>
        <div className="to-pick">
          {ownClasses.map(c => (
            <button key={c.classId} type="button" className={'to-chip' + (c.classId === classId ? ' on' : '')} aria-pressed={c.classId === classId}
              onClick={() => pickClass(c.classId)}>
              {c.name} {c.level} → {c.level + 1}
            </button>
          ))}
        </div>
        <label htmlFor="lvl-multi">Ou uma classe nova (multiclasse)</label>
        <select id="lvl-multi" className="lvl-select" value={isNew ? classId : ''} onChange={e => pickClass(e.target.value || null)}>
          <option value="">—</option>
          {catalog.classes.filter(k => !ownClasses.some(c => c.classId === k.id)).map(k => (
            <option key={k.id} value={k.id}>{k.name}{k.multiclass?.prerequisite ? ' (' + k.multiclass.prerequisite + ')' : ''}</option>
          ))}
        </select>
        {isNew && klass?.subclasses?.length > 0 && (
          <>
            <span className="mlabel">{klass.subclassLabel ?? 'Subclasse'}</span>
            <div className="to-pick">
              {klass.subclasses.map(s => (
                <button key={s.id} type="button" className={'to-chip' + (draft.subclassId === s.id ? ' on' : '')} aria-pressed={draft.subclassId === s.id}
                  onClick={() => set('subclassId', s.id)}>{s.name}</button>
              ))}
            </div>
          </>
        )}

        <span className="mlabel">Dado de vida {klass ? '(1d' + klass.hitDie + ')' : ''}</span>
        <div className="lvl-hp">
          <input type="number" min={1} max={klass?.hitDie} inputMode="numeric" aria-label="Resultado do dado de vida"
            value={draft.hpRoll ?? ''} onChange={e => set('hpRoll', e.target.value === '' ? null : Number(e.target.value))} />
          <button type="button" className="ghost-btn small" disabled={!klass} onClick={() => set('hpRoll', rollDie(klass.hitDie))}>
            Rolar 1d{klass?.hitDie}
          </button>
          <span className="muted-note">Rolado na mesa? Digite o resultado.</span>
        </div>

        <div className="lvl-choices">
          {choices.length > 0 ? (
            <ChoiceStep choices={choices} picks={draft.choices} crafts={catalog.crafts ?? []} resources={catalog.resources ?? []}
              items={catalog.equipment?.items ?? []}
              onChange={(key, list) => setDraft(d => ({ ...d, choices: { ...d.choices, [key]: list } }))} />
          ) : (
            <>
              <h4 className="step-title">Escolhas</h4>
              <p className="muted-note">Nada para escolher neste nível.</p>
            </>
          )}
        </div>

        {HERITAGE_LEVELS.includes(newLevel) && (
          <div className="lvl-heritages">
            <HeritageStep heritages={catalog.heritages ?? []} preview={preview?.preview} picks={draft.heritages}
              onChange={list => set('heritages', list)} />
          </div>
        )}
      </section>

      <section className="card preview-card lvl-summary" style={{ '--i': 2 }}>
        <h3 className="card-title">O que muda</h3>
        {!preview && <p className="muted-note">Calculando…</p>}
        {preview && (
          <>
            <div className="lvl-facts">
              <div><span className="lvl-k">Nível</span><b>{preview.currentLevel} → {preview.newLevel}</b></div>
              <div><span className="lvl-k">PV máximo</span><b>{preview.currentMaxHp} → {preview.newMaxHp}</b>
                <small>{preview.hpGain >= 0 ? '+' : ''}{preview.hpGain} (também no PV atual)</small></div>
              <div><span className="lvl-k">Proficiência</span><b>+{preview.preview.proficiencyBonus}</b></div>
              <div><span className="lvl-k">Classes</span><b>{preview.preview.classLevels.map(c => c.name + ' ' + c.level).join(' / ')}</b></div>
            </div>
            {preview.attributeChanges.length > 0 && (
              <>
                <h4 className="lvl-sub">Atributos</h4>
                <ul className="lvl-list">{preview.attributeChanges.map(a => <li key={a}>{attributeText(a)}</li>)}</ul>
              </>
            )}
            <h4 className="lvl-sub">Novo neste nível</h4>
            {preview.newFeatures.length === 0 && <p className="muted-note">Nenhuma habilidade nova.</p>}
            <ul className="lvl-list">
              {preview.newFeatures.map((f, n) => (
                <li key={f.name + f.source + n} style={{ '--n': n }}>
                  <b>{f.name}</b>{f.uses != null && <span className="lvl-uses"> · {f.uses} uso(s)</span>}
                  <span className="choice-source">{f.source}</span>
                </li>
              ))}
            </ul>
            <p className="muted-note">Usos já gastos continuam gastos; as habilidades cadastradas pelo mestre continuam na ficha.</p>
            {errors.length > 0 && (
              <ul className="lvl-errors" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>
            )}
            {msg && <div className="err" role="alert">{msg}</div>}
            <button className="btn" type="button" disabled={busy || errors.length > 0} onClick={apply}>
              {busy ? 'APLICANDO…' : 'SUBIR PARA O ' + preview.newLevel + 'º NÍVEL'}
            </button>
          </>
        )}
        {onCancel && <button className="ghost-btn lvl-cancel" type="button" onClick={onCancel}>Voltar para a ficha</button>}
      </section>
    </div>
  )
}

// "INT 17 → 19" com o nome do atributo.
function attributeText(change) {
  const [abbr, ...rest] = change.split(' ')
  const attr = ATTRIBUTES.find(a => a.abbr === abbr)
  return (attr ? attr.name : abbr) + ' ' + rest.join(' ')
}
