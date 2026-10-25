import { Fragment, useEffect, useRef, useState } from 'react'
import { CHARACTERS } from './data/characters.js'
import { usePanelSprings } from './hooks/usePanelSprings.js'
import { fetchMe, loadSession, logout, saveSession } from './api/auth.js'
import CharacterPanel from './components/CharacterPanel.jsx'
import Separator from './components/Separator.jsx'
import LoginForm from './components/LoginForm.jsx'
import PasswordForm from './components/PasswordForm.jsx'
import CharacterSheet from './components/sheet/CharacterSheet.jsx'

const indexOf = username => CHARACTERS.findIndex(c => c.id === username)

// Tela inicial: o jogador escolhe o personagem e, em seguida, faz login com ele.
// Logado, abre a ficha do personagem (antes, pede a troca da senha inicial).
export default function App() {
  const [hovered, setHovered] = useState(null)
  // Sessão salva entra direto no personagem; o useEffect abaixo confirma com o back-end.
  const [session, setSession] = useState(() => {
    const s = loadSession()
    return s && indexOf(s.username) >= 0 ? s : null
  })
  const [selected, setSelected] = useState(() => (session ? indexOf(session.username) : null))
  const [view, setView] = useState('account') // 'account' | 'password'
  const [skipPassword, setSkipPassword] = useState(false)
  const [notice, setNotice] = useState(null)
  const hoverTimer = useRef()
  const panels = usePanelSprings(CHARACTERS, hovered, selected)

  const updateSession = s => {
    setSession(s)
    saveSession(s)
  }

  useEffect(() => {
    if (!session) return
    fetchMe(session.token)
      .then(account => updateSession({ ...session, ...account }))
      .catch(err => {
        // Só descarta a sessão se o servidor recusou o token; servidor fora do ar não desloga.
        if (err.status === 401) updateSession(null)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = s => {
    updateSession(s)
    setView('account')
    setSkipPassword(false)
    setNotice(null)
  }
  const signOut = () => {
    if (session) logout(session.token).catch(() => {})
    updateSession(null)
    back()
  }
  const passwordChanged = account => {
    updateSession({ ...session, ...account })
    setView('account')
    setNotice('Senha alterada.')
  }
  const sessionExpired = () => {
    updateSession(null)
    setView('account')
  }

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
  const askPassword = session && (view === 'password' || (session.mustChangePassword && !skipPassword))

  let panel = null
  if (chosen && !session) {
    panel = <LoginForm key={chosen.id} character={chosen} onLogin={signIn} onBack={back} />
  } else if (chosen && askPassword) {
    panel = (
      <PasswordForm
        key={chosen.id + '-pw'}
        character={chosen}
        session={session}
        onDone={passwordChanged}
        onCancel={() => { setView('account'); setSkipPassword(true) }}
        onExpired={sessionExpired}
      />
    )
  } else if (chosen) {
    // Logado: a ficha ocupa a tela inteira no lugar da seleção.
    return (
      <CharacterSheet
        key={chosen.id + '-sheet'}
        character={chosen}
        session={session}
        notice={notice}
        onChangePassword={() => { setNotice(null); setView('password') }}
        onLogout={signOut}
        onExpired={sessionExpired}
      />
    )
  }

  return (
    <div className="stage">
      <header>
        <div className="logo">RUNARCANA</div>
        <div className="hint">
          {!chosen ? 'Escolha seu personagem para entrar'
            : session ? 'Bem-vindo, ' + chosen.name.toLowerCase() + '.'
            : 'Identifique-se, ' + chosen.name.toLowerCase() + '.'}
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
      {panel}
    </div>
  )
}
