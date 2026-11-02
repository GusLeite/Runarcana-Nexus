import { useEffect, useMemo, useState } from 'react'
import {
  addCatalogItem, addCustomItem, fetchCatalog, fetchCharacters, fetchInventory, removeItem, setGold, setInspiration, setItemQuantity,
} from '../../api/master.js'
import { CHARACTERS } from '../../data/characters.js'
import { ITEM_KINDS, RARITIES, formatKg, rarityOf } from '../../data/rules.js'
import { CoinIcon } from '../sheet/icons.jsx'

const artOf = name => CHARACTERS.find(c => c.id === name.trim().toLowerCase())
const MAX_RESULTS = 40
const EMPTY_CUSTOM = { name: '', description: '', effect: '', weight: '', price: '', rarity: 'Common', quantity: '1', consumable: false }
// Tipos do catálogo (rules/itens.json) em PT, para a busca.
const CATALOG_KINDS = {
  WEAPON: 'Arma', ARMOR: 'Armadura', SHIELD: 'Escudo', AMMUNITION: 'Munição', GEAR: 'Equipamento', FOCUS: 'Foco',
  TOOLS: 'Ferramentas', INSTRUMENT: 'Instrumento', MOUNT: 'Montaria', VEHICLE: 'Veículo', TACK: 'Arreio', PACK: 'Conjunto',
}
const plain = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

