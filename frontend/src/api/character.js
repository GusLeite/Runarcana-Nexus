import { request } from './auth.js'

// Ficha do personagem logado: { character, inventory, abilities }.
// 404 quando a ficha ainda não foi criada; 401 quando a sessão venceu.
export const fetchSheet = token => request('/character/me', { token })

export const setAbilityUses = (token, abilityId, usesLeft) =>
  request('/character/me/abilities/' + abilityId, { method: 'PATCH', token, body: { usesLeft } })

// type: 'SHORT' | 'LONG'. Devolve a lista de habilidades atualizada.
export const rest = (token, type) => request('/character/me/rest', { method: 'POST', token, body: { type } })
