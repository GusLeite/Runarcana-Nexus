import { forwardRef } from 'react'
import Embers from './effects/Embers.jsx'

// Força o play mudo: alguns navegadores ignoram autoPlay sem `muted` setado via propriedade.
const playMuted = video => {
  if (!video) return
  video.muted = true
  const p = video.play()
  if (p) p.catch(() => {})
}

const CharacterPanel = forwardRef(function CharacterPanel(
  { character: c, hot, selected, gone, focusable, onHover, onFocus, onBlur, onPick },
  ref,
) {
  const className = 'p'
    + (c.burst ? ' burst' : '')
    + (c.impact ? ' impact' : '')
    + (hot ? ' hot' : '')
    + (selected ? ' sel' : '')
    + (gone ? ' gone' : '')

  return (
    <div
      ref={ref}
      role="button"
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
      <div className="bg" style={{ backgroundImage: `url("${c.img}")`, backgroundPosition: c.pos }} />
      {c.vid && (
        <video
          className="bg"
          src={c.vid}
          poster={c.img}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          ref={playMuted}
          style={{ objectPosition: c.pos }}
        />
      )}
      <div className="shade" />
      {c.fx === 'embers' && <Embers />}
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
})

export default CharacterPanel
