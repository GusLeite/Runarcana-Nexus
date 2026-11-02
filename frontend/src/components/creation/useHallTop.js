import { useLayoutEffect, useState } from 'react'

// Os salões da criação começam logo abaixo da barra do topo, seja qual for a altura dela (muda no celular).
export default function useHallTop() {
  const [top, setTop] = useState(0)
  useLayoutEffect(() => {
    const measure = () => setTop(document.querySelector('header.topbar')?.getBoundingClientRect().bottom ?? 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return top
}
