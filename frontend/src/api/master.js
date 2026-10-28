import { request } from './auth.js'

// Rotas do painel do mestre (todas exigem o token da conta mestre).
export const fetchCharacters = token => request('/character', { token })

export const fetchAbilities = (token, characterId) => request('/character/' + characterId + '/abilities', { token })

export const createAbility = (token, characterId, ability) =>
  request('/character/' + characterId + '/abilities', { method: 'POST', token, body: ability })

// icon: data URL, link http(s) ou null para remover.
export const setAbilityIcon = (token, characterId, abilityId, icon) =>
  request('/character/' + characterId + '/abilities/' + abilityId + '/icon', { method: 'PATCH', token, body: { icon } })

export const deleteAbility = (token, characterId, abilityId) =>
  request('/character/' + characterId + '/abilities/' + abilityId, { method: 'DELETE', token })

export const fetchAllDocuments = token => request('/documents', { token })

export const fetchRecipients = token => request('/documents/recipients', { token })

export const createDocument = (token, doc) => request('/documents', { method: 'POST', token, body: doc })

export const deleteDocument = (token, id) => request('/documents/' + id, { method: 'DELETE', token })

// Regras da mesa: modo de traços da Runinata travado (traitBudget: id do modo ou null = o jogador escolhe).
export const fetchTableSettings = token => request('/creation/settings', { token })

export const updateTableSettings = (token, settings) => request('/creation/settings', { method: 'PUT', token, body: settings })

export { fetchCatalog } from './creation.js'

// Subida de nível: levels = [{ classId, subclassId, hpRoll, choices, heritages }] (os níveis novos).
export const previewLevelUp = (token, characterId, levels) =>
  request('/character/' + characterId + '/level-up/preview', { method: 'POST', token, body: { levels } })

export const applyLevelUp = (token, characterId, levels) =>
  request('/character/' + characterId + '/level-up', { method: 'POST', token, body: { levels } })

// Inventário, ouro e inspiração de uma ficha: { characterId, characterName, gold, inspiration, items }.
export const fetchInventory = (token, characterId) => request('/character/' + characterId + '/items', { token })

export const addCatalogItem = (token, characterId, catalogId, quantity) =>
  request('/character/' + characterId + '/items', { method: 'POST', token, body: { catalogId, quantity } })

// item: { name, description, effect, weight, price, rarity, quantity, consumable }.
export const addCustomItem = (token, characterId, item) =>
  request('/character/' + characterId + '/items/custom', { method: 'POST', token, body: item })

// 0 tira o item.
export const setItemQuantity = (token, characterId, entryId, quantity) =>
  request('/character/' + characterId + '/items/' + entryId, { method: 'PATCH', token, body: { quantity } })

export const removeItem = (token, characterId, entryId) =>
  request('/character/' + characterId + '/items/' + entryId, { method: 'DELETE', token })

export const setGold = (token, characterId, gold) => request('/character/' + characterId + '/gold', { method: 'PATCH', token, body: { gold } })

export const setInspiration = (token, characterId, inspiration) =>
  request('/character/' + characterId + '/inspiration', { method: 'PATCH', token, body: { inspiration } })
