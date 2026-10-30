// Rudo (arcanista de sangue): ao passar o mouse, um símbolo de ritual de sangue aparece de frente,
// cobrindo o painel inteiro. As linhas se desenham enquanto ele gira e cresce junto com a expansão
// do painel, pulsa e some sozinho (~2 s). A animação roda quando o painel ganha a classe .hot.

// Marcas rúnicas entre os dois anéis externos (um traço e uma barra em cada ângulo).
const RUNES = Array.from({ length: 16 }, (_, i) => i * 22.5)
// Pontas do hexagrama, onde ficam os círculos menores.
const POINTS = Array.from({ length: 6 }, (_, i) => {
  const a = (i * 60 - 90) * (Math.PI / 180)
  return [100 + 58 * Math.cos(a), 100 + 58 * Math.sin(a)]
})

export default function BloodMagic() {
  return (
    <div className="bl-ritual" aria-hidden="true">
      <svg className="bl-sigil" viewBox="0 0 200 200">
        {/* Anéis externos e runas giram num sentido... */}
        <g className="bl-spin">
          <circle cx="100" cy="100" r="96" pathLength="100" className="bl-line" />
          <circle cx="100" cy="100" r="86" pathLength="100" className="bl-line thin" />
          {RUNES.map(a => (
            <g key={a} transform={`rotate(${a} 100 100)`}>
              <path d="M100 7 v8 M96.5 11 h7" pathLength="100" className="bl-line rune" />
            </g>
          ))}
        </g>
        {/* ...e o hexagrama com os círculos das pontas gira no outro. */}
        <g className="bl-spin rev">
          <circle cx="100" cy="100" r="70" pathLength="100" className="bl-line" />
          <polygon points="100,42 150.2,129 49.8,129" pathLength="100" className="bl-line tri" />
          <polygon points="100,158 49.8,71 150.2,71" pathLength="100" className="bl-line tri" />
          {POINTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" pathLength="100" className="bl-line thin" />
          ))}
        </g>
        <circle cx="100" cy="100" r="30" pathLength="100" className="bl-line" />
        {/* Gota no centro, como selo do pacto de sangue. */}
        <path d="M100 82 C 92 94, 88 100, 88 106 a12 12 0 0 0 24 0 C 112 100, 108 94, 100 82 Z" pathLength="100" className="bl-line drop" />
      </svg>
      <span className="bl-flash" />
    </div>
  )
}
