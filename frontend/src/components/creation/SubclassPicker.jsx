import { useState } from 'react'
import { grantLabel, levelGrantsText, visibleGrants } from '../../data/rules.js'
import { subclassSigil } from '../../data/subclassArt.js'
import '../../styles/subclass.css'

// Sigilo desenhado com traços (viewBox 100×100); o mesmo da grade, do detalhe e do título dos ganhos.
export function SubclassSigil({ klass, sub, className = '' }) {
  return (
    <svg className={'sub-sigil ' + className} viewBox="0 0 100 100" aria-hidden="true">
      {(subclassSigil(klass, sub) ?? []).map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

// Escolha da subclasse (rito, glifo, trilha…): uma grade de símbolos e, embaixo, o detalhe da opção sob o mouse ou o foco
// (ou da escolhida, ou da primeira, se nada estiver sob ele): descrição, o que concede e os ganhos por nível. Clicar escolhe.
export default function SubclassPicker({ klass, title, subclasses, selected, onPick, crafts, equipment = [] }) {
  const [peek, setPeek] = useState(null)
  const shown = subclasses.find(s => s.id === (peek ?? selected)) ?? subclasses[0]
  const grants = visibleGrants(shown?.grants)
  const levels = [...(shown?.levels ?? [])].sort((a, b) => a.level - b.level).filter(l => visibleGrants(l.grants).length > 0)

  return (
    <div className="subpick">
      <div className="subgrid" role="radiogroup" aria-label={title} onMouseLeave={() => setPeek(null)}>
        {subclasses.map((s, n) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === selected}
            className={'subtile' + (s.id === selected ? ' on' : '') + (s.id === shown?.id ? ' peek' : '')}
            style={{ '--n': n }}
            onClick={() => onPick(s.id)}
            onMouseEnter={() => setPeek(s.id)}
            onFocus={() => setPeek(s.id)}
            onBlur={() => setPeek(null)}
          >
            <SubclassSigil klass={klass} sub={s} />
            <span className="subtile-name">{s.name}</span>
            {s.id === selected && <span className="subtile-check">✓</span>}
          </button>
        ))}
      </div>

      <div className="subdetail" aria-live="polite">
        {shown ? (
          <div key={shown.id} className="subdetail-in">
            <div className="subdetail-head">
              <SubclassSigil klass={klass} sub={shown} className="big" />
              <div>
                <h5 className="subdetail-name">{shown.name}</h5>
                <span className="subdetail-state">{shown.id === selected ? '✓ Escolhida' : 'Clique para escolher'}</span>
              </div>
            </div>
            {shown.description && <p className="subdetail-desc">{shown.description}</p>}
            {grants.length > 0 && (
              <span className="grants">
                {grants.map((g, i) => (
                  <span key={i} className={'grant g-' + g.type.toLowerCase()} title={g.description ?? undefined}>{grantLabel(g, crafts, equipment)}</span>
                ))}
              </span>
            )}
            {levels.length > 0 && (
              <span className="option-level-list">
                <span className="option-level-title">Ao subir de nível</span>
                {levels.map(l => (
                  <span key={l.level} className="option-level">
                    <b>{l.level}º nível.</b> {levelGrantsText(l.grants, crafts, equipment)}
                  </span>
                ))}
              </span>
            )}
          </div>
        ) : (
          <p className="subdetail-empty">Passe o mouse sobre uma opção para ver o que ela concede e clique para escolher.</p>
        )}
      </div>
    </div>
  )
}
