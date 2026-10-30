// Proto (robô viajante e escudeiro que perdeu o mestre): ao passar o mouse, a visão de máquina liga e uma
// bússola-radar procura o mestre, sem resposta. Então o escudo se fecha, bate com uma onda de choque,
// se enche de hexágonos e some: ele segue viagem. A animação roda quando o painel ganha a classe .hot.

const LOG = ['BUSCANDO MESTRE…', 'SEM RESPOSTA', 'JURAMENTO MANTIDO', 'SEGUINDO VIAGEM']

const RIVETS = Array.from({ length: 16 }, (_, i) => i * 22.5)
const TICKS = Array.from({ length: 36 }, (_, i) => i * 10)

// Favo de hexágonos dentro do escudo; cada um acende conforme a distância do centro.
const R = 12
const HEXES = []
for (let q = -8; q <= 8; q++) {
  for (let r = -8; r <= 8; r++) {
    const x = R * Math.sqrt(3) * (q + r / 2)
    const y = R * 1.5 * r
    const dist = Math.hypot(x, y)
    if (dist > 80) continue
    const points = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 90) * (Math.PI / 180)
      return (100 + x + R * .9 * Math.cos(a)).toFixed(1) + ',' + (100 + y + R * .9 * Math.sin(a)).toFixed(1)
    }).join(' ')
    HEXES.push({ points, delay: (1.56 + dist / 80 * .37).toFixed(2) + 's' })
  }
}

// Poeira da estrada, soprada de lado enquanto o mouse está em cima.
const DUST = Array.from({ length: 14 }, (_, i) => ({
  '--y': (20 + i * 41 % 75) + '%',
  '--s': (2 + i * 5 % 3) + 'px',
  '--d': (5 + i * 7 % 5) + 's',
  '--dl': '-' + (i * 1.3 % 7).toFixed(1) + 's',
}))

export default function ShieldOath() {
  return (
    <div className="pt-oath" aria-hidden="true">
      <div className="fx">
        {DUST.map((style, i) => <i key={i} className="pt-dust" style={style} />)}
      </div>
      <span className="pt-scan" />
      <span className="pt-frame" />
      <svg className="pt-shield" viewBox="0 0 200 200">
        <g className="pt-radar">
          <circle cx="100" cy="100" r="58" className="pt-line thin" />
          <circle cx="100" cy="100" r="30" className="pt-line thin" />
          {TICKS.map(a => (
            <path key={a} d={a % 90 === 0 ? 'M100 14 v11' : 'M100 14 v5'} transform={`rotate(${a} 100 100)`} className="pt-line thin" />
          ))}
          <path d="M100 100 L100 14 A86 86 0 0 1 160.8 39.2 Z" className="pt-sweep" />
          <circle cx="100" cy="100" r="86" className="pt-ping" />
          <circle cx="100" cy="100" r="86" className="pt-ping p2" />
          <g className="pt-needle">
            <polygon points="100,38 106,100 94,100" className="north" />
            <polygon points="100,162 106,100 94,100" className="south" />
          </g>
        </g>
        <g className="pt-hexes">
          {HEXES.map((h, i) => <polygon key={i} points={h.points} style={{ animationDelay: h.delay }} />)}
        </g>
        <circle cx="100" cy="100" r="96" pathLength="100" className="pt-rim" />
        <circle cx="100" cy="100" r="88" pathLength="100" className="pt-rim inner" />
        {RIVETS.map(a => <circle key={a} cx="100" cy="8" r="1.7" transform={`rotate(${a} 100 100)`} className="pt-rivet" />)}
      </svg>
      <span className="pt-shock" />
      <span className="pt-flash" />
      {LOG.map((text, i) => <span key={i} className={'pt-log l' + i} style={{ '--n': text.length }}>{text}</span>)}
    </div>
  )
}
