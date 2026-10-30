// Gaudron (minotauro gladiador): calor da arena subindo do chão e fagulhas de brasa enquanto durar o hover.
// Com .hot, a sequência da martelada: ele carrega (a tela escurece e a luz é puxada para o chão), o martelo desce
// aos 0,5 s (clarão, ondas de choque, tremor, rachaduras de lava, pedras e fagulhas) e a arena responde: a torcida
// grita o nome dele em três batidas, as tochas chamejam e caem panos vermelhos. Tudo some em ~3,6 s.

const SPARKS = Array.from({ length: 24 }, (_, i) => ({
  '--x': (i * 29 % 100) + '%',
  '--s': (3 + i * 5 % 4) + 'px',
  '--d': (3.5 + i * 7 % 4) + 's',
  '--dl': '-' + (i * 1.1 % 6).toFixed(1) + 's',
  '--dx': ((i % 2 ? 1 : -1) * (10 + i * 11 % 50)) + 'px',
}))

// Pseudoaleatório fixo: o desenho é sempre o mesmo e não muda entre renderizações.
const rnd = seed => {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

// Um traço irregular que sai de (x, y); o achatamento em y deita a rachadura no chão.
function jagged(x, y, angle, length, parts, seed) {
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`
  let a = angle
  for (let i = 0; i < parts; i++) {
    a += (rnd(seed + i) - .5) * 1.1
    x += Math.cos(a) * length / parts
    y += Math.sin(a) * length / parts * .3
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return { d, x, y, a }
}

const CRACKS = []
for (let i = 0; i < 11; i++) {
  const angle = i / 11 * Math.PI * 2 + rnd(i) * .35
  const length = 130 + rnd(i + 20) * 110
  const main = jagged(200, 120, angle, length, 6, i * 13)
  CRACKS.push({ d: main.d, delay: .5 + rnd(i + 40) * .06 })
  const branch = jagged(main.x, main.y, main.a + (i % 2 ? .8 : -.8), length * .32, 3, i * 17)
  CRACKS.push({ d: branch.d, delay: .68 + rnd(i + 60) * .1, thin: true })
}

// Pedras e fagulhas lançadas pelo golpe: dx na horizontal; up e fall na vertical.
const ROCKS = Array.from({ length: 20 }, (_, i) => ({
  '--dx': ((i % 2 ? 1 : -1) * (30 + rnd(i + 80) * 260)).toFixed(0) + 'px',
  '--up': (120 + rnd(i + 100) * 300).toFixed(0) + 'px',
  '--fall': (140 + rnd(i + 120) * 120).toFixed(0) + 'px',
  '--r': ((i % 2 ? 1 : -1) * (180 + rnd(i + 140) * 540)).toFixed(0) + 'deg',
  '--s': (8 + rnd(i + 160) * 18).toFixed(0) + 'px',
  '--d': (1 + rnd(i + 180) * .6).toFixed(2) + 's',
}))
const SHOWER = Array.from({ length: 28 }, (_, i) => ({
  '--dx': ((i % 2 ? 1 : -1) * (20 + rnd(i + 200) * 320)).toFixed(0) + 'px',
  '--up': (160 + rnd(i + 220) * 460).toFixed(0) + 'px',
  '--fall': (60 + rnd(i + 240) * 120).toFixed(0) + 'px',
  '--r': '0deg',
  '--s': (2 + rnd(i + 260) * 3).toFixed(1) + 'px',
  '--d': (.8 + rnd(i + 280) * .8).toFixed(2) + 's',
}))

// Panos vermelhos jogados das arquibancadas.
const CLOTH = Array.from({ length: 14 }, (_, i) => ({
  '--x': (4 + i * 37 % 92) + '%',
  '--w': (10 + rnd(i + 300) * 12).toFixed(0) + 'px',
  '--sway': ((i % 2 ? 1 : -1) * (20 + rnd(i + 320) * 60)).toFixed(0) + 'px',
  '--r': ((i % 2 ? 1 : -1) * (200 + rnd(i + 340) * 400)).toFixed(0) + 'deg',
  '--dl': (1 + rnd(i + 360) * 1).toFixed(2) + 's',
  '--d': (1.5 + rnd(i + 380) * .9).toFixed(2) + 's',
}))

const CHANT = ['GAU!', 'DRON!', 'GAUDRON!']

export default function Embers() {
  return (
    <>
      <div className="fx">
        <div className="heat" />
        {SPARKS.map((style, i) => <i key={i} className="sp" style={style} />)}
      </div>
      <div className="gd-arena" aria-hidden="true">
        <span className="gd-dark" />
        <span className="gd-charge" />
        <span className="gd-torch left" />
        <span className="gd-torch right" />
        <span className="gd-glow" />
        <svg className="gd-cracks" viewBox="0 0 400 240">
          {CRACKS.map((c, i) => (
            <path key={i} d={c.d} pathLength="100" className={c.thin ? 'thin' : undefined} style={{ animationDelay: c.delay + 's' }} />
          ))}
        </svg>
        <span className="gd-dust" />
        <span className="gd-dust d2" />
        <span className="gd-flash" />
        {ROCKS.map((style, i) => <i key={i} className={'gd-fly rock v' + i % 3} style={style}><b /></i>)}
        {SHOWER.map((style, i) => <i key={i} className="gd-fly spark" style={style}><b /></i>)}
        {CLOTH.map((style, i) => <i key={i} className="gd-cloth" style={style} />)}
        {CHANT.map((text, i) => <span key={i} className={'gd-chant c' + i}>{text}</span>)}
      </div>
    </>
  )
}
