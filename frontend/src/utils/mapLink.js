// Links de locais do mapa: ?tela=mapa&ponto=12 abre o mapa já voando até o ponto.
// keep: mantém os outros parâmetros da URL (a aba aberta da ficha); o link para copiar vai limpo.
export const mapLinkPath = (poiId, href = window.location.href, keep = false) => {
  const url = new URL(href)
  if (!keep) url.search = ''
  url.hash = ''
  url.searchParams.set('tela', 'mapa')
  url.searchParams.set('ponto', String(poiId))
  return url.pathname + url.search
}

// Link completo para colar no chat, em documentos ou no diário.
export const mapLinkUrl = (poiId, href = window.location.href) => new URL(mapLinkPath(poiId, href), href).href

// Abre o mapa no ponto sem recarregar a página: troca a URL e avisa o WorldButtons (que escuta o popstate).
export function openMapAt(poiId) {
  window.history.pushState(window.history.state, '', mapLinkPath(poiId, window.location.href, true))
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// O ponto de um link (?ponto=12), ou null se não há um válido.
export function pointFromSearch(search) {
  const id = Number(new URLSearchParams(search).get('ponto'))
  return Number.isInteger(id) && id > 0 ? id : null
}

// A URL sem o ?ponto (ao fechar o mapa ela volta limpa).
export function withoutPoint(href) {
  const url = new URL(href)
  url.searchParams.delete('ponto')
  return url.pathname + url.search + url.hash
}
