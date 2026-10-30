import { request } from './auth.js'

// Ficha do personagem logado: { character, armorClass, attacks, spellcasting, inventory, abilities }.
// 404 quando a ficha ainda não foi criada; 401 quando a sessão venceu.
export const fetchSheet = token => request('/character/me', { token })

// Conjura no nível (nulo = o da magia): gasta a Mana ou um uso próprio. Devolve { level, manaCost, usedUse, abilities }.
export const castSpell = (token, abilityId, level) =>
  request('/character/me/abilities/' + abilityId + '/cast', { method: 'POST', token, body: { level } })

export const setAbilityUses = (token, abilityId, usesLeft) =>
  request('/character/me/abilities/' + abilityId, { method: 'PATCH', token, body: { usesLeft } })

// type: 'SHORT' | 'LONG'. prepared (só no longo): { classe: [chaves] } das magias preparadas. Devolve as habilidades.
export const rest = (token, type, prepared) => request('/character/me/rest', { method: 'POST', token, body: { type, prepared } })

// Magias que a ficha prepara (Acólito, Xamã): { classes: [{ classId, name, limit, maxSpellLevel, options, prepared }] }.
export const fetchPreparation = token => request('/character/me/preparation', { token })

// Defesa em uso: "UNARMORED", "RULE:<n>" ou "ITEM:<id>". Devolve a CA recalculada.
export const chooseDefense = (token, key) => request('/character/me/defense', { method: 'PATCH', token, body: { key } })
// Forma temporária ativa (nome; null = forma normal): devolve a ficha inteira recalculada.
export const chooseForm = (token, key) => request('/character/me/form', { method: 'PATCH', token, body: { key } })
// Liga ou desliga um efeito ativo (Fúria, Iras...): devolve a ficha inteira recalculada.
export const toggleEffect = (token, key) => request('/character/me/effect', { method: 'PATCH', token, body: { key } })

// Escudo em uso: "NONE" (sem escudo) ou "ITEM:<id>". Devolve a CA recalculada.
export const chooseShield = (token, key) => request('/character/me/shield', { method: 'PATCH', token, body: { key } })

// PV atual (0 até o máximo) e PV temporários. Devolve a ficha (CharacterResponse).
export const setHp = (token, currentHp, tempHp) => request('/character/me/hp', { method: 'PATCH', token, body: { currentHp, tempHp } })

// O jogador só gasta (decisão da mesa): 1 de um consumível, ouro e a inspiração acesa. Devolvem a ficha inteira.
export const consumeItem = (token, entryId) => request('/character/me/items/' + entryId + '/use', { method: 'POST', token })

// Testes contra a morte da própria ficha (0–3 cada). Devolve a ficha (CharacterResponse).
export const setDeathSaves = (token, successes, failures) =>
  request('/character/me/death-saves', { method: 'PATCH', token, body: { successes, failures } })

// Condições do livro: { exhaustionMax, exhaustion, conditions: [{ id, name, text }] }.
export const fetchConditions = token => request('/conditions', { token })

export const spendGold = (token, amount) => request('/character/me/gold/spend', { method: 'POST', token, body: { amount } })

export const spendInspiration = (token) => request('/character/me/inspiration/use', { method: 'POST', token })
