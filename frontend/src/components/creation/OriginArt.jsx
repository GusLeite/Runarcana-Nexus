// Traços do sigilo provisório de cada origem (viewBox 100×100).
const SIGILS = {
  humano: ['M50 12 58 42 88 50 58 58 50 88 42 58 12 50 42 42Z', 'M50 30a20 20 0 1 0 .01 0'],
  minotauro: ['M18 20C16 46 32 58 50 58 68 58 84 46 82 20 76 36 64 44 50 44 36 44 24 36 18 20Z', 'M36 56 42 82 50 88 58 82 64 56', 'M45 76h.1M55 76h.1'],
  construto: ['M50 10 85 30V70L50 90 15 70V30Z', 'M50 30 67 40V60L50 70 33 60V40Z', 'M50 10V30M85 30 67 40M85 70 67 60M50 90V70M15 70 33 60M15 30 33 40'],
  antroplantae: ['M50 88C20 70 18 34 50 12 82 34 80 70 50 88Z', 'M50 88V30M50 66 34 52M50 66 66 52M50 48 38 38M50 48 62 38'],
  chireano: ['M50 40 44 30 46 42C36 34 22 32 10 40 18 44 22 52 22 60 28 54 34 54 38 60 40 54 44 52 50 66 56 52 60 54 62 60 66 54 72 54 78 60 78 52 82 44 90 40 78 32 64 34 54 42L56 30Z'],
  'meio-dragao': ['M10 50C28 24 72 24 90 50 72 76 28 76 10 50Z', 'M50 26C58 40 58 60 50 74 42 60 42 40 50 26Z', 'M50 8 54 18M30 12 36 22M70 12 64 22'],
  troll: ['M20 40C24 78 76 78 80 40', 'M34 58C30 44 30 30 36 18 40 30 44 44 44 62M66 58C70 44 70 30 64 18 60 30 56 44 56 62', 'M16 30 30 36M84 30 70 36'],
  vastaya: ['M76 12C44 14 26 40 28 70L20 88 34 74C62 74 80 46 76 12Z', 'M28 72C40 56 52 40 66 24', 'M44 52 60 54M38 60 50 64M52 42 66 38'],
  yordle: ['M50 40C34 40 26 52 26 64 26 78 38 86 50 86 62 86 74 78 74 64 74 52 66 40 50 40Z', 'M30 50 8 22 40 40M70 50 92 22 60 40', 'M41 62h.1M59 62h.1'],
  runinata: ['M50 8a42 42 0 1 0 .01 0', 'M50 14V86M30 30 50 46 70 30M30 70 50 54 70 70'],
}
const DEFAULT_SIGIL = ['M50 10 90 50 50 90 10 50Z', 'M50 30 70 50 50 70 30 50Z']

// Sempre os mesmos valores (o render não pode sortear): espalha as partículas pelo painel.
const MOTES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: ((i * 7) % 16) * 0.55,
  duration: 7 + (i * 5) % 6,
  drift: ((i * 13) % 50) - 25,
  size: 3 + (i * 3) % 6,
}))

const playMuted = video => {
  if (!video) return
  video.muted = true
  const p = video.play()
  if (p) p.catch(() => {})
}

// Só o sigilo da origem, com os traços desenhados (ver .oart-sigil em origin.css).
export function OriginSigil({ id }) {
  return (
    <svg className="oart-sigil" viewBox="0 0 100 100" aria-hidden="true">
      {(SIGILS[id] ?? DEFAULT_SIGIL).map((d, i) => (
        <path key={i} d={d} pathLength="1" style={{ '--n': i }} />
      ))}
    </svg>
  )
}

// Fundo de uma origem: vídeo ou imagem, se houver (mesma ideia do CharacterPanel), ou o sigilo provisório.
// large: versão do destaque, com anéis girando e partículas.
export default function OriginArt({ id, art, large }) {
  const hasMedia = !!(art.img || art.vid)
  return (
    <div className={'oart' + (large ? ' large' : '')} aria-hidden="true">
      {art.img && <div className="oart-img" style={{ backgroundImage: `url("${art.img}")`, backgroundPosition: art.pos }} />}
      {art.vid && <video className="oart-img" src={art.vid} poster={art.img} autoPlay muted loop playsInline ref={playMuted} style={{ objectPosition: art.pos }} />}
      {!hasMedia && (
        <div className="oart-holder">
          {large && <span className="oart-ring" />}
          {large && <span className="oart-ring r2" />}
          <OriginSigil id={id} />
        </div>
      )}
      {large && (
        <div className={'oart-motes m-' + art.motes}>
          {MOTES.map((m, i) => (
            <i key={i} style={{ left: m.left + '%', width: m.size * 2, height: m.size * 2, animationDelay: m.delay + 's', animationDuration: m.duration + 's', '--dx': m.drift + 'px' }} />
          ))}
        </div>
      )}
    </div>
  )
}
