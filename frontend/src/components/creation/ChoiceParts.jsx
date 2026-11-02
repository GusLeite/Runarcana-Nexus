import { choiceSigil } from '../../data/choiceArt.js'

export function ChoiceSigil({ type, className = '' }) {
  return (
    <svg className={'ch-sigil ' + className} viewBox="0 0 100 100" aria-hidden="true">
      {choiceSigil(type).map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

// Cabeçalho de uma escolha: medalhão com o símbolo, título, origem da escolha e o progresso em gemas (ou número, se forem muitas).
export function ChoiceHead({ type, label, source, done, used, total, suffix = '' }) {
  return (
    <div className="choice-head">
      <div className="choice-medal"><ChoiceSigil type={type} /></div>
      <div className="choice-title">
        <span className="choice-label">{label}</span>
        {source && <span className="choice-source">{source}</span>}
      </div>
      {total != null && (
        <div className={'choice-progress' + (done ? ' ok' : '')} title={`${used} de ${total}${suffix}`}>
          {total <= 8 && (
            <span className="choice-gems" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => <i key={i} className={i < used ? 'on' : ''} />)}
            </span>
          )}
          <span className="choice-count">{used}/{total}{suffix}</span>
        </div>
      )}
    </div>
  )
}
