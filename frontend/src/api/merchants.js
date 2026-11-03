import { request } from './auth.js'

// Mestre: monta as lojas e abre uma por vez.
export const fetchMerchants = token => request('/merchants', { token })

// merchant: { name, greeting, image, buyRate, haggleDc } (haggleDc 0 = não pechincha).
export const createMerchant = (token, merchant) => request('/merchants', { method: 'POST', token, body: merchant })

export const updateMerchant = (token, id, merchant) => request('/merchants/' + id, { method: 'PUT', token, body: merchant })

export const deleteMerchant = (token, id) => request('/merchants/' + id, { method: 'DELETE', token })

export const openMerchant = (token, id) => request('/merchants/' + id + '/open', { method: 'POST', token })

export const closeMerchant = (token, id) => request('/merchants/' + id + '/close', { method: 'POST', token })

// line: { catalogId, price, stock } ou { custom: { name, description, effect, weight, rarity, consumable }, price, stock }.
export const addMerchantItem = (token, id, line) => request('/merchants/' + id + '/items', { method: 'POST', token, body: line })

// stock nulo = sem limite.
export const updateMerchantItem = (token, id, lineId, price, stock) =>
  request('/merchants/' + id + '/items/' + lineId, { method: 'PATCH', token, body: { price, stock } })

export const removeMerchantItem = (token, id, lineId) => request('/merchants/' + id + '/items/' + lineId, { method: 'DELETE', token })

export const fetchMerchantTrades = (token, id) => request('/merchants/' + id + '/trades', { token })

// Jogador. O ping é leve: { id, name, revision } (id nulo = nenhuma loja aberta).
export const pingMerchant = token => request('/merchants/active/ping', { token })

export const fetchActiveMerchant = token => request('/merchants/active', { token })

// Devolvem { merchant, sheet }. price/unitValue: o valor que o jogador viu; se mudou, o back recusa sem cobrar.
export const buyFromMerchant = (token, lineId, quantity, price) =>
  request('/merchants/active/buy', { method: 'POST', token, body: { lineId, quantity, price } })

export const sellToMerchant = (token, entryId, quantity, unitValue) =>
  request('/merchants/active/sell', { method: 'POST', token, body: { entryId, quantity, unitValue } })

// Pechincha (skill: 'PERSUASION' | 'DECEPTION'), uma vez por abertura da loja: devolve a loja com os preços de quem pediu
// e haggle: { skill, d20, modifier, total, dc, percent } (percent negativo = desconto).
export const haggleWithMerchant = (token, skill) => request('/merchants/active/haggle', { method: 'POST', token, body: { skill } })

// Mestre: as pechinchas desta abertura.
export const fetchMerchantHaggles = (token, id) => request('/merchants/' + id + '/haggles', { token })
