import { request } from './auth.js'

// Rotas do painel do mestre (todas exigem o token da conta mestre).
export const fetchCharacters = token => request('/character', { token })

// Visão da mesa: [{ character, armorClass, manaLeft, manaMax }].
export const fetchTable = token => request('/character/table', { token })

export const fetchAbilities = (token, characterId) => request('/character/' + characterId + '/abilities', { token })

export const createAbility = (token, characterId, ability) =>
  request('/character/' + characterId + '/abilities', { method: 'POST', token, body: ability })

// icon: data URL, link http(s) ou null para remover.
export const setAbilityIcon = (token, characterId, abilityId, icon) =>
  request('/character/' + characterId + '/abilities/' + abilityId + '/icon', { method: 'PATCH', token, body: { icon } })

// Edita (mantém o ícone, se não vier outro, e os usos gastos).
export const updateAbility = (token, characterId, abilityId, ability) =>
  request('/character/' + characterId + '/abilities/' + abilityId, { method: 'PUT', token, body: ability })

export const deleteAbility = (token, characterId, abilityId) =>
  request('/character/' + characterId + '/abilities/' + abilityId, { method: 'DELETE', token })

export const fetchAllDocuments = token => request('/documents', { token })

export const fetchRecipients = token => request('/documents/recipients', { token })

export const createDocument = (token, doc) => request('/documents', { method: 'POST', token, body: doc })

export const updateDocument = (token, id, doc) => request('/documents/' + id, { method: 'PUT', token, body: doc })

// PV de qualquer ficha (mestre). Devolve a ficha (CharacterResponse).
export const setHpFor = (token, characterId, currentHp, tempHp) =>
  request('/character/' + characterId + '/hp', { method: 'PATCH', token, body: { currentHp, tempHp } })

// Bônus nos PV máximos (pode ser negativo). Devolve a ficha.
export const setMaxHpBonus = (token, characterId, maxHpBonus) =>
  request('/character/' + characterId + '/hp', { method: 'PATCH', token, body: { maxHpBonus } })

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

// Condições (ids; a lista substitui a atual) e Exaustão; nulos = mantém. Devolve a ficha (CharacterResponse).
export const setConditions = (token, characterId, conditions, exhaustion) =>
  request('/character/' + characterId + '/conditions', { method: 'PATCH', token, body: { conditions, exhaustion } })

export const setDeathSavesFor = (token, characterId, successes, failures) =>
  request('/character/' + characterId + '/death-saves', { method: 'PATCH', token, body: { successes, failures } })

export { fetchConditions } from './character.js'

// Fórmulas de Ofício conhecidas ('<ofício>:<fórmula>'; a lista substitui a atual). Devolve a ficha.
export const setFormulas = (token, characterId, formulas) =>
  request('/character/' + characterId + '/formulas', { method: 'PUT', token, body: { formulas } })

export { fetchFormulas } from './book.js'

export const setGold = (token, characterId, gold) => request('/character/' + characterId + '/gold', { method: 'PATCH', token, body: { gold } })

export const setInspiration = (token, characterId, inspiration) =>
  request('/character/' + characterId + '/inspiration', { method: 'PATCH', token, body: { inspiration } })
