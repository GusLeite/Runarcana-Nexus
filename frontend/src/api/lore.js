import { request } from './auth.js'

// Verbetes que esta conta conhece. O servidor já filtra os conhecimentos por personagem.
export const fetchLore = token => request('/lore', { token })

// Só o mestre.
export const createLore = (token, entry) => request('/lore', { method: 'POST', token, body: entry })

export const updateLore = (token, id, entry) => request('/lore/' + id, { method: 'PUT', token, body: entry })

export const deleteLore = (token, id) => request('/lore/' + id, { method: 'DELETE', token })
