import { Fragment, useRef, useState } from 'react'
import { CHARACTERS } from './data/characters.js'
import { usePanelSprings } from './hooks/usePanelSprings.js'
import CharacterPanel from './components/CharacterPanel.jsx'
import Separator from './components/Separator.jsx'
import LoginForm from './components/LoginForm.jsx'

// Tela inicial: o jogador escolhe o personagem e, em seguida, faz login com ele.
export default function App() {
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const hoverTimer = useRef()
  const panels = usePanelSprings(CHARACTERS, hovered, selected)

  // Pequeno atraso no hover para o mouse atravessar os painéis sem disparar todos.
  const enter = i => {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHovered(i), 90)
  }
  const leaveRow = () => {
    clearTimeout(hoverTimer.current)
    setHovered(null)
  }
  const pick = i => {
    if (selected === null) setSelected(i)
  }
  const back = () => {
    setSelected(null)
    setHovered(null)
  }

  const chosen = selected === null ? null : CHARACTERS[selected]
  const choosing = selected === null

  return (
    <div className="stage">
      <header>
        <div className="logo">RUNARCANA</div>
        <div className="hint">
          {chosen ? 'Identifique-se, ' + chosen.name.toLowerCase() + '.' : 'Escolha seu personagem para entrar'}
        </div>
      </header>
      <div className="row" onMouseLeave={leaveRow}>
        {CHARACTERS.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <Separator hidden={!choosing} lit={choosing && (hovered === i - 1 || hovered === i)} />}
            <CharacterPanel
              ref={el => { panels.current[i] = el }}
              character={c}
              hot={choosing && hovered === i}
              selected={selected === i}
              gone={!choosing && selected !== i}
              focusable={choosing}
              onHover={() => enter(i)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onPick={() => pick(i)}
            />
          </Fragment>
        ))}
      </div>
      {chosen && <LoginForm key={chosen.id} character={chosen} onBack={back} />}
    </div>
  )
}
