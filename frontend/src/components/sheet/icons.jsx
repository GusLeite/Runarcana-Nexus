// Ícones pequenos da ficha, em SVG para herdar a cor do tema.
export function CoinIcon() {
  return (
    <svg className="coin" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" fill="#c8a24a" stroke="#f0c75e" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="5.5" fill="none" stroke="#7a5a1c" strokeWidth="1.2" />
      <path d="M10 6.5 13 10 10 13.5 7 10Z" fill="#f7dc8a" />
    </svg>
  )
}

// Ícone por tipo de documento do mestre.
export function DocIcon({ kind }) {
  const common = { viewBox: '0 0 24 24', 'aria-hidden': true }
  switch (kind) {
    case 'MAP':
      return <svg {...common}><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z" /><path d="M9 4v14M15 6v14" /></svg>
    case 'CLUE':
      return <svg {...common}><circle cx="10" cy="10" r="6" /><path d="M14.5 14.5 21 21" /></svg>
    case 'LORE':
      return <svg {...common}><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1Z" /><path d="M12 6v14" /></svg>
    case 'SECRET':
      return <svg {...common}><rect x="5" y="11" width="14" height="9" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
    case 'REWARD':
      return <svg {...common}><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9Z" /></svg>
    default:
      return <svg {...common}><rect x="3" y="5" width="18" height="14" /><path d="M3 6l9 7 9-7" /></svg>
  }
}

export function CrownIcon() {
  return (
    <svg className="crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5Z" /><path d="M5 19h14" /></svg>
  )
}

export function PinIcon() {
  return (
    <svg className="pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l-1 6 4 4H6l4-4ZM12 13v8" /></svg>
  )
}

export function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4" /><path d="M12 12h9M18 12v3M21 12v2" /></svg>
  )
}

export function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" /></svg>
  )
}
