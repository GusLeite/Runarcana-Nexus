import { useEffect, useRef, useState } from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Desaceleração suave (rápido no começo, assenta no fim).
export const easeOutCubic = t => 1 - (1 - t) ** 3

// Número que "conta" até o valor, como os contadores do cliente do LoL.
// Na primeira vez parte de 0; depois, do valor anterior. Sem animação com prefers-reduced-motion.
export function useCountUp(value, duration = 700) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0))
  const from = useRef(prefersReducedMotion() ? value : 0)

  useEffect(() => {
    if (typeof value !== 'number' || Number.isNaN(value)) return
    if (prefersReducedMotion()) {
      setShown(value)
      from.current = value
      return
    }
    const start = performance.now()
    const begin = from.current
    let raf
    const tick = now => {
      const t = Math.min(1, (now - start) / duration)
      setShown(Math.round(begin + (value - begin) * easeOutCubic(t)))
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      from.current = value
    }
  }, [value, duration])

  return shown
}
