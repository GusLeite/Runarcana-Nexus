import { useEffect, useRef } from 'react'
import Embers from './effects/Embers.jsx'
import BloodMagic from './effects/BloodMagic.jsx'
import Haunting from './effects/Haunting.jsx'
import ShieldOath from './effects/ShieldOath.jsx'

// Força o play mudo: alguns navegadores ignoram autoPlay sem `muted` setado via propriedade.
const playMuted = video => {
  if (!video) return
  video.muted = true
  const p = video.play()
  if (p) p.catch(() => {})
}

export default function CharacterPanel({ character: c, hot, selected, gone, resting, focusable, onHover, onFocus, onBlur, onPick }) {
  const video = useRef()
  // Com outro painel aceso (ou já descartado), o vídeo fica parado: decodificar quatro ao mesmo tempo pesa mais que o resto.
  useEffect(() => {
    if (!video.current) return
    if (resting || gone) video.current.pause()
    else playMuted(video.current)
  }, [resting, gone])

  const className = 'p'
    + (c.burst ? ' burst' : '')
    + (c.impact ? ' impact' : '')
    + (c.fx === 'haunt' ? ' haunted' : '')
    + (c.fx === 'oath' ? ' oath' : '')
    + (hot ? ' hot' : '')
    + (selected ? ' sel' : '')
    + (gone ? ' gone' : '')

  return (
    <div
      role="button"
      data-sfx="none"
      tabIndex={focusable ? 0 : -1}
      aria-label={'Entrar como ' + c.name}
      className={className}
      style={{ '--h': c.hue }}
      onMouseEnter={onHover}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onPick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPick()
        }
      }}
    >
      {c.vid ? (
        <video
          className="bg"
          src={c.vid}
          poster={c.img}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          ref={video}
          style={{ objectPosition: c.pos }}
        />
      ) : (
        <div className="bg" style={{ backgroundImage: `url("${c.img}")`, backgroundPosition: c.pos }} />
      )}
      <div className="shade" />
      {c.fx === 'embers' && <Embers />}
      {c.fx === 'blood' && <BloodMagic />}
      {c.fx === 'haunt' && <Haunting img={c.img} pos={c.pos} />}
      {c.fx === 'oath' && <ShieldOath />}
      {c.impact && <div className="ring" />}
      {c.impact && <div className="ring r2" />}
      <div className="cap">
        <div className="role">{c.role}</div>
        <div className="name">{c.name}</div>
        <div className="rule" />
        <div className="lore">{c.lore}</div>
      </div>
    </div>
  )
}
