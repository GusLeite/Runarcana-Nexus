// Pequenos efeitos disparados por código (o resto das animações é CSS, em styles/motion.css).

// Reinicia uma animação CSS de classe (ex.: "shake" no formulário quando a senha está errada).
export function replay(el, className) {
  if (!el) return
  el.classList.remove(className)
  void el.offsetWidth // força o navegador a "esquecer" a animação anterior
  el.classList.add(className)
}

// Espera a animação de saída antes de tirar o item da lista.
export const LEAVE_MS = 260
export const afterLeave = fn => setTimeout(fn, LEAVE_MS)
