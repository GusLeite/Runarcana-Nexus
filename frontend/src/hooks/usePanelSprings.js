import { useEffect, useRef } from 'react'

// Animação por mola: largura (flex-grow), progresso visual (--t) e opacidade de cada painel
// seguem um valor contínuo, atualizado direto no DOM a cada frame para não re-renderizar o React.
export function usePanelSprings(characters, hovered, selected) {
  const panels = useRef([])
  const hovRef = useRef(hovered)
  const selRef = useRef(selected)
  hovRef.current = hovered
  selRef.current = selected

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const state = characters.map(() => ({ g: 1, gv: 0, t: 0, tv: 0, o: 1, ov: 0 }))
    const spring = (x, v, target, dt) => {
      if (reduced) return [target, 0]
      const w = 4
      v += (w * w * (target - x) - 2 * w * v) * dt
      return [x + v * dt, v]
    }
    const clamp01 = n => Math.min(1, Math.max(0, n))

    let raf
    let last = performance.now()
    const tick = now => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      const hv = hovRef.current
      const sl = selRef.current
      state.forEach((s, i) => {
        let gt, tt, ot = 1
        if (sl === null) {
          gt = 1 + (hv === i ? 2.4 : 0) - (hv !== null && hv !== i ? 0.35 : 0)
          tt = hv === i ? 1 : 0
        } else {
          gt = sl === i ? 10 : 0
          tt = sl === i ? 0.6 : 0
          ot = sl === i ? 1 : 0
        }
        ;[s.g, s.gv] = spring(s.g, s.gv, gt, dt)
        ;[s.t, s.tv] = spring(s.t, s.tv, tt, dt)
        ;[s.o, s.ov] = spring(s.o, s.ov, ot, dt)

        const el = panels.current[i]
        if (!el) return
        el.style.flexGrow = Math.max(0, s.g).toFixed(4)
        el.style.setProperty('--t', clamp01(s.t).toFixed(4))
        el.style.opacity = clamp01(s.o).toFixed(3)
        if (characters[i].fx) {
          const fx = el.querySelector('.fx')
          if (fx) fx.style.display = s.t >= 0.004 ? '' : 'none'
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [characters])

  return panels
}
