import { formatFeet, grantLabel } from '../../data/rules.js'

// Cartões para escolher origem, região, classe ou passado, cada um com os detalhes do livro
// (ex.: Idade, Tamanho) e a lista do que concede.
export default function OptionStep({ kind, title, hint, items, selected, onPick, crafts }) {
  if (!items?.length) {
    return <p className="muted-note">Nenhuma opção cadastrada ainda nas regras de criação.</p>
  }
  return (
    <>
      <h4 className="step-title">{title}</h4>
      {hint && <p className="step-hint">{hint}</p>}
      <div className={'options' + (kind === 'region' ? ' compact' : '')} role="radiogroup" aria-label={title}>
        {items.map((item, n) => {
          const grants = item.grants ?? []
          const on = item.id === selected
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={'option' + (on ? ' on' : '')}
              style={{ '--n': n }}
              onClick={() => onPick(item.id)}
            >
              <span className="option-head">
                <span className="option-name">{item.name}</span>
                {item.example && <span className="example-tag" title="Conteúdo de exemplo, a trocar pelas regras reais">EXEMPLO</span>}
              </span>
              {item.description && <span className="option-desc">{item.description}</span>}
              {item.details?.length > 0 && (
                <span className="option-details">
                  {item.details.map(d => <span key={d.name}><b>{d.name}.</b> {d.text}</span>)}
                </span>
              )}
              <span className="option-facts">
                {kind === 'class' && <span className="fact-chip hp">Dado de vida d{item.hitDie}</span>}
                {kind === 'origin' && item.speed != null && <span className="fact-chip">Deslocamento {formatFeet(item.speed)}</span>}
                {item.startingGold != null && <span className="fact-chip gold">{item.startingGold} de ouro</span>}
              </span>
              {grants.length > 0 && (
                <span className="grants">
                  {grants.map((g, i) => (
                    <span key={i} className={'grant g-' + g.type.toLowerCase()} title={g.description ?? undefined}>{grantLabel(g, crafts)}</span>
                  ))}
                </span>
              )}
              {kind === 'class' && item.levels?.length > 0 && (
                <span className="option-levels">Ganhos por nível cadastrados até o {Math.max(...item.levels.map(l => l.level))}º</span>
              )}
              {kind !== 'class' && item.levels?.length > 0 && (
                <span className="option-level-list">
                  <span className="option-level-title">Ao subir de nível</span>
                  {[...item.levels].sort((a, b) => a.level - b.level).map(l => (
                    <span key={l.level} className="option-level">
                      <b>{l.level}º nível.</b> {(l.grants ?? []).map(g => grantLabel(g, crafts)).join(' · ')}
                    </span>
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
