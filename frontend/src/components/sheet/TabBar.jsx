import { useLayoutEffect, useRef, useState } from 'react'

// Abas da barra do topo com o sublinhado dourado deslizando até a aba ativa (como a navegação do cliente).
// tabs: [{ id, label }]; badges: { [id]: número } (opcional); alertId: aba cujo contador é alerta (vermelho).
export default function TabBar({ tabs, active, onChange, badges = {}, alertId, label }) {
  const nav = useRef()
  const [ink, setInk] = useState(null)
  // Compara pelo conteúdo: o objeto de contadores é novo a cada render do pai.
  const badgeKey = JSON.stringify(badges)

  // Mede a aba ativa; repete ao trocar de aba, mudar um contador (a largura muda) ou redimensionar a janela.
  useLayoutEffect(() => {
    const measure = () => {
      const el = nav.current?.querySelector('[aria-selected="true"]')
      if (el) setInk({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active, badgeKey])

  return (
    <nav className="tabs" role="tablist" aria-label={label} ref={nav}>
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          className={'tab' + (active === t.id ? ' on' : '')}
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {badges[t.id] > 0 && (
            <span key={badges[t.id]} className={'tab-count' + (t.id === alertId ? ' alert' : '')}>{badges[t.id]}</span>
          )}
        </button>
      ))}
      {ink && <span className="tab-ink" style={{ transform: `translateX(${ink.left}px)`, width: ink.width }} aria-hidden="true" />}
    </nav>
  )
}
