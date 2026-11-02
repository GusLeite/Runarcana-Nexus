import { useState } from 'react'
import { grantLabel } from '../../data/rules.js'
import { backgroundSigil } from '../../data/backgroundArt.js'
import '../../styles/background.css'

// Símbolo desenhado com traços (viewBox 100×100); o mesmo da grade e do medalhão do detalhe.
export function BackgroundSigil({ background, className = '' }) {
  return (
    <svg className={'bg-sigil ' + className} viewBox="0 0 100 100" aria-hidden="true">
      {backgroundSigil(background).map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

// Escolha do passado: grade de símbolos e, ao lado, o detalhe da opção sob o mouse ou o foco (ou da escolhida, ou da
// primeira): descrição, `details` do livro (Idade, Tamanho…), ouro e o que concede. Clicar escolhe.
export default function BackgroundPicker({ title, hint, items, selected, onPick, crafts, equipment = [] }) {
  const [peek, setPeek] = useState(null)
  if (!items?.length) {
    return <p className="muted-note">Nenhuma opção cadastrada ainda nas regras de criação.</p>
  }
  const shown = items.find(b => b.id === (peek ?? selected)) ?? items[0]
  const grants = shown.grants ?? []

  return (
    <>
      <h4 className="step-title">{title}</h4>
      {hint && <p className="step-hint">{hint}</p>}
      <div className="bgpick">
        <div className="bggrid" role="radiogroup" aria-label={title} onMouseLeave={() => setPeek(null)}>
          {items.map((b, n) => (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={b.id === selected}
              className={'bgtile' + (b.id === selected ? ' on' : '') + (b.id === shown.id ? ' peek' : '')}
              style={{ '--n': n }}
              onClick={() => onPick(b.id)}
              onMouseEnter={() => setPeek(b.id)}
              onFocus={() => setPeek(b.id)}
              onBlur={() => setPeek(null)}
            >
              <BackgroundSigil background={b} />
              <span className="bgtile-name">{b.name}</span>
              {b.id === selected && <span className="bgtile-check">✓</span>}
            </button>
          ))}
        </div>

        <div className="bgdetail" aria-live="polite">
          <div key={shown.id} className="bgdetail-in">
            <div className="bgmedal"><BackgroundSigil background={shown} className="big" /></div>
            <h5 className="bgdetail-name">
              {shown.name}
              {shown.example && <span className="example-tag" title="Conteúdo de exemplo, a trocar pelas regras reais">EXEMPLO</span>}
            </h5>
            <span className="bgdetail-state">{shown.id === selected ? '✓ Escolhido' : 'Clique para escolher'}</span>
            {shown.description && <p className="bgdetail-desc">{shown.description}</p>}
            {shown.details?.length > 0 && (
              <span className="option-details">
                {shown.details.map(d => <span key={d.name}><b>{d.name}.</b> {d.text}</span>)}
              </span>
            )}
            {shown.startingGold != null && (
              <span className="option-facts"><span className="fact-chip gold">{shown.startingGold} de ouro</span></span>
            )}
            {grants.length > 0 && (
              <span className="grants">
                {grants.map((g, i) => (
                  <span key={i} className={'grant g-' + g.type.toLowerCase()} title={g.description ?? undefined}>{grantLabel(g, crafts, equipment)}</span>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
