import { request } from './auth.js'

// Ficha do personagem logado: { character: {...}, inventory: [...] }.
// 404 quando a ficha ainda não foi criada; 401 quando a sessão venceu.
export const fetchSheet = token => request('/character/me', { token })
