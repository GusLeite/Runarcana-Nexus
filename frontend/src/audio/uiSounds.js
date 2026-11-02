import { play, unlock } from './engine.js'

// Tudo que o mouse "sente": botões, abas, painéis clicáveis, links e marcadores.
const INTERACTIVE = 'button, [role="button"], [role="tab"], a[href], summary, input[type="checkbox"], input[type="radio"]'

// Som do clique em um controle, pela marca que ele já tem no código. `data-sfx="nome"` manda no resto ("none" cala).
export function clickSound(el) {
  const marked = el.getAttribute('data-sfx')
  if (marked) return marked === 'none' ? null : marked
  const has = c => el.classList.contains(c)
  if (el.getAttribute('role') === 'tab') return 'page'
  if (has('danger-btn') || has('danger')) return 'danger'
  if (has('master-btn')) return 'gate'
  if (el.type === 'checkbox' || el.type === 'radio') return 'toggle'
  if (el.type === 'submit' || has('btn')) return 'confirm'
  return 'tap'
}

// Na ficha e no painel do mestre (`.sheet`) os sons de interface seguem o estilo do cliente do LoL.
export const styled = (el, name) => (el.closest?.('.sheet') ? 'lol-' + name : name)

// Instala os sons de interface na página toda (por delegação: telas novas já nascem com som).
export function installUiSounds(root = document) {
  const wake = () => unlock()
  ;['pointerdown', 'pointerup', 'click', 'touchend', 'keydown'].forEach(type => root.addEventListener(type, wake, { capture: true }))

  root.addEventListener('click', e => {
    const el = e.target.closest?.(INTERACTIVE)
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return
    const name = clickSound(el)
    if (name) play(styled(el, name))
  })

  let over = null
  root.addEventListener('pointerover', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return
    const el = e.target.closest?.(INTERACTIVE)
    if (!el || el === over) return
    over = el
    if (el.disabled || el.getAttribute('data-sfx') === 'none') return
    play(styled(el, 'hover'))
  })

  // Digitar: pena raspando no papel nas anotações, um toque suave nos demais campos.
  root.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1 && e.key !== 'Backspace') return
    const tag = e.target.tagName
    if (tag === 'TEXTAREA') play('quill')
    else if (tag === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') play('key')
  })

  // Avisos que nascem na tela: erro (role=alert, .err), aviso (.toast) e subida de nível liberada.
  const watch = new MutationObserver(records => {
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (node.nodeType !== 1) continue
        const hit = sel => node.matches(sel) || node.querySelector(sel)
        if (hit('[role="alert"], .err')) play('error')
        else if (hit('.toast')) play('notice')
        else if (hit('.lvl-ready')) play('levelready')
      }
    }
  })
  watch.observe(root.body ?? root, { childList: true, subtree: true })
}
