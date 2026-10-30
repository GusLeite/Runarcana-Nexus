// Loge (assassino bêbado, assombrado pela princesa morta): ao passar o mouse a visão fica dupla e a
// arte cambaleia por alguns segundos; uma facada corta o painel ao meio, tudo escurece e o rosto dela
// surge, sussurra e se desfaz junto com os olhos. A animação roda quando o painel ganha a classe .hot.

const WHISPERS = ['você prometeu…', 'mais uma dose…', 'era pra ter sido você…']

// Fumaça vermelha subindo enquanto o mouse está em cima.
const WISPS = Array.from({ length: 12 }, (_, i) => ({
  '--x': (i * 37 % 100) + '%',
  '--w': (30 + i * 13 % 40) + 'px',
  '--d': (5 + i * 7 % 5) + 's',
  '--dl': '-' + (i * 1.3 % 7).toFixed(1) + 's',
  '--dx': ((i % 2 ? 1 : -1) * (20 + i * 17 % 60)) + 'px',
}))

export default function Haunting({ img, pos }) {
  const art = { backgroundImage: `url("${img}")`, backgroundPosition: pos }
  return (
    <div className="lg-haunt" aria-hidden="true">
      <div className="lg-double" style={art} />
      <div className="fx">
        {WISPS.map((style, i) => <i key={i} className="lg-wisp" style={style} />)}
      </div>
      <div className="lg-gap" />
      <div className="lg-slice a" style={art} />
      <div className="lg-slice b" style={art} />
      <svg className="lg-slash" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="92" y1="4" x2="8" y2="96" pathLength="100" vectorEffect="non-scaling-stroke" className="glow" />
        <line x1="92" y1="4" x2="8" y2="96" pathLength="100" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="lg-flash" />
      <div className="lg-dark" />
      <div className="lg-ghost" style={{ backgroundImage: `url("${img}")` }} />
      <div className="lg-eyes"><i /><i /></div>
      {WHISPERS.map((text, i) => <span key={i} className={'lg-whisper w' + i}>{text}</span>)}
    </div>
  )
}
