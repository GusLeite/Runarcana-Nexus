import { useEffect, useRef, useState } from 'react'
import { ITEM_KINDS, SKILL_NAMES, formatKg, formatModifier, itemStats, rarityOf } from '../../data/rules.js'
import { CoinIcon } from './icons.jsx'
import ItemIcon from './ItemIcon.jsx'
import Num from './Num.jsx'
import { prefersReducedMotion } from '../../hooks/useCountUp.js'
import '../../styles/merchant.css'

const DEFAULT_GREETING = 'Olhe à vontade. O que brilha aqui já brilhou nas mãos de outro.'
const BURST = 12

// Aba do mercador aberto pelo mestre: imagem e fala no topo; comprar da prateleira com o ouro ou vender o que está
// na mochila, com a quantidade e o total ao lado antes de fechar negócio.
export default function MerchantTab({ merchant, inventory, gold, skills, busy, onBuy, onSell, onHaggle }) {
  const [mode, setMode] = useState('buy')
  const [selectedId, setSelectedId] = useState(null)
  const [qty, setQty] = useState(1)
  const [burst, setBurst] = useState(null)
  const greeting = useTypewriter(merchant.greeting || DEFAULT_GREETING)

  const offers = Object.fromEntries((merchant.offers ?? []).map(o => [o.entryId, o.unitValue]))
  const buying = mode === 'buy'
  const list = buying ? merchant.items : inventory
  const selected = list.find(i => i.id === selectedId) ?? list[0] ?? null
  const unit = selected ? (buying ? selected.price : offers[selected.id] ?? 0) : 0
  // Até onde a quantidade vai: estoque e ouro na compra, o que tem na mochila na venda.
  const maxQty = !selected ? 0 : buying
    ? Math.min(selected.stock ?? 9999, unit > 0 ? Math.floor(gold / unit) : 9999)
    : unit > 0 ? selected.quantity : 0
  const amount = Math.min(qty, Math.max(maxQty, 1))
  const total = unit * amount

  const choose = id => { setSelectedId(id); setQty(1) }
  const changeMode = m => { setMode(m); setSelectedId(null); setQty(1) }

  const deal = () => {
    (buying ? onBuy(selected, amount) : onSell(selected, amount, unit))
      .then(() => {
        setQty(1)
        if (total > 0 && !prefersReducedMotion()) setBurst({ id: Date.now(), kind: mode })
      })
      .catch(() => {})
  }

  return (
    <div className="shop">
      <header className="shop-hero">
        {merchant.image && <img src={merchant.image} alt="" />}
        <div className="shop-hero-text">
          <span className="shop-kicker">MERCADOR</span>
          <h2>{merchant.name}</h2>
          <p className="shop-greeting">“{greeting}”</p>
        </div>
        <div className="shop-purse" aria-label={'Seu ouro: ' + gold + ' PO'}>
          <span>Sua bolsa</span>
          <b><CoinIcon /><Num value={gold} /></b>
          {burst && <CoinBurst key={burst.id} kind={burst.kind} />}
        </div>
      </header>

      <Haggle merchant={merchant} skills={skills} busy={busy} onHaggle={onHaggle} />

      <div className="shop-body">
        <div className="shop-main">
          <div className="card-title inv-title">
            <h3>{buying ? 'À venda' : 'Sua mochila'} <small>{buying ? merchant.items.length + (merchant.items.length === 1 ? ' item' : ' itens') : merchant.buyRate > 0 ? 'ele paga ' + merchant.buyRate + '% do preço' : 'ele não compra nada'}</small></h3>
            <div className="seg" role="group" aria-label="Negociação">
              <button type="button" className={buying ? 'on' : ''} aria-pressed={buying} onClick={() => changeMode('buy')}>Comprar</button>
              <button type="button" className={!buying ? 'on' : ''} aria-pressed={!buying} onClick={() => changeMode('sell')}>Vender</button>
            </div>
          </div>

          {list.length === 0 && <p className="muted-note">{buying ? 'A prateleira está vazia por enquanto.' : 'Sua mochila está vazia.'}</p>}
          <ul className="shop-list" key={mode}>
            {list.map((item, n) => {
              const rarity = rarityOf(item.rarity)
              const price = buying ? item.price : offers[item.id] ?? 0
              const out = buying ? item.stock === 0 : price < 1
              return (
                <li key={item.id} style={{ '--n': n }}>
                  <button type="button" className={'shop-row' + (item.id === selected?.id ? ' on' : '') + (out ? ' out' : '') + (buying && !out && price > gold ? ' dear' : '')}
                    style={{ '--r': rarity.color }} aria-pressed={item.id === selected?.id} onClick={() => choose(item.id)}>
                    <span className="slot mini"><ItemIcon item={item} /></span>
                    <span className="shop-row-name">
                      <b>{item.name}</b>
                      <small>{rarity.name} · {ITEM_KINDS[item.kind] ?? item.kind}{buying
                        ? item.stock != null ? ' · ' + (item.stock === 0 ? 'esgotado' : item.stock + ' em estoque') : ''
                        : item.quantity > 1 ? ' · ' + item.quantity + ' na mochila' : ''}</small>
                    </span>
                    <span className="shop-price">{out && !buying ? 'sem oferta' : <>{buying && item.basePrice != null && item.basePrice !== price && <s className="shop-base">{item.basePrice}</s>}<CoinIcon />{price}</>}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <aside className="shop-side">
          {selected ? (
            <Deal key={mode + selected.id} item={selected} buying={buying} unit={unit} amount={amount} maxQty={maxQty} total={total} gold={gold} busy={busy}
              merchantName={merchant.name} onQty={setQty} onDeal={deal} />
          ) : (
            <div className="item-detail empty-detail"><p className="muted-note">Escolha um item para negociar.</p></div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Deal({ item, buying, unit, amount, maxQty, total, gold, busy, merchantName, onQty, onDeal }) {
  const rarity = rarityOf(item.rarity)
  const stats = itemStats(item)
  const blocked = buying
    ? item.stock === 0 ? 'Esgotado.' : unit > gold ? 'Faltam ' + (unit - gold) + ' PO.' : null
    : unit < 1 ? merchantName + ' não se interessa por isto.' : null
  return (
    <div className="item-detail" style={{ '--r': rarity.color }} aria-live="polite">
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
      {item.weight != null && <div className="item-foot"><span>{formatKg(item.weight)} cada</span></div>}

      {blocked ? <p className="shop-blocked">{blocked}</p> : (
        <div className="shop-deal">
          <div className="shop-qty">
            <span>Quantidade</span>
            <span className="inv-qty">
              <button type="button" className="qty-btn" disabled={amount <= 1} aria-label="Menos 1" onClick={() => onQty(amount - 1)}>−</button>
              <b aria-label="Quantidade">{amount}</b>
              <button type="button" className="qty-btn" disabled={amount >= maxQty} aria-label="Mais 1" onClick={() => onQty(amount + 1)}>+</button>
            </span>
          </div>
          <div className="shop-total">
            <span>{buying ? 'Você paga' : 'Você recebe'}</span>
            <b className={buying ? 'pay' : 'get'}><CoinIcon />{total}</b>
          </div>
          <button type="button" className="btn shop-go" disabled={busy} onClick={onDeal}>
            {buying ? (unit === 0 ? 'PEGAR' : 'COMPRAR') : 'VENDER'}
          </button>
        </div>
      )}
    </div>
  )
}

// Moedas saltando da bolsa (venda: caem nela) ao fechar negócio.
function CoinBurst({ kind }) {
  return (
    <span className={'coin-burst ' + kind} aria-hidden="true">
      {Array.from({ length: BURST }, (_, i) => (
        <i key={i} style={{ '--a': (i * 360) / BURST + 'deg', '--d': 34 + ((i * 17) % 30) + 'px', '--dl': (i % 4) * 30 + 'ms' }} />
      ))}
    </span>
  )
}

// A fala do mercador aparece letra a letra.
function useTypewriter(text) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0))
  const last = useRef(text)
  useEffect(() => {
    if (last.current !== text) {
      last.current = text
      setShown(prefersReducedMotion() ? text.length : 0)
    }
    if (prefersReducedMotion()) return undefined
    const t = setInterval(() => setShown(n => {
      if (n >= text.length) clearInterval(t)
      return Math.min(n + 1, text.length)
    }), 22)
    return () => clearInterval(t)
  }, [text])
  return text.slice(0, shown)
}

const HAGGLE_SKILLS = [
  { id: 'PERSUASION', hint: 'segura: errar por pouco não irrita' },
  { id: 'DECEPTION', hint: 'rende mais, mas qualquer falha irrita' },
]

// O que o mercador responde a cada resultado da pechincha.
function haggleReaction(percent) {
  if (percent <= -20) return 'Por você, faço preço de amigo.'
  if (percent < 0) return 'Está bem, está bem… um descontinho.'
  if (percent === 0) return 'Bela tentativa. O preço é o preço.'
  if (percent < 20) return 'Acha que sou tolo? Os preços subiram.'
  return 'Fora daqui com essa conversa! Agora custa bem mais.'
}

// Pechincha: uma tentativa por visita (o back rola), com Persuasão ou Enganação; depois, o resultado e a reação.
function Haggle({ merchant, skills, busy, onHaggle }) {
  if (!merchant.haggleDc) return null
  const h = merchant.haggle
  if (h) {
    const tone = h.percent < 0 ? 'good' : h.percent > 0 ? 'bad' : ''
    return (
      <div className={'shop-haggle done ' + tone} aria-live="polite">
        <span className="shop-haggle-roll">{SKILL_NAMES[h.skill]}: <b>{h.total}</b> <small>(d20 {h.d20} {h.modifier >= 0 ? '+' : '−'} {Math.abs(h.modifier)})</small></span>
        <span className="shop-haggle-say">“{haggleReaction(h.percent)}”</span>
        <span className="shop-haggle-pct">{h.percent === 0 ? 'preço normal' : (h.percent < 0 ? '−' : '+') + Math.abs(h.percent) + '% nas compras'}</span>
      </div>
    )
  }
  const mod = id => skills?.find(s => s.skill === id)?.modifier ?? 0
  return (
    <div className="shop-haggle">
      <span className="shop-haggle-title">PECHINCHAR <small>uma tentativa por visita</small></span>
      {HAGGLE_SKILLS.map(s => (
        <button key={s.id} type="button" className="shop-haggle-btn" disabled={busy} aria-label={'Pechinchar com ' + SKILL_NAMES[s.id] + ' (' + formatModifier(mod(s.id)) + ')'} onClick={() => onHaggle(s.id)}>
          {SKILL_NAMES[s.id]} <b>{formatModifier(mod(s.id))}</b>
          <small>{s.hint}</small>
        </button>
      ))}
    </div>
  )
}
