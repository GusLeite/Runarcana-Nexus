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
