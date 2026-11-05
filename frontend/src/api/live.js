// Canal ao vivo (Server-Sent Events, rotas /live do back). Uma conexão só por aba, dividida por quem assina.
// O servidor manda só o tópico que mudou ({ topic: 'map' }); quem assina busca de novo pelas rotas de sempre.
// Ao (re)conectar, todos os assinantes são chamados para conferir o que perderam.
// Sem canal (caiu, EventSource ausente, proxy ruim), o polling de cada tela segue no ritmo normal;
// com o canal ligado, ele vira só reserva (a cada LIVE_FALLBACK_MS).
import { useEffect, useMemo, useRef } from 'react'
import { request } from './auth.js'

const API = import.meta.env.VITE_API_URL ?? '/runarcana'
export const LIVE_FALLBACK_MS = 60000
const DEBOUNCE_MS = 250
const CLOSE_IDLE_MS = 3000 // espera antes de fechar sem assinantes (troca de tela não derruba o canal)
const MAX_RETRY_MS = 30000
// Eventos com dados (sinais efêmeros do mapa): vão direto, sem agrupar, e não são chamados ao reconectar.
export const DATA_EVENTS = ['map-focus', 'map-ping']

const subs = new Set() // { token, topics: Set, fn, timer, event? }
let conn = null // { token, source, connected, attempt, retry, closing, dead }

function call(sub) {
  clearTimeout(sub.timer)
  sub.timer = setTimeout(() => { if (subs.has(sub)) sub.fn() }, DEBOUNCE_MS)
}

function connect(c) {
  if (c.dead || typeof EventSource === 'undefined') return
  request('/live/ticket', { method: 'POST', token: c.token })
    .then(({ ticket }) => {
      if (c.dead) return
      const source = new EventSource(API + '/live/stream?ticket=' + encodeURIComponent(ticket))
      c.source = source
      source.addEventListener('hello', () => {
        c.connected = true
        c.attempt = 0
        subs.forEach(s => { if (s.token === c.token && !s.event) call(s) })
      })
      DATA_EVENTS.forEach(name => source.addEventListener(name, e => {
        let data
        try { data = JSON.parse(e.data) } catch { return }
        subs.forEach(s => { if (s.token === c.token && s.event === name) s.fn(data) })
      }))
      source.addEventListener('change', e => {
        let topic
        try { topic = JSON.parse(e.data).topic } catch { return }
        subs.forEach(s => { if (s.token === c.token && s.topics.has(topic)) call(s) })
      })
      // O EventSource tentaria de novo com a mesma URL, mas o ticket é de uso único: fecha e pede outro.
      source.onerror = () => {
        source.close()
        retry(c)
      }
    })
    .catch(err => {
      if (err?.status === 401) { c.dead = true; return } // sessão inválida: o polling segue, o login trata
      retry(c)
    })
}

function retry(c) {
  if (c.dead) return
  c.connected = false
  const wait = Math.min(MAX_RETRY_MS, 1000 * 2 ** c.attempt++)
  c.retry = setTimeout(() => connect(c), wait)
}

function close(c) {
  c.dead = true
  clearTimeout(c.retry)
  clearTimeout(c.closing)
  c.source?.close()
  if (conn === c) conn = null
  c.connected = false
}

function ensure(token) {
  if (conn && conn.token !== token) close(conn)
  if (!conn) {
    conn = { token, source: null, connected: false, attempt: 0, retry: null, closing: null, dead: false }
    connect(conn)
  }
  clearTimeout(conn.closing)
}

// Assina tópicos; devolve a função que cancela. fn é chamada (agrupada em 250 ms) a cada aviso e ao reconectar.
export function subscribeLive(token, topics, fn) {
  if (!token) return () => {}
  const sub = { token, topics: new Set(topics), fn, timer: null }
  subs.add(sub)
  ensure(token)
  return () => {
    clearTimeout(sub.timer)
    subs.delete(sub)
    const c = conn
    if (c && ![...subs].some(s => s.token === c.token)) {
      clearTimeout(c.closing)
      c.closing = setTimeout(() => close(c), CLOSE_IDLE_MS)
    }
  }
}

// Assina um evento com dados (DATA_EVENTS); fn(data) a cada um. Mantém o canal aberto como os tópicos.
export function subscribeLiveEvent(token, name, fn) {
  if (!token) return () => {}
  const sub = { token, topics: new Set(), fn, timer: null, event: name }
  subs.add(sub)
  ensure(token)
  return () => {
    subs.delete(sub)
    const c = conn
    if (c && ![...subs].some(s => s.token === c.token)) {
      clearTimeout(c.closing)
      c.closing = setTimeout(() => close(c), CLOSE_IDLE_MS)
    }
  }
}

// Hook: fn pode mudar a cada render (lê o estado atual) sem reabrir a assinatura.
export function useLiveEvent(token, name, fn) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => subscribeLiveEvent(token, name, data => ref.current(data)), [token, name])
}

export const isLiveConnected = token => !!(conn && conn.token === token && conn.connected)

// Para os testes: derruba tudo.
export function resetLive() {
  if (conn) close(conn)
  subs.forEach(s => clearTimeout(s.timer))
  subs.clear()
}

// Uso numa tela:
//   const live = useLive(token, ['map'])
//   useEffect(() => {
//     const check = () => { ...busca... }
//     check()
//     const off = live.listen(check)                                 // aviso do tópico e reconexão
//     const t = setInterval(() => { if (live.due()) check() }, POLL)  // reserva
//     return () => { off(); clearInterval(t) }
//   }, [live])
// due(): sem canal, sempre; com canal, no máximo uma vez a cada LIVE_FALLBACK_MS.
export function liveHandle(token, topics) {
  let last = 0
  return {
    listen: fn => subscribeLive(token, topics, fn),
    due() {
      if (!isLiveConnected(token)) return true
      const now = Date.now()
      if (now - last < LIVE_FALLBACK_MS) return false
      last = now
      return true
    },
  }
}

export function useLive(token, topics) {
  const key = topics.join(',')
  return useMemo(() => liveHandle(token, key.split(',')), [token, key])
}

