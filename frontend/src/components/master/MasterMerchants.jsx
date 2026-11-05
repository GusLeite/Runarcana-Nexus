import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addMerchantItem, closeMerchant, createMerchant, deleteMerchant, fetchMerchantHaggles, fetchMerchants, fetchMerchantTrades, openMerchant,
  removeMerchantItem, updateMerchant, updateMerchantItem,
} from '../../api/merchants.js'
import { fetchCatalog } from '../../api/master.js'
import { useLive } from '../../api/live.js'
import { ITEM_KINDS, RARITIES, SKILL_NAMES, rarityOf } from '../../data/rules.js'
import { fileToBanner, isIconLink } from '../../utils/iconImage.js'
import { CoinIcon } from '../sheet/icons.jsx'
import '../../styles/merchant.css'

const MAX_RESULTS = 40
const TRADES_POLL = 8000
const MAX_HAGGLE_DC = 40
const EMPTY = { name: '', greeting: '', image: null, buyRate: '50', haggleDc: '15' }
const EMPTY_CUSTOM = { name: '', description: '', effect: '', weight: '', price: '', stock: '', rarity: 'Common', consumable: false }
const plain = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const toDraft = m => ({ name: m.name, greeting: m.greeting ?? '', image: m.image, buyRate: String(m.buyRate), haggleDc: String(m.haggleDc ?? 15) })
const stockOf = text => (text.trim() === '' ? null : Number(text))

// Aba Mercadores do mestre: monta lojas (imagem, fala, itens, preços e estoque), abre uma por vez para os jogadores
// e acompanha o que cada um comprou e vendeu.
export default function MasterMerchants({ token, onError, onToast }) {
  const [merchants, setMerchants] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchMerchants(token)
      .then(list => {
        setMerchants(list)
        setSelectedId(id => id ?? list.find(m => m.active)?.id ?? list[0]?.id ?? null)
      })
      .catch(onError)
    fetchCatalog(token).then(setCatalog).catch(onError)
  }, [token, onError])

  // Abrir um fecha os outros: depois disso a lista inteira é buscada de novo.
  const put = useCallback(merchant => setMerchants(list => list.map(m => (m.id === merchant.id ? merchant : m))), [])

  const run = (action, done) => {
    setBusy(true)
    return action()
      .then(merchant => {
        if (merchant) put(merchant)
        if (done) onToast(done)
        return merchant
      })
      .catch(err => { onError(err); throw err })
      .finally(() => setBusy(false))
  }

  const create = () => {
    setBusy(true)
    createMerchant(token, { name: 'Novo mercador', greeting: null, image: null, buyRate: 50, haggleDc: 15 })
      .then(m => { setMerchants(list => [...list, m]); setSelectedId(m.id) })
      .catch(onError)
      .finally(() => setBusy(false))
  }

  const toggleOpen = m => {
    setBusy(true)
    ;(m.active ? closeMerchant(token, m.id) : openMerchant(token, m.id))
      .then(() => fetchMerchants(token))
      .then(list => {
        setMerchants(list)
        onToast(m.active ? m.name + ' fechou a loja.' : m.name + ' abriu a loja para os jogadores!')
      })
      .catch(onError)
      .finally(() => setBusy(false))
  }

  const remove = m => {
    if (!window.confirm('Apagar ' + m.name + ' e todo o movimento da loja?')) return
    setBusy(true)
    deleteMerchant(token, m.id)
      .then(() => {
        setMerchants(list => list.filter(o => o.id !== m.id))
        setSelectedId(id => (id === m.id ? null : id))
        onToast(m.name + ' foi apagado.')
      })
      .catch(onError)
      .finally(() => setBusy(false))
  }

  const selected = merchants?.find(m => m.id === selectedId) ?? null

  if (!merchants) return <p className="muted-note">Abrindo os mercadores…</p>

  return (
    <>
      <section className="card pick-card" style={{ '--i': 0 }}>
        <h3 className="card-title">Mercadores <small>um aberto por vez</small></h3>
        <div className="mer-pick">
          {merchants.map(m => (
            <button key={m.id} type="button" className={'mer-chip' + (m.id === selectedId ? ' on' : '')} aria-pressed={m.id === selectedId} onClick={() => setSelectedId(m.id)}>
              <span className="mer-chip-art" style={m.image ? { backgroundImage: `url("${m.image}")` } : undefined} />
              <span className="char-info">
                <span className="char-name">{m.name}</span>
                <span className={'char-sub' + (m.active ? ' mer-open' : '')}>{m.active ? '● loja aberta' : m.items.length + (m.items.length === 1 ? ' item' : ' itens')}</span>
              </span>
            </button>
          ))}
          <button type="button" className="mer-chip mer-new" disabled={busy} onClick={create}>+ NOVO MERCADOR</button>
        </div>
      </section>

      {selected && (
        <MerchantEditor
          key={selected.id}
          merchant={selected}
          catalog={catalog}
          token={token}
          busy={busy}
          run={run}
          onError={onError}
          onToast={onToast}
          onToggle={() => toggleOpen(selected)}
          onDelete={() => remove(selected)}
        />
      )}
    </>
  )
}

