import { useState } from 'react'
import { ITEM_KINDS, carryCapacity, formatKg, itemStats, rarityOf, totalValue, totalWeight } from '../../data/rules.js'
import { CoinIcon } from './icons.jsx'
import Num from './Num.jsx'

const MIN_SLOTS = 24
const FILTERS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'WEAPON', label: 'Armas' },
  { id: 'ARMOR', label: 'Armaduras' },
  { id: 'CONSUMABLE', label: 'Consumíveis' },
  { id: 'OBJECT', label: 'Objetos' },
]

// Aba de inventário: casas quadradas como a loja do LoL (a borda mostra a raridade),
// filtro por tipo e a dica do item escolhido ao lado.
export default function Inventory({ items, strength, onUse }) {
  const [filter, setFilter] = useState('ALL')
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null)
  const visible = filter === 'ALL' ? items : items.filter(i => i.kind === filter)
  // Se o filtro esconder o item escolhido, mostra o primeiro que continua visível.
  const selected = visible.find(i => i.id === selectedId) ?? visible[0]
  const weight = totalWeight(items)
  const capacity = carryCapacity(strength)
  const load = Math.min(weight / capacity, 1)
  const empty = Math.max(MIN_SLOTS - visible.length, 0)
  const counts = Object.fromEntries(FILTERS.map(f => [f.id, f.id === 'ALL' ? items.length : items.filter(i => i.kind === f.id).length]))

  return (
    <div className="inventory">
      <div className="inv-main">
        <div className="card-title inv-title">
          <h3>Inventário <small>{items.length} {items.length === 1 ? 'item' : 'itens'}</small></h3>
          <div className="seg" role="group" aria-label="Filtrar por tipo">
            {FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                className={filter === f.id ? 'on' : ''}
                aria-pressed={filter === f.id}
                disabled={f.id !== 'ALL' && counts[f.id] === 0}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="slots">
          {visible.map((item, n) => {
            const rarity = rarityOf(item.rarity)
            return (
              <button
                key={item.id}
                type="button"
                className={'slot' + (item.id === selected?.id ? ' on' : '')}
                style={{ '--r': rarity.color, '--n': n }}
                onClick={() => setSelectedId(item.id)}
                onMouseEnter={() => setSelectedId(item.id)}
                aria-label={`${item.name}, ${rarity.name}${item.quantity > 1 ? ', ' + item.quantity + ' unidades' : ''}`}
              >
                <ItemIcon kind={item.kind} />
                {item.quantity > 1 && <span className="qty">{item.quantity}</span>}
              </button>
            )
          })}
          {Array.from({ length: empty }, (_, i) => <span key={'e' + i} className="slot empty" aria-hidden="true" />)}
        </div>

        <div className="inv-summary">
          <div className="carry">
            <div className="carry-head">
              <span>Carga</span>
              <b>{formatKg(weight)} <small>/ {formatKg(capacity)}</small></b>
            </div>
            <div className={'carry-bar' + (load > 0.8 ? ' heavy' : '')}><div style={{ width: load * 100 + '%' }} /></div>
          </div>
          <div className="inv-value" title="Soma do preço dos itens">
            <span>Valor estimado</span>
            <b><CoinIcon /><Num value={totalValue(items)} /></b>
          </div>
        </div>
      </div>

      <div className="inv-side">
        {selected ? <ItemDetail key={selected.id} item={selected} onUse={onUse} /> : (
          <div className="item-detail empty-detail">
            <p className="muted-note">Mochila vazia. Quando o mestre entregar itens, eles aparecem aqui.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Painel de detalhes no formato da dica de item do LoL.
function ItemDetail({ item, onUse }) {
  const rarity = rarityOf(item.rarity)
  const stats = itemStats(item)
  return (
    <div className="item-detail" style={{ '--r': rarity.color }} aria-live="polite">
      <div className="item-head">
        <div className="slot mini" style={{ '--r': rarity.color }}><ItemIcon kind={item.kind} /></div>
        <div>
          <div className="item-name">{item.name}</div>
          <div className="item-tags"><span className="rarity">{rarity.name}</span> · {ITEM_KINDS[item.kind] ?? item.kind}</div>
        </div>
      </div>
      {stats.length > 0 && <ul className="item-stats">{stats.map(s => <li key={s}>{s}</li>)}</ul>}
      {item.description && <p className="item-desc">{item.description}</p>}
      {item.effect && <p className="item-effect">{item.effect}</p>}
      <div className="item-foot">
        <span>{item.weight != null ? formatKg(item.weight * item.quantity) : 'Sem peso'}{item.quantity > 1 && ` (${item.quantity}×)`}</span>
        {item.price != null && <span className="price"><CoinIcon />{item.price}</span>}
      </div>
      {onUse && item.kind === 'CONSUMABLE' && (
        <button type="button" className="ghost-btn small item-use" onClick={() => onUse(item)}>
          USAR {item.quantity > 1 ? '(fica ' + (item.quantity - 1) + ')' : '(último)'}
        </button>
      )}
    </div>
  )
}

// Ícones desenhados em SVG enquanto os itens não têm arte própria.
function ItemIcon({ kind }) {
  switch (kind) {
    case 'WEAPON':
      return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M24 4h4v4L13 23l-4-4Z" /><path d="M8 18l6 6M6 22l4 4M5 27l2-2" /></svg>
    case 'ARMOR':
      return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 26 8v8c0 6-4.5 10-10 12C10.5 26 6 22 6 16V8Z" /><path d="M16 9v14M11 14h10" /></svg>
    case 'CONSUMABLE':
      return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M13 4h6M14 4v6l-6 9a6 6 0 0 0 5 9h6a6 6 0 0 0 5-9l-6-9V4" /><path d="M10 20h12" /></svg>
    default:
      return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 27 16 16 28 5 16Z" /><path d="M5 16h22M16 4l-4 12 4 12 4-12Z" /></svg>
  }
}
