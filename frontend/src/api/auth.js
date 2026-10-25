// Cliente da autenticação do back-end (rotas /auth da API Spring).
// Em dev, o Vite repassa /runarcana para http://localhost:8080 (ver vite.config.js).
const API = import.meta.env.VITE_API_URL ?? '/runarcana'
const STORAGE_KEY = 'runarcana.session'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  let res
  try {
    res = await fetch(API + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor. Ele está ligado?')
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Erro inesperado (' + res.status + ').')
  return data
}

// Resposta: { token, expiresAt, account: { username, mustChangePassword } }
export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: { username, password } })

export const fetchMe = token => request('/auth/me', { token })

export const logout = token => request('/auth/logout', { method: 'POST', token })

export const changePassword = (token, currentPassword, newPassword) =>
  request('/auth/password', { method: 'PUT', token, body: { currentPassword, newPassword } })

// Sessão guardada no navegador para não pedir login a cada recarga.
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // sem armazenamento (aba anônima etc.): a sessão vale só até recarregar
  }
}
