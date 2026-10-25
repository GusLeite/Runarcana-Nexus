// Retrato placeholder em SVG para personagens que ainda não têm arte real.
// `hue` define a cor base e `variant` (0–4) o adereço da silhueta.
export function placeholderArt(hue, variant) {
  const c1 = `hsl(${hue},70%,38%)`
  const c2 = `hsl(${(hue + 40) % 360},60%,12%)`
  const hi = `hsl(${hue},90%,70%)`
  const extra = [
    `<path d="M120 150 L90 70 L150 120 Z M280 150 L310 70 L250 120 Z" fill="#0b0f18"/>`,
    `<path d="M130 160 Q200 20 270 160 Z" fill="#0b0f18"/>`,
    `<rect x="170" y="40" width="60" height="110" rx="20" fill="${hi}" opacity=".85"/>`,
    `<path d="M120 170 Q200 -10 280 170 L280 120 Q200 60 120 120 Z" fill="#0b0f18"/>`,
    `<circle cx="200" cy="120" r="110" fill="none" stroke="${hi}" stroke-width="5" opacity=".7"/>`,
  ][variant]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<radialGradient id="r" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="${hi}" stop-opacity=".55"/><stop offset="1" stop-color="${hi}" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="600" fill="url(#g)"/><rect width="400" height="600" fill="url(#r)"/>
<path d="M40 600 Q50 380 200 360 Q350 380 360 600 Z" fill="#0b0f18"/>
${extra}<ellipse cx="200" cy="210" rx="62" ry="78" fill="#151b28"/>
<rect x="180" y="270" width="40" height="60" fill="#151b28"/>
<path d="M150 200 H250" stroke="${hi}" stroke-width="5" opacity=".8"/></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
