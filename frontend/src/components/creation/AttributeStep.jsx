import { ATTRIBUTES, formatModifier, pointBuySpent, roll4d6DropLowest } from '../../data/rules.js'

const METHODS = [
  { id: 'POINT_BUY', key: 'pointBuy', label: 'Compra de pontos' },
  { id: 'STANDARD_ARRAY', key: 'standardArray', label: 'Arranjo padrão' },
  { id: 'MANUAL', key: 'manual', label: 'Manual / rolagem' },
]

// Atributos base pelo método escolhido. A coluna da direita mostra base + bônus (da prévia) = total.
export default function AttributeStep({ methods, draft, preview, onMethod, onChange }) {
  const enabled = METHODS.filter(m => methods[m.key] != null)
  const values = draft.baseAttributes
  const method = draft.attributeMethod
  const set = (id, v) => onChange({ ...values, [id]: v })
  const line = id => preview?.attributes.find(a => a.attribute === id)

  const pb = methods.pointBuy
  const spent = method === 'POINT_BUY' ? pointBuySpent(pb, values) : 0
  const array = methods.standardArray ?? []
  // No arranjo padrão, cada valor só pode ser usado uma vez.
  const usedCount = v => Object.values(values).filter(x => x === v).length
  const availableIn = (id, v) => usedCount(v) < array.filter(x => x === v).length || values[id] === v

  return (
    <>
      <h4 className="step-title">Defina os atributos</h4>
      <div className="seg method-seg" role="radiogroup" aria-label="Método">
        {enabled.map(m => (
          <button key={m.id} type="button" role="radio" aria-checked={method === m.id} className={method === m.id ? 'on' : ''} onClick={() => onMethod(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {method === 'POINT_BUY' && (
        <div className={'budget' + (spent > pb.points ? ' over' : '')}>
          <span>Pontos gastos</span>
          <b>{spent} <small>/ {pb.points}</small></b>
          <div className="budget-bar"><div style={{ width: Math.min(100, (spent / pb.points) * 100) + '%' }} /></div>
        </div>
      )}
      {method === 'MANUAL' && (
        <button type="button" className="ghost-btn small roll-all" onClick={() => onChange(Object.fromEntries(ATTRIBUTES.map(a => [a.id, roll4d6DropLowest()])))}>
          Rolar 4d6 (descarta o menor) para todos
        </button>
      )}

      <div className="attr-rows">
        {ATTRIBUTES.map((a, n) => {
          const v = values[a.id]
          const l = line(a.id)
          return (
            <div className="attr-row" key={a.id} style={{ '--n': n }}>
              <span className="attr-row-name"><b>{a.abbr}</b> {a.name}</span>
              <span className="attr-row-input">
                {method === 'POINT_BUY' && (
                  <span className="stepper-input">
                    <button type="button" aria-label={'Diminuir ' + a.name} disabled={v <= pb.min} onClick={() => set(a.id, v - 1)}>−</button>
                    <b>{v}</b>
                    <button type="button" aria-label={'Aumentar ' + a.name} disabled={v >= pb.max} onClick={() => set(a.id, v + 1)}>+</button>
                    <small className="cost">custo {pb.costs[String(v)] ?? '—'}</small>
                  </span>
                )}
                {method === 'STANDARD_ARRAY' && (
                  <select aria-label={a.name} value={v ?? ''} onChange={e => set(a.id, e.target.value === '' ? null : Number(e.target.value))}>
                    <option value="">—</option>
                    {[...new Set(array)].map(x => <option key={x} value={x} disabled={!availableIn(a.id, x)}>{x}</option>)}
                  </select>
                )}
                {method === 'MANUAL' && (
                  <input type="number" aria-label={a.name} min={methods.manual.min} max={methods.manual.max} value={v ?? ''}
                    onChange={e => set(a.id, e.target.value === '' ? null : Number(e.target.value))} />
                )}
              </span>
              <span className="attr-row-result">
                {l && l.bonus !== 0 && <span className="bonus-chip">{formatModifier(l.bonus)}</span>}
                <span className="total">{l ? l.total : '—'}</span>
                <span className="mod">{l ? formatModifier(l.modifier) : ''}</span>
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
