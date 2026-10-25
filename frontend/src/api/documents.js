import { request } from './auth.js'

// Documentos que o mestre entregou ao jogador logado.
export const fetchDocuments = token => request('/documents/me', { token })

export const markDocumentRead = (token, id) => request('/documents/' + id + '/read', { method: 'POST', token })
