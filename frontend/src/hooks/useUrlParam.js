import { useCallback, useEffect, useRef, useState } from 'react'

// Lê um parâmetro da URL (?aba=inventario); fora da lista de valores aceitos, vale o padrão.
export function readParam(name, allowed, fallback, search = window.location.search) {
  const value = new URLSearchParams(search).get(name)
  return value != null && allowed.includes(value) ? value : fallback
}

// Monta a URL atual com o parâmetro trocado (o padrão some da URL, para ela ficar limpa).
export function withParam(name, value, fallback, href = window.location.href) {
  const url = new URL(href)
  if (value == null || value === fallback) url.searchParams.delete(name)
  else url.searchParams.set(name, value)
  return url.pathname + url.search + url.hash
}

// Estado guardado na URL: recarregar a página volta para o mesmo lugar e o "voltar" do navegador desfaz a troca.
// Sem react-router: só a query muda, então o Caddy e o APK continuam servindo o mesmo index.html.
// allowed: valores aceitos (em ids estáveis, como os das abas).
export default function useUrlParam(name, allowed, fallback) {
  const key = allowed.join('|')
  const [value, setValue] = useState(() => readParam(name, allowed, fallback))

  useEffect(() => {
    const onPop = () => setValue(readParam(name, key.split('|'), fallback))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [name, key, fallback])

  // Aceita valor ou função (como o setState); replace troca sem criar entrada no histórico.
  // O valor atual vem de um ref: o histórico não pode ser mexido dentro do updater (o StrictMode o roda duas vezes).
  const current = useRef(value)
  current.current = value
  const set = useCallback((next, { replace = false } = {}) => {
    const resolved = typeof next === 'function' ? next(current.current) : next
    if (resolved === current.current) return
    current.current = resolved
    const url = withParam(name, resolved, fallback)
    if (replace) window.history.replaceState(window.history.state, '', url)
    else window.history.pushState(window.history.state, '', url)
    setValue(resolved)
  }, [name, fallback])

  return [value, set]
}
