import { request } from './auth.js'

// Ficha do personagem logado: { character, armorClass, inventory, abilities }.
// 404 quando a ficha ainda não foi criada; 401 quando a sessão venceu.
export const fetchSheet = token => request('/character/me', { token })

export const setAbilityUses = (token, abilityId, usesLeft) =>
  request('/character/me/abilities/' + abilityId, { method: 'PATCH', token, body: { usesLeft } })

// type: 'SHORT' | 'LONG'. prepared (só no longo): { classe: [chaves] } das magias preparadas. Devolve as habilidades.
export const rest = (token, type, prepared) => request('/character/me/rest', { method: 'POST', token, body: { type, prepared } })

// Magias que a ficha prepara (Acólito, Xamã): { classes: [{ classId, name, limit, maxSpellLevel, options, prepared }] }.
export const fetchPreparation = token => request('/character/me/preparation', { token })

// Defesa em uso: "UNARMORED", "RULE:<n>" ou "ITEM:<id>". Devolve a CA recalculada.
export const chooseDefense = (token, key) => request('/character/me/defense', { method: 'PATCH', token, body: { key } })

// Escudo em uso: "NONE" (sem escudo) ou "ITEM:<id>". Devolve a CA recalculada.
export const chooseShield = (token, key) => request('/character/me/shield', { method: 'PATCH', token, body: { key } })

// PV atual (0 até o máximo) e PV temporários. Devolve a ficha (CharacterResponse).
export const setHp = (token, currentHp, tempHp) => request('/character/me/hp', { method: 'PATCH', token, body: { currentHp, tempHp } })
