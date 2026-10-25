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
