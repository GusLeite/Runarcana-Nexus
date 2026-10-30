import { request } from './auth.js'

// Assistente de criação de personagem.
export const fetchCatalog = token => request('/creation/catalog', { token })

// Ficha em construção calculada pelo back (não salva nada).
export const previewCreation = (token, draft) => request('/creation/preview', { method: 'POST', token, body: draft })

export const createCharacter = (token, draft) => request('/creation', { method: 'POST', token, body: draft })
