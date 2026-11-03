import { useState } from 'react'

// Ícone da habilidade: a imagem do mestre (se houver) ou a inicial do nome. O formato diz o tipo
// (quadrado = habilidade, redondo = passiva, arco = magia); o selo no canto (círculo da magia) é opcional.
// Se a imagem falhar, volta para a inicial.
export default function AbilityIcon({ ability, badge, big, className = '' }) {
  const [broken, setBroken] = useState(null)
  const showImage = ability.icon && broken !== ability.icon

  return (
    <span className={'abl-icon t-' + ability.type.toLowerCase() + (big ? ' big' : '') + (showImage ? ' has-img' : '') + (className ? ' ' + className : '')} aria-hidden="true">
      {showImage
        ? <img className="abl-img" src={ability.icon} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(ability.icon)} />
        : <span className="abl-glyph">{(ability.name ?? '?').trim().charAt(0).toUpperCase() || '?'}</span>}
      {badge && <span className="abl-key">{badge}</span>}
    </span>
  )
}
