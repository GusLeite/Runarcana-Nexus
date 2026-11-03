import { request } from './auth.js'

// Bandópolis no mapa. Resposta: { roll } (d10, nulo enquanto o mestre não rolar).
export const fetchBandle = token => request('/map/bandle', { token })

// Só o mestre: rola o dado no servidor e substitui a rolagem anterior.
export const rollBandle = token => request('/map/bandle/roll', { method: 'POST', token })

// Pontos de interesse que esta conta pode ver, com os comentários visíveis para ela.
export const fetchPois = token => request('/map/pois', { token })

// Só o mestre.
export const createPoi = (token, poi) => request('/map/pois', { method: 'POST', token, body: poi })

export const updatePoi = (token, id, poi) => request('/map/pois/' + id, { method: 'PUT', token, body: poi })

export const deletePoi = (token, id) => request('/map/pois/' + id, { method: 'DELETE', token })

// shared: a mesa inteira vê; falso: anotação só de quem escreveu.
export const addPoiComment = (token, id, comment) => request('/map/pois/' + id + '/comments', { method: 'POST', token, body: comment })

export const deletePoiComment = (token, id) => request('/map/pois/comments/' + id, { method: 'DELETE', token })

// Jogador: os próprios waypoints (até 3). Mestre: os de todos, só para ver.
export const fetchWaypoints = token => request('/map/waypoints', { token })

export const createWaypoint = (token, waypoint) => request('/map/waypoints', { method: 'POST', token, body: waypoint })

export const updateWaypoint = (token, id, waypoint) => request('/map/waypoints/' + id, { method: 'PUT', token, body: waypoint })

export const deleteWaypoint = (token, id) => request('/map/waypoints/' + id, { method: 'DELETE', token })

// O grupo no mapa: { x, y, trail: [{ x, y, label, createdAt }], fog, revealed: [slug] } (x nulo = fora do mapa).
export const fetchParty = token => request('/map/party', { token })

// Só o mestre. Cada movimento vira uma parada na trilha.
export const moveParty = (token, x, y, label) => request('/map/party', { method: 'PUT', token, body: { x, y, label } })

export const hideParty = token => request('/map/party', { method: 'DELETE', token })

export const clearPartyTrail = token => request('/map/party/trail', { method: 'DELETE', token })

export const setMapFog = (token, enabled) => request('/map/fog', { method: 'PUT', token, body: { enabled } })

export const setRegionRevealed = (token, slug, revealed) => request('/map/fog/' + slug, { method: 'PUT', token, body: { revealed } })
