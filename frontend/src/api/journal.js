import { request } from './auth.js'

// Diário do grupo: [{ id, kind, who, title, body, createdAt, updatedAt, mine, poiId, poiName }], mais novas primeiro.
// kind: NOTE (escrita) ou evento automático (LOOT, GOLD, DOWNED, DOCUMENT, LEVEL_UP).
export const fetchJournal = token => request('/journal', { token })

export const createJournalEntry = (token, entry) => request('/journal', { method: 'POST', token, body: entry })

export const updateJournalEntry = (token, id, entry) => request('/journal/' + id, { method: 'PUT', token, body: entry })

export const deleteJournalEntry = (token, id) => request('/journal/' + id, { method: 'DELETE', token })
