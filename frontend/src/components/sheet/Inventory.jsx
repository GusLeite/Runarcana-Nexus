import { useState } from 'react'
import { ITEM_KINDS, carryCapacity, formatKg, itemStats, rarityOf, totalValue, totalWeight } from '../../data/rules.js'
import { CoinIcon } from './icons.jsx'
import ItemIcon from './ItemIcon.jsx'
import Num from './Num.jsx'

const MIN_SLOTS = 24
const FILTERS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'WEAPON', label: 'Armas' },
  { id: 'ARMOR', label: 'Armaduras' },
  { id: 'CONSUMABLE', label: 'Consumíveis' },
  { id: 'OBJECT', label: 'Objetos' },
]

// Aba de inventário: uma bolsa de couro. A aba da bolsa tem o título e o filtro por tipo, cada item fica num bolso
// (o brilho mostra a raridade), a carga é o cinto e a etiqueta do item escolhido pende ao lado.
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
      <div className="bag">
        <div className="bag-flap">
          <h3 className="bag-title">Mochila <small>{items.length} {items.length === 1 ? 'item' : 'itens'}</small></h3>
          <div className="bag-tabs" role="group" aria-label="Filtrar por tipo">
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

        <div className="slots bag-body">
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
                <ItemIcon item={item} />
                {item.quantity > 1 && <span className="qty">{item.quantity}</span>}
              </button>
            )
          })}
          {Array.from({ length: empty }, (_, i) => <span key={'e' + i} className="slot empty" aria-hidden="true" />)}
        </div>

        <div className="bag-belt">
          <div className="carry">
            <div className="carry-head">
              <span>Carga</span>
              <b>{formatKg(weight)} <small>/ {formatKg(capacity)}</small></b>
            </div>
            <div className={'carry-bar' + (load > 0.8 ? ' heavy' : '')} role="meter" aria-valuenow={Math.round(load * 100)} aria-valuemin="0" aria-valuemax="100" aria-label="Carga">
              <div style={{ width: load * 100 + '%' }} />
            </div>
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
    <div className="item-detail item-tag" style={{ '--r': rarity.color }} aria-live="polite">
      <div className="item-head">
        <div className="slot mini" style={{ '--r': rarity.color }}><ItemIcon item={item} /></div>
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
