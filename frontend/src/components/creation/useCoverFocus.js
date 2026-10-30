import { useLayoutEffect, useState } from 'react'

// Mantém o personagem no centro do painel: object-fit cover corta as laterais, então a posição é calculada a partir
// do formato do painel e de onde o personagem está no quadro (focus e focusY, 0 a 1).
export function useCoverFocus(ref, clip) {
  const [pos, setPos] = useState('50% 50%')
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const box = el.parentElement
    const place = () => {
      if (!box.clientHeight) return
      const axis = (focus, shown) => (shown >= 1 ? 50 : Math.min(100, Math.max(0, ((focus - shown / 2) / (1 - shown)) * 100)))
      const ratio = box.clientWidth / box.clientHeight / (el.width / el.height)
      // Painel mais estreito que o quadro corta nos lados (x); mais largo, em cima e embaixo (y).
      setPos(ratio < 1 ? axis(clip.focus ?? 0.5, ratio) + '% 50%' : '50% ' + axis(clip.focusY ?? 0.5, 1 / ratio) + '%')
    }
    place()
    const watch = new ResizeObserver(place)
    watch.observe(box)
    return () => watch.disconnect()
  }, [ref, clip])
  return pos
}
