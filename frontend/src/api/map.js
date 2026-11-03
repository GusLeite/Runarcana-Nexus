import { request } from './auth.js'

// Bandópolis no mapa. Resposta: { roll } (d10, nulo enquanto o mestre não rolar).
export const fetchBandle = token => request('/map/bandle', { token })

// Só o mestre: rola o dado no servidor e substitui a rolagem anterior.
export const rollBandle = token => request('/map/bandle/roll', { method: 'POST', token })