function MerchantEditor({ merchant, catalog, token, busy, run, onError, onToast, onToggle, onDelete }) {
  const id = merchant.id
  const [draft, setDraft] = useState(() => toDraft(merchant))
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState(EMPTY_CUSTOM)
  const [imageError, setImageError] = useState(null)
  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }))
  const setC = (key, value) => setCustom(c => ({ ...c, [key]: value }))

  const rate = Number(draft.buyRate)
  const rateOk = /^\d+$/.test(draft.buyRate.trim()) && rate <= 100
  const dc = Number(draft.haggleDc)
  const dcOk = /^\d+$/.test(draft.haggleDc.trim()) && dc <= MAX_HAGGLE_DC
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(merchant))
  const linkValue = draft.image && !draft.image.startsWith('data:') ? draft.image : ''

  const save = e => {
    e.preventDefault()
    if (!draft.name.trim()) return onToast('Dê um nome ao mercador.')
    if (!rateOk) return onToast('O quanto ele paga vai de 0 a 100%.')
    if (!dcOk) return onToast('A CD da pechincha vai de 0 (não pechincha) a ' + MAX_HAGGLE_DC + '.')
    run(() => updateMerchant(token, id, { name: draft.name.trim(), greeting: draft.greeting, image: draft.image, buyRate: rate, haggleDc: dc }), 'Mercador salvo.').catch(() => {})
  }

  const chooseFile = file => {
    if (!file) return
    setImageError(null)
    fileToBanner(file).then(image => set('image', image)).catch(err => setImageError(err.message))
  }

  const results = useMemo(() => {
    const items = catalog?.equipment?.items ?? []
    const q = plain(query.trim())
    if (!q) return []
    return items.filter(i => plain(i.name).includes(q)).slice(0, MAX_RESULTS)
  }, [catalog, query])

  const onShelf = new Set(merchant.items.map(l => l.catalogId))

  const addCustom = e => {
    e.preventDefault()
    if (!custom.name.trim()) return onToast('Dê um nome ao item.')
    const line = {
      price: custom.price === '' ? 0 : Number(custom.price),
      stock: stockOf(custom.stock),
      custom: {
        name: custom.name.trim(),
        description: custom.description.trim() || null,
        effect: custom.effect.trim() || null,
        weight: custom.weight === '' ? null : Number(custom.weight),
        rarity: custom.rarity,
        consumable: custom.consumable,
      },
    }
    run(() => addMerchantItem(token, id, line), line.custom.name + ' está à venda.')
      .then(() => setCustom(EMPTY_CUSTOM))
      .catch(() => {})
  }

  return (
    <>
      <section className={'card mer-stage' + (merchant.active ? ' live' : '')} style={{ '--i': 1 }}>
        <div className="mer-stage-info">
          <h3>{merchant.name}</h3>
          <p>{merchant.active ? 'Os jogadores já veem a aba MERCADOR na ficha.' : 'Fechado: os jogadores não veem esta loja.'}</p>
        </div>
        <button type="button" className={'mer-toggle' + (merchant.active ? ' close' : '')} disabled={busy} onClick={onToggle}>
          {merchant.active ? 'FECHAR A LOJA' : 'ABRIR A LOJA'}
        </button>
      </section>

      <div className="master-grid">
        <div className="mer-col">
          <section className="card" style={{ '--i': 2 }}>
            <h3 className="card-title">Prateleira <small>{merchant.items.length} {merchant.items.length === 1 ? 'item' : 'itens'}</small></h3>
            {merchant.items.length === 0 && <p className="muted-note">Nada à venda ainda. Escolha itens ao lado.</p>}
            <ul className="inv-rows">
              {merchant.items.map((line, n) => (
                <ShelfRow key={line.id + ':' + line.price + ':' + line.stock} line={line} n={n} busy={busy}
                  onSave={(price, stock) => run(() => updateMerchantItem(token, id, line.id, price, stock), line.name + ' atualizado.').catch(() => {})}
                  onRemove={() => run(() => removeMerchantItem(token, id, line.id), line.name + ' saiu da prateleira.').catch(() => {})} />
              ))}
            </ul>
          </section>

          <Trades token={token} merchantId={id} revision={merchant.revision} active={merchant.active} onError={onError} />
        </div>

        <div className="mer-col">
          <form className="card mform" style={{ '--i': 3 }} onSubmit={save} noValidate>
            <h3 className="card-title">Apresentação</h3>
            <div className="mer-banner-edit" style={draft.image ? { backgroundImage: `url("${draft.image}")` } : undefined}>
              {!draft.image && <span>Sem imagem</span>}
            </div>
            <div className="mer-image-actions">
              <label className="hp-act mer-file">
                ENVIAR IMAGEM
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { chooseFile(e.target.files[0]); e.target.value = '' }} />
              </label>
              {draft.image && <button type="button" className="link-btn danger" onClick={() => set('image', null)}>Tirar imagem</button>}
            </div>
            {imageError && <p className="err">{imageError}</p>}
            <label htmlFor="mer-link">Ou um link <small>http(s)</small></label>
            <input id="mer-link" value={linkValue} onChange={e => set('image', e.target.value.trim() || null)} placeholder="https://…" />
            {linkValue && !isIconLink(linkValue) && <p className="err">Use um link http(s), sem espaços.</p>}
            <label htmlFor="mer-name">Nome</label>
            <input id="mer-name" value={draft.name} maxLength={80} onChange={e => set('name', e.target.value)} />
            <label htmlFor="mer-greet">Fala <small>o que ele diz a quem chega</small></label>
            <textarea id="mer-greet" className="note-body" rows={3} maxLength={500} value={draft.greeting} onChange={e => set('greeting', e.target.value)}
              placeholder="Chegue mais, viajante. Tudo tem um preço…" />
            <label htmlFor="mer-rate">Paga quanto na venda <small>% do preço; 0 = não compra nada</small></label>
            <input id="mer-rate" type="number" min={0} max={100} value={draft.buyRate} onChange={e => set('buyRate', e.target.value)} />
            <label htmlFor="mer-dc">CD da pechincha <small>Persuasão ou Enganação; 0 = não pechincha</small></label>
            <input id="mer-dc" type="number" min={0} max={MAX_HAGGLE_DC} value={draft.haggleDc} onChange={e => set('haggleDc', e.target.value)} />
            <button className="btn" type="submit" disabled={busy || !dirty}>SALVAR</button>
            <button className="link-btn danger mer-delete" type="button" disabled={busy} onClick={onDelete}>Apagar mercador</button>
          </form>

          <section className="card" style={{ '--i': 4 }}>
            <h3 className="card-title">Colocar à venda</h3>
            <div className="mform">
              <label htmlFor="mer-find">Do catálogo <small>entra com o preço do livro</small></label>
              <input id="mer-find" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: poção, espada longa, tocha" />
              {query.trim() && results.length === 0 && <p className="muted-note">Nada com esse nome no catálogo.</p>}
              {results.length > 0 && (
                <ul className="cat-results">
                  {results.map(item => (
                    <li key={item.id}>
                      <span><b>{item.name}</b> <small>{item.price ?? ''}</small></span>
                      <button type="button" className="hp-act" disabled={busy || onShelf.has(item.id)}
                        onClick={() => run(() => addMerchantItem(token, id, { catalogId: item.id }), item.name + ' está à venda.').catch(() => {})}>
                        {onShelf.has(item.id) ? 'À venda' : 'Adicionar'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form className="mform" onSubmit={addCustom} noValidate>
              <span className="mlabel">Item único <small>fora do catálogo</small></span>
              <label htmlFor="mc-name">Nome</label>
              <input id="mc-name" value={custom.name} maxLength={120} onChange={e => setC('name', e.target.value)} placeholder="Ex.: Elixir de Shurima" />
              <div className="mrow">
                <div>
                  <label htmlFor="mc-price">Preço (PO)</label>
                  <input id="mc-price" type="number" min={0} value={custom.price} onChange={e => setC('price', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label htmlFor="mc-stock">Estoque</label>
                  <input id="mc-stock" type="number" min={0} max={9999} value={custom.stock} onChange={e => setC('stock', e.target.value)} placeholder="∞" />
                </div>
                <div>
                  <label htmlFor="mc-weight">Peso (kg)</label>
                  <input id="mc-weight" type="number" min={0} step="0.1" value={custom.weight} onChange={e => setC('weight', e.target.value)} placeholder="—" />
                </div>
                <div>
                  <label htmlFor="mc-rarity">Raridade</label>
                  <select id="mc-rarity" value={custom.rarity} onChange={e => setC('rarity', e.target.value)}>
                    {Object.entries(RARITIES).map(([key, r]) => <option key={key} value={key}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <label htmlFor="mc-desc">Descrição</label>
              <textarea id="mc-desc" className="note-body" rows={2} maxLength={4000} value={custom.description} onChange={e => setC('description', e.target.value)} />
              <label htmlFor="mc-effect">Efeito</label>
              <textarea id="mc-effect" className="note-body" rows={2} maxLength={4000} value={custom.effect} onChange={e => setC('effect', e.target.value)} placeholder="Ex.: recupera 2d4+2 PV" />
              <label className="check">
                <input type="checkbox" checked={custom.consumable} onChange={e => setC('consumable', e.target.checked)} />
                Consumível (o jogador pode usar e gastar)
              </label>
              <button className="btn" type="submit" disabled={busy || !custom.name.trim()}>COLOCAR À VENDA</button>
            </form>
          </section>
        </div>
      </div>
    </>
  )
}

// Linha da prateleira: preço e estoque se editam ali mesmo (estoque vazio = sem limite).
function ShelfRow({ line, n, busy, onSave, onRemove }) {
  const [price, setPrice] = useState(String(line.price))
  const [stock, setStock] = useState(line.stock == null ? '' : String(line.stock))
  const priceOk = /^\d+$/.test(price.trim())
  const stockOk = stock.trim() === '' || /^\d+$/.test(stock.trim())
  const dirty = price !== String(line.price) || stock !== (line.stock == null ? '' : String(line.stock))
  const save = e => {
    e.preventDefault()
    if (dirty && priceOk && stockOk) onSave(Number(price), stockOf(stock))
  }
  return (
    <li className="inv-row mer-row" style={{ '--r': rarityOf(line.rarity).color, '--n': n }}>
      <span className="inv-name">
        <b>{line.name}</b>
        <small>{ITEM_KINDS[line.kind] ?? line.kind}{line.stock === 0 ? ' · esgotado' : ''}</small>
      </span>
      <form className="mer-row-edit" onSubmit={save}>
        <label><CoinIcon /><input type="number" min={0} aria-label={'Preço de ' + line.name} value={price} onChange={e => setPrice(e.target.value)} /></label>
        <label>Qtd<input type="number" min={0} max={9999} aria-label={'Estoque de ' + line.name} placeholder="∞" value={stock} onChange={e => setStock(e.target.value)} /></label>
        <button type="submit" className="hp-act" disabled={busy || !dirty || !priceOk || !stockOk}>Salvar</button>
      </form>
      <button type="button" className="link-btn danger" disabled={busy} onClick={onRemove}>Remover</button>
    </li>
  )
}

// Movimento da loja; com ela aberta, atualiza sozinho.
function Trades({ token, merchantId, revision, active, onError }) {
  const [trades, setTrades] = useState([])
  const [haggles, setHaggles] = useState([])
  const live = useLive(token, ['merchants'])
  useEffect(() => {
    const load = () => Promise.all([
      fetchMerchantTrades(token, merchantId).then(setTrades),
      fetchMerchantHaggles(token, merchantId).then(setHaggles),
    ])
    load().catch(onError)
    if (!active) return undefined
    const off = live.listen(() => load().catch(() => {}))
    const t = setInterval(() => { if (!document.hidden && live.due()) load().catch(() => {}) }, TRADES_POLL)
    return () => { off(); clearInterval(t) }
  }, [token, merchantId, revision, active, onError, live])

  return (
    <section className="card" style={{ '--i': 5 }}>
      <h3 className="card-title">Movimento <small>últimas negociações</small></h3>
      {trades.length === 0 && <p className="muted-note">Ninguém negociou aqui ainda.</p>}
      <ul className="mer-trades">
        {trades.map(t => (
          <li key={t.id} className={t.kind === 'BUY' ? 'buy' : 'sell'}>
            <span><b>{t.characterName}</b> {t.kind === 'BUY' ? 'comprou' : 'vendeu'} {t.quantity > 1 ? t.quantity + '× ' : ''}{t.itemName}</span>
            <span className="mer-trade-total">{t.kind === 'BUY' ? '+' : '−'}{t.total} PO</span>
          </li>
        ))}
      </ul>
      {haggles.length > 0 && (
        <>
          <h4 className="mer-sub">Pechinchas <small>desta abertura</small></h4>
          <ul className="mer-trades">
            {haggles.map(h => (
              <li key={h.characterName} className={h.percent < 0 ? 'sell' : 'buy'}>
                <span><b>{h.characterName}</b> {SKILL_NAMES[h.skill]} {h.total} contra CD {h.dc}</span>
                <span className="mer-trade-total">{h.percent === 0 ? 'preço normal' : (h.percent > 0 ? '+' : '−') + Math.abs(h.percent) + '%'}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
