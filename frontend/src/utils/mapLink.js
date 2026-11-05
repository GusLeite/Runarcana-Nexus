// Links do mapa: ?tela=mapa&ponto=12 abre o mapa voando até o ponto; ?tela=mapa&regiao=demacia, até a região.
// target: número = id de ponto; texto = slug de região; { x, y } = um lugar qualquer (?x=..&y=.., do "Olhem aqui!").
const SLUG = /^[a-z0-9-]+$/

const paramsOf = target => (typeof target === 'number' ? [['ponto', String(target)]]
  : typeof target === 'object' ? [['x', String(Math.round(target.x))], ['y', String(Math.round(target.y))]]
  : [['regiao', target]])
const FOCUS_PARAMS = ['ponto', 'regiao', 'x', 'y']

// keep: mantém os outros parâmetros da URL (a aba aberta da ficha); o link para copiar vai limpo.
export const mapLinkPath = (target, href = window.location.href, keep = false) => {
  const url = new URL(href)
  if (!keep) url.search = ''
  url.hash = ''
  FOCUS_PARAMS.forEach(p => url.searchParams.delete(p))
  url.searchParams.set('tela', 'mapa')
  paramsOf(target).forEach(([k, v]) => url.searchParams.set(k, v))
  return url.pathname + url.search
}

// Link completo para colar no chat, em documentos ou no diário.
export const mapLinkUrl = (target, href = window.location.href) => new URL(mapLinkPath(target, href), href).href

// Abre o mapa no lugar sem recarregar a página: troca a URL e avisa o WorldButtons (que escuta o popstate).
export function openMapAt(target) {
  window.history.pushState(window.history.state, '', mapLinkPath(target, window.location.href, true))
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// O foco de um link: { poiId }, { slug } ou { x, y }, ou undefined se não há um válido.
export function focusFromSearch(search) {
  const params = new URLSearchParams(search)
  const id = Number(params.get('ponto'))
  if (Number.isInteger(id) && id > 0) return { poiId: id }
  const slug = params.get('regiao')
  if (slug && SLUG.test(slug)) return { slug }
  const x = Number(params.get('x'))
  const y = Number(params.get('y'))
  const ok = v => params.get('x') !== null && Number.isFinite(v) && Math.abs(v) <= 1024
  return params.get('y') !== null && ok(x) && ok(y) ? { x, y } : undefined
}

// A URL sem o foco (ao fechar o mapa ela volta limpa).
export function withoutFocus(href) {
  const url = new URL(href)
  FOCUS_PARAMS.forEach(p => url.searchParams.delete(p))
  return url.pathname + url.search + url.hash
}

// Links de mapa (desta mesma página) dentro de um texto: [{ text } | { link, focus }], para os textos clicáveis.
const LINK = /(https?:\/\/[^\s]*[?&]tela=mapa[^\s]*)/g
export function splitMapLinks(text, origin = window.location.origin) {
  return text.split(LINK).filter(part => part !== '').map(part => {
    if (!part.startsWith('http')) return { text: part }
    try {
      const url = new URL(part)
      const focus = url.origin === origin ? focusFromSearch(url.search) : undefined
      return focus ? { link: part, focus } : { text: part }
    } catch {
      return { text: part }
    }
  })
}
