import { request } from './auth.js'

// Consulta do livro: magias (Capítulo 10), rituais e tabelas, e as páginas do compêndio (Familiares, Tecmaturgia).
export const fetchSpells = token => request('/creation/spells', { token })

export const fetchRituals = token => request('/compendium/rituals', { token })

export const fetchCompendium = token => request('/compendium', { token })
