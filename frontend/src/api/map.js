import { request } from './auth.js'

// Bandópolis no mapa. Resposta: { roll } (d10, nulo enquanto o mestre não rolar).
export const fetchBandle = token => request('/map/bandle', { token })

// Só o mestre: rola o dado no servidor e substitui a rolagem anterior.
export const rollBandle = token => request('/map/bandle/roll', { method: 'POST', token })

// Pontos de interesse que esta conta pode ver, com os comentários visíveis para ela.
// as (só o mestre): o que aquele jogador vê ("Ver como"), sem as anotações privadas dele.
export const fetchPois = (token, as) => request('/map/pois' + (as ? '?as=' + encodeURIComponent(as) : ''), { token })

// Só o mestre.
export const createPoi = (token, poi) => request('/map/pois', { method: 'POST', token, body: poi })

export const updatePoi = (token, id, poi) => request('/map/pois/' + id, { method: 'PUT', token, body: poi })

export const deletePoi = (token, id) => request('/map/pois/' + id, { method: 'DELETE', token })

// shared: a mesa inteira vê; falso: anotação só de quem escreveu.
export const addPoiComment = (token, id, comment) => request('/map/pois/' + id + '/comments', { method: 'POST', token, body: comment })

export const deletePoiComment = (token, id) => request('/map/pois/comments/' + id, { method: 'DELETE', token })

// Jogador: os próprios waypoints (até 3). Mestre: os de todos, só para ver.
export const fetchWaypoints = (token, as) => request('/map/waypoints' + (as ? '?as=' + encodeURIComponent(as) : ''), { token })

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

// Só o mestre: revela (toAll e/ou jogadores) ou esconde o ponto, sem mexer no resto.
export const setPoiAudience = (token, id, toAll, recipients) =>
  request('/map/pois/' + id + '/audience', { method: 'PATCH', token, body: { toAll, recipients } })

// Leve: [{ id, name }] do que a conta vê (a ficha usa para avisar de local novo).
export const fetchVisiblePois = token => request('/map/pois/visible', { token })

// Galeria do ponto: lista de imagens (data URL ou link) de quem vê o ponto.
export const fetchPoiImages = (token, id) => request('/map/pois/' + id + '/images', { token })

// Só o mestre. Devolvem o ponto atualizado.
export const addPoiImage = (token, id, image) => request('/map/pois/' + id + '/images', { method: 'POST', token, body: { image } })

export const removePoiImage = (token, id, index) => request('/map/pois/' + id + '/images/' + index, { method: 'DELETE', token })

// MOSTRAR À MESA: os jogadores que veem o ponto abrem esta imagem na tela.
export const showPoiImage = (token, id, index) => request('/map/pois/' + id + '/spotlight', { method: 'POST', token, body: { index } })

// O que aconteceu ali: { entries: [entrada do diário ligadas ao ponto], stops: [{ x, y, label, createdAt }] }.
export const fetchPoiHistory = (token, id) => request('/map/pois/' + id + '/history', { token })

// Só o mestre: liga (toAll) ou desliga os lugares do mapa oficial para os jogadores, de uma região (slug) ou de todas (nulo). { changed }
export const setOfficialAudience = (token, region, toAll) =>
  request('/map/pois/official/audience', { method: 'PATCH', token, body: { region, toAll } })

// Trajetórias que os jogadores desenham: [{ id, owner, name, points: [{ x, y }] }]. Jogador: as suas; mestre: as de todos.
// as (só o mestre): as daquele jogador ("Ver como").
export const fetchRoutes = (token, as) => request('/map/routes' + (as ? '?as=' + encodeURIComponent(as) : ''), { token })

// Só jogador (até 5): nome opcional e 2 a 60 pontos.
export const createRoute = (token, route) => request('/map/routes', { method: 'POST', token, body: route })

export const deleteRoute = (token, id) => request('/map/routes/' + id, { method: 'DELETE', token })

// "Olhem aqui!" (só o mestre): leva a câmera de todos até { x, y } ou até o ponto { poiId }. Devolve { sentTo }.
export const focusMap = (token, target) => request('/map/focus', { method: 'POST', token, body: target })

// Ping: onda no lugar, para toda a mesa (no máximo 3 a cada 3 s).
export const pingMap = (token, x, y) => request('/map/ping', { method: 'POST', token, body: { x, y } })
