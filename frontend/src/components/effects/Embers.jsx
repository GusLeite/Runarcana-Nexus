// Gaudron (gladiador): calor da arena subindo do chão e fagulhas de brasa.
const SPARKS = Array.from({ length: 24 }, (_, i) => ({
  '--x': (i * 29 % 100) + '%',
  '--s': (3 + i * 5 % 4) + 'px',
  '--d': (3.5 + i * 7 % 4) + 's',
  '--dl': '-' + (i * 1.1 % 6).toFixed(1) + 's',
  '--dx': ((i % 2 ? 1 : -1) * (10 + i * 11 % 50)) + 'px',
}))

export default function Embers() {
  return (
    <div className="fx">
      <div className="heat" />
      {SPARKS.map((style, i) => <i key={i} className="sp" style={style} />)}
    </div>
  )
}
