import { request } from './auth.js'

// ---------- Mestre: bestiário ----------

// enemy: { name, image, maxHp, armorClass, initiativeBonus, speed, str, dex, con, intel, wis, cha, attacks, notes }
export const fetchEnemies = token => request('/combat/enemies', { token })
export const createEnemy = (token, enemy) => request('/combat/enemies', { method: 'POST', token, body: enemy })
export const updateEnemy = (token, id, enemy) => request('/combat/enemies/' + id, { method: 'PUT', token, body: enemy })
export const deleteEnemy = (token, id) => request('/combat/enemies/' + id, { method: 'DELETE', token })

// ---------- Mestre: confrontos ----------

export const fetchEncounters = token => request('/combat/encounters', { token })
export const fetchEncounter = (token, id) => request('/combat/encounters/' + id, { token })

// { name, enemies: [{ enemyId, count }], characterIds } (characterIds nulo = todos os personagens).
export const createEncounter = (token, encounter) => request('/combat/encounters', { method: 'POST', token, body: encounter })
export const renameEncounter = (token, id, name) => request('/combat/encounters/' + id, { method: 'PATCH', token, body: { name } })
export const deleteEncounter = (token, id) => request('/combat/encounters/' + id, { method: 'DELETE', token })

// { enemyId, count, hidden } ou { characterId }.
export const addCombatant = (token, id, body) => request('/combat/encounters/' + id + '/combatants', { method: 'POST', token, body })
// { initiative, clearInitiative, currentHp, hidden, defeated, name } (só os campos que mudam).
export const updateCombatant = (token, id, combatantId, body) =>
  request('/combat/encounters/' + id + '/combatants/' + combatantId, { method: 'PATCH', token, body })
export const removeCombatant = (token, id, combatantId) =>
  request('/combat/encounters/' + id + '/combatants/' + combatantId, { method: 'DELETE', token })

export const startEncounter = (token, id) => request('/combat/encounters/' + id + '/start', { method: 'POST', token })
export const endEncounter = (token, id) => request('/combat/encounters/' + id + '/end', { method: 'POST', token })
export const resetEncounter = (token, id) => request('/combat/encounters/' + id + '/reset', { method: 'POST', token })

// who: 'ENEMIES' | 'PLAYERS' | 'ALL' | 'MISSING'. Devolve { encounter, rolled: [{ id, name, d20, bonus, total }] }.
export const rollInitiatives = (token, id, who) => request('/combat/encounters/' + id + '/initiative', { method: 'POST', token, body: { who } })

// step 1 = próximo turno, -1 = volta.
export const passTurn = (token, id, step = 1) => request('/combat/encounters/' + id + '/turn', { method: 'POST', token, body: { step } })

// ---------- Mesa ----------

// O confronto ativo na visão de quem pede; null = nenhum.
export const fetchActiveCombat = token => request('/combat/active', { token })

// O jogador rola a própria iniciativa (uma vez): { encounter, roll } (roll igual ao de POST /rolls).
export const rollMyInitiative = token => request('/combat/active/initiative', { method: 'POST', token })
