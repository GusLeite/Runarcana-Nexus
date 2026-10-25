import { request } from './auth.js'

// Anotações pessoais do jogador logado.
export const fetchNotes = token => request('/notes', { token })

export const createNote = (token, note) => request('/notes', { method: 'POST', token, body: note })

export const updateNote = (token, id, note) => request('/notes/' + id, { method: 'PUT', token, body: note })

export const deleteNote = (token, id) => request('/notes/' + id, { method: 'DELETE', token })
