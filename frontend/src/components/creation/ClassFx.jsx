import '../../styles/classfx.css'

// Animação de cada classe ao passar o mouse no salão: roda uma vez (cerca de 2 s) por cima do vídeo. Só existe na árvore com o
// painel aceso (display:none no CSS) e anima apenas transform e opacity, num quadro de tamanho fixo que não muda com o painel.
const list = (n, make) => Array.from({ length: n }, (_, i) => make(i))

const SCENES = {
  // Acólito: a luz desce do alto, um halo se abre e a cruz de fé pulsa.
  ACOLYTE: () => (
    <>
      <i className="beam" />
      <i className="beam b2" />
      <i className="beam b3" />
      <i className="halo" />
      <svg className="cross" viewBox="0 0 100 100"><path d="M50 8V92M24 34H76" /></svg>
      {list(8, i => <i key={i} className="mote" style={{ '--x': (8 + i * 12) + '%', '--dl': (i * 3 % 8) * .09 + 's' }} />)}
    </>
  ),
  // Arcanista: um círculo arcano gira e se abre, com seis cargas de mana orbitando até explodir.
  ARCANIST: () => (
    <>
      <svg className="circle" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="94" /><circle cx="100" cy="100" r="74" strokeDasharray="5 9" />
        <path d="M100 26 164 137H36ZM100 174 36 63H164Z" />
      </svg>
      <div className="orbit">{list(6, i => <i key={i} style={{ '--a': i * 60 + 'deg' }} />)}</div>
      <i className="nova" />
    </>
  ),
  // Atirador: a mira entra de longe, trava no alvo e dispara; o tiro risca o painel.
  MARKSMAN: () => (
    <>
      <svg className="scope" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="74" /><circle cx="100" cy="100" r="3" />
        <path d="M100 6V62M100 138V194M6 100H62M138 100H194" />
      </svg>
      <i className="flash" />
      <i className="tracer" />
      <i className="ring" />
      {list(5, i => <i key={i} className="shell" style={{ '--dx': (i - 2) * 46 + 'px', '--up': 60 + i * 37 % 90 + 'px', '--r': (i % 2 ? 1 : -1) * 300 + 'deg' }} />)}
    </>
  ),
  // Bodisatva: as pétalas do lótus se abrem e ondas de Ki saem do centro.
  BODHISATTVA: () => (
    <>
      <div className="lotus">{list(8, i => <i key={i} style={{ '--a': i * 45 + 'deg', '--dl': i * .05 + 's' }} />)}</div>
      {list(3, i => <i key={i} className="wave" style={{ '--dl': .35 + i * .3 + 's' }} />)}
      {list(7, i => <i key={i} className="petal" style={{ '--x': (10 + i * 13) + '%', '--dl': .3 + (i * 3 % 7) * .12 + 's', '--dx': (i % 2 ? 1 : -1) * (20 + i * 9) + 'px' }} />)}
    </>
  ),
  // Brutamontes: três garradas rasgam o painel e a tela treme.
  BRUTE: () => (
    <>
      <i className="dark" />
      {list(3, i => <i key={i} className="claw" style={{ '--x': -11 + i * 11 + '%', '--dl': .12 + i * .09 + 's' }} />)}
      <i className="flare" />
      {list(8, i => <i key={i} className="chip" style={{ '--dx': (i % 2 ? 1 : -1) * (30 + i * 23) + 'px', '--up': 40 + i * 31 % 150 + 'px', '--dl': .3 + i * .012 + 's' }} />)}
    </>
  ),
  // Caçador: pegadas se aproximam, a flecha cruza o painel e crava no centro.
  HUNTER: () => (
    <>
      {list(6, i => <i key={i} className="track" style={{ '--x': 14 + i * 14 + '%', '--y': (i % 2 ? 73 : 80) - i * 3 + '%', '--dl': i * .11 + 's' }} />)}
      <svg className="arrow" viewBox="0 0 200 24"><path d="M2 12H176M164 3 196 12 164 21ZM2 4 18 12 2 20M14 4 30 12 14 20" /></svg>
      <i className="hit" />
      {list(6, i => <i key={i} className="feather" style={{ '--dx': (i - 2.5) * 34 + 'px', '--up': 30 + i * 41 % 110 + 'px', '--r': (i % 2 ? 1 : -1) * 240 + 'deg' }} />)}
    </>
  ),
  // Guerreiro: duas espadas se cruzam, faíscas saem do choque e o escudo marca o golpe.
  FIGHTER: () => (
    <>
      <svg className="sword left" viewBox="0 0 40 240"><path d="M20 4 28 30V180H12V30ZM2 180H38M20 180V232" /></svg>
      <svg className="sword right" viewBox="0 0 40 240"><path d="M20 4 28 30V180H12V30ZM2 180H38M20 180V232" /></svg>
      <i className="clash" />
      <i className="clang" />
      {list(10, i => <i key={i} className="spark" style={{ '--a': i * 36 + 12 + 'deg', '--d': 70 + i * 47 % 120 + 'px' }} />)}
    </>
  ),
  // Mercurial: fumaça, adagas lançadas de lados opostos e um corte que some no escuro.
  MERCURIAL: () => (
    <>
      {list(5, i => <i key={i} className="smoke" style={{ '--x': 12 + i * 19 + '%', '--dl': i * .07 + 's', '--dx': (i - 2) * 26 + 'px' }} />)}
      {list(3, i => (
        <svg key={i} className={'dagger d' + i} viewBox="0 0 100 20"><path d="M2 10 62 3 98 10 62 17ZM62 0V20" /></svg>
      ))}
      <i className="cut" />
    </>
  ),
  // Xamã: espíritos sobem em espiral a partir do chão e uma chama cresce no centro.
  SHAMAN: () => (
    <>
      <i className="flame" />
      <i className="flame f2" />
      {list(7, i => (
        <i key={i} className="rise" style={{ '--x': 16 + i * 11 + '%', '--dl': i * .13 + 's', '--sw': (i % 2 ? 1 : -1) * (18 + i * 5) + 'px' }}><b /></i>
      ))}
      <svg className="totem" viewBox="0 0 100 100"><path d="M50 6C72 34 76 52 63 72 56 82 44 82 37 72 24 52 40 42 50 6ZM50 94V54M50 70 38 58M50 70 62 58" /></svg>
    </>
  ),
}

export default function ClassFx({ id }) {
  const Scene = SCENES[id]
  if (!Scene) return null
  return <span className={'cfx cfx-' + id.toLowerCase()} aria-hidden="true"><Scene /></span>
}
