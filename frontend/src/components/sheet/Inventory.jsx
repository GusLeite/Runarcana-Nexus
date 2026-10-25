import { useState } from 'react'
import { ITEM_KINDS, carryCapacity, formatKg, itemStats, rarityOf, totalWeight } from '../../data/rules.js'
import { CoinIcon } from './icons.jsx'

const MIN_SLOTS = 12

// Inventário em casas quadradas como a loja/inventário do LoL; a borda mostra a raridade.
export default function Inventory({ items, strength }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null)
  const selected = items.find(i => i.id === selectedId)
  const weight = totalWeight(items)
  const capacity = carryCapacity(strength)
  const load = Math.min(weight / capacity, 1)
  const empty = Math.max(MIN_SLOTS - items.length, 0)

  return (
    <>
      <h3 className="card-title">Inventário <small>{items.length} {items.length === 1 ? 'item' : 'itens'}</small></h3>
      <div className="slots">
        {items.map(item => {
          const rarity = rarityOf(item.rarity)
          return (
            <button
              key={item.id}
              type="button"
              className={'slot' + (item.id === selectedId ? ' on' : '')}
              style={{ '--r': rarity.color }}
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

      {selected ? <ItemDetail item={selected} /> : (
        <p className="muted-note">Mochila vazia. Quando o mestre entregar itens, eles aparecem aqui.</p>
      )}

      <div className="carry">
        <div className="carry-head">
          <span>Carga</span>
          <b>{formatKg(weight)} <small>/ {formatKg(capacity)}</small></b>
        </div>
        <div className={'carry-bar' + (load > 0.8 ? ' heavy' : '')}><div style={{ width: load * 100 + '%' }} /></div>
      </div>
    </>
  )
}

// Painel de detalhes no formato da dica de item do LoL.
function ItemDetail({ item }) {
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