// Aba Inventário do mestre (decisão da mesa: o mestre dá e tira; o jogador só gasta): escolhe o personagem, ajusta
// ouro, inspiração e as quantidades, e dá itens do catálogo ou loot fora dele. Cada ação devolve o inventário salvo.
export default function MasterInventory({ token, onError, onToast }) {
  const [catalog, setCatalog] = useState(null)
  const [characters, setCharacters] = useState([])
  const [characterId, setCharacterId] = useState(null)
  const [inv, setInv] = useState(null)
  const [gold, setGoldDraft] = useState('')
  const [query, setQuery] = useState('')
  const [qty, setQty] = useState('1')
  const [custom, setCustom] = useState(EMPTY_CUSTOM)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchCatalog(token).then(setCatalog).catch(onError)
    fetchCharacters(token)
      .then(list => {
        setCharacters(list)
        setCharacterId(id => id ?? list[0]?.id ?? null)
      })
      .catch(onError)
  }, [token, onError])

  useEffect(() => {
    if (!characterId) return
    setInv(null)
    fetchInventory(token, characterId).then(data => { setInv(data); setGoldDraft(String(data.gold)) }).catch(onError)
  }, [token, characterId, onError])

  // Toda ação devolve o inventário salvo; o ouro do campo acompanha.
  const run = (action, done) => {
    setBusy(true)
    return action()
      .then(data => {
        setInv(data)
        setGoldDraft(String(data.gold))
        if (done) onToast(done)
        return data
      })
      .catch(err => { onError(err); throw err })
      .finally(() => setBusy(false))
  }

  const results = useMemo(() => {
    const items = catalog?.equipment?.items ?? []
    const q = plain(query.trim())
    if (!q) return []
    return items.filter(i => plain(i.name).includes(q)).slice(0, MAX_RESULTS)
  }, [catalog, query])

  const quantity = Number(qty)
  const qtyOk = /^\d+$/.test(qty.trim()) && quantity >= 1 && quantity <= 9999
  const goldOk = /^\d+$/.test(gold.trim())
  const name = inv?.characterName ?? ''

  const giveCatalog = item => run(() => addCatalogItem(token, characterId, item.id, quantity), item.name + ' para ' + name + '.')
    .catch(() => {})

  const giveCustom = e => {
    e.preventDefault()
    if (!custom.name.trim()) return onToast('Dê um nome ao item.')
    const body = {
      name: custom.name.trim(),
      description: custom.description.trim() || null,
      effect: custom.effect.trim() || null,
      weight: custom.weight === '' ? null : Number(custom.weight),
      price: custom.price === '' ? null : Number(custom.price),
      rarity: custom.rarity,
      quantity: custom.quantity === '' ? 1 : Number(custom.quantity),
      consumable: custom.consumable,
    }
    run(() => addCustomItem(token, characterId, body), body.name + ' para ' + name + '.')
      .then(() => setCustom(EMPTY_CUSTOM))
      .catch(() => {})
  }

  const setC = (key, value) => setCustom(c => ({ ...c, [key]: value }))

  return (
    <>
      <section className="card pick-card" style={{ '--i': 0 }}>
        <h3 className="card-title">Personagem</h3>
        {characters.length === 0 && <p className="muted-note">Nenhum personagem criado ainda.</p>}
        <div className="char-pick" role="radiogroup" aria-label="Personagem">
          {characters.map(c => {
            const art = artOf(c.characterName)
            return (
              <button key={c.id} type="button" role="radio" aria-checked={c.id === characterId}
                className={'char-chip' + (c.id === characterId ? ' on' : '')} style={{ '--h': art?.hue ?? 42 }}
                onClick={() => setCharacterId(c.id)}>
                <span className="char-face" style={art ? { backgroundImage: `url("${art.img}")`, backgroundPosition: art.pos } : undefined} />
                <span className="char-info">
                  <span className="char-name">{c.characterName}</span>
                  <span className="char-sub">nível {c.level}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {characterId && !inv && <p className="muted-note">Abrindo o inventário…</p>}

      {inv && (
        <div className="master-grid">
          <section className="card" style={{ '--i': 1 }}>
            <h3 className="card-title">Bolsa de {name}</h3>
            <div className="inv-top">
              <form className="inv-gold" onSubmit={e => {
                e.preventDefault()
                if (goldOk) run(() => setGold(token, characterId, Number(gold)), 'Ouro de ' + name + ': ' + Number(gold) + ' PO.').catch(() => {})
              }}>
                <label htmlFor="m-gold"><CoinIcon /> Ouro (PO)</label>
                <div className="purse-row">
                  <input id="m-gold" type="number" min={0} inputMode="numeric" value={gold} onChange={e => setGoldDraft(e.target.value)} />
                  <button type="submit" className="hp-act" disabled={busy || !goldOk || Number(gold) === inv.gold}>Salvar</button>
                </div>
              </form>
              <div className="inv-insp">
                <span className="mlabel first">Inspiração</span>
                <button type="button" className={'to-chip' + (inv.inspiration ? ' on' : '')} aria-pressed={inv.inspiration} disabled={busy}
                  onClick={() => run(() => setInspiration(token, characterId, !inv.inspiration),
                    inv.inspiration ? 'Inspiração de ' + name + ' tirada.' : name + ' ganhou inspiração.').catch(() => {})}>
                  {inv.inspiration ? '◆ TEM INSPIRAÇÃO' : 'DAR INSPIRAÇÃO'}
                </button>
              </div>
            </div>

            <span className="mlabel">Itens ({inv.items.length})</span>
            {inv.items.length === 0 && <p className="muted-note">Inventário vazio.</p>}
            <ul className="inv-rows">
              {inv.items.map((item, n) => (
                <li key={item.id} className="inv-row" style={{ '--r': rarityOf(item.rarity).color, '--n': n }}>
                  <span className="inv-name">
                    <b>{item.name}</b>
                    <small>{ITEM_KINDS[item.kind] ?? item.kind}{item.weight != null ? ' · ' + formatKg(item.weight) : ''}</small>
                  </span>
                  <span className="inv-qty">
                    <button type="button" className="qty-btn" disabled={busy} aria-label={'Tirar 1 ' + item.name}
                      onClick={() => run(() => setItemQuantity(token, characterId, item.id, item.quantity - 1)).catch(() => {})}>−</button>
                    <b aria-label="Quantidade">{item.quantity}</b>
                    <button type="button" className="qty-btn" disabled={busy || item.quantity >= 9999} aria-label={'Dar mais 1 ' + item.name}
                      onClick={() => run(() => setItemQuantity(token, characterId, item.id, item.quantity + 1)).catch(() => {})}>+</button>
                  </span>
                  <button type="button" className="link-btn danger" disabled={busy}
                    onClick={() => run(() => removeItem(token, characterId, item.id), item.name + ' saiu do inventário.').catch(() => {})}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ '--i': 2 }}>
            <h3 className="card-title">Dar item</h3>
            <div className="mform">
              <label htmlFor="m-find">Do catálogo <small>busque pelo nome</small></label>
              <div className="purse-row">
                <input id="m-find" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: poção, espada longa, tocha" />
                <input type="number" min={1} max={9999} aria-label="Quantidade" className="qty-in" value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              {query.trim() && results.length === 0 && <p className="muted-note">Nada com esse nome no catálogo.</p>}
              {results.length > 0 && (
                <ul className="cat-results">
                  {results.map(item => (
                    <li key={item.id}>
                      <span><b>{item.name}</b> <small>{CATALOG_KINDS[item.kind] ?? item.kind}{item.price ? ' · ' + item.price : ''}</small></span>
                      <button type="button" className="hp-act" disabled={busy || !qtyOk} onClick={() => giveCatalog(item)}>Dar {qtyOk ? quantity : ''}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form className="mform" onSubmit={giveCustom} noValidate>
              <span className="mlabel">Item livre <small>loot fora do catálogo</small></span>
              <label htmlFor="c-name">Nome</label>
              <input id="c-name" value={custom.name} maxLength={120} onChange={e => setC('name', e.target.value)} placeholder="Ex.: Elixir de Shurima" />
              <div className="mrow">
                <div>
                  <label htmlFor="c-qty">Quantidade</label>
                  <input id="c-qty" type="number" min={1} max={9999} value={custom.quantity} onChange={e => setC('quantity', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="c-weight">Peso (kg)</label>
                  <input id="c-weight" type="number" min={0} step="0.1" value={custom.weight} onChange={e => setC('weight', e.target.value)} placeholder="—" />
                </div>
                <div>
                  <label htmlFor="c-price">Preço (PO)</label>
                  <input id="c-price" type="number" min={0} value={custom.price} onChange={e => setC('price', e.target.value)} placeholder="—" />
                </div>
                <div>
                  <label htmlFor="c-rarity">Raridade</label>
                  <select id="c-rarity" value={custom.rarity} onChange={e => setC('rarity', e.target.value)}>
                    {Object.entries(RARITIES).map(([id, r]) => <option key={id} value={id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <label htmlFor="c-desc">Descrição</label>
              <textarea id="c-desc" className="note-body" rows={3} maxLength={4000} value={custom.description} onChange={e => setC('description', e.target.value)} />
              <label htmlFor="c-effect">Efeito</label>
              <textarea id="c-effect" className="note-body" rows={2} maxLength={4000} value={custom.effect} onChange={e => setC('effect', e.target.value)} placeholder="Ex.: recupera 2d4+2 PV" />
              <label className="check">
                <input type="checkbox" checked={custom.consumable} onChange={e => setC('consumable', e.target.checked)} />
                Consumível (o jogador pode usar e gastar)
              </label>
              <button className="btn" type="submit" disabled={busy || !custom.name.trim()}>DAR PARA {name.toUpperCase()}</button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
