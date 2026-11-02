import { Fragment, useEffect, useRef, useState } from 'react'
import { CHARACTERS, TEST_CHARACTER, customCharacter } from './data/characters.js'
import { fetchMe, fetchPlayers, loadSession, loginAsTestPlayer, logout, saveSession } from './api/auth.js'
import CharacterPanel from './components/CharacterPanel.jsx'
import Separator from './components/Separator.jsx'
import LoginForm from './components/LoginForm.jsx'
import AddPlayerForm from './components/AddPlayerForm.jsx'
import PasswordForm from './components/PasswordForm.jsx'
import CharacterSheet from './components/sheet/CharacterSheet.jsx'
import MasterPanel from './components/master/MasterPanel.jsx'
import MasterGate from './components/master/MasterGate.jsx'
import { CrownIcon } from './components/sheet/icons.jsx'
import { play } from './audio/engine.js'
import useScene from './audio/useScene.js'

// O mestre entra pelo botão do topo, não pelos painéis; o LoginForm/PasswordForm usam este "personagem".
const MASTER = { id: 'mestre', name: 'MESTRE', role: 'Narrador de Runeterra', fx: '' }

// Tela inicial: o jogador escolhe o personagem e, em seguida, faz login com ele.
// Logado, abre a ficha do personagem (antes, pede a troca da senha inicial).
// O mestre entra pelo botão "MESTRE" e cai no painel do mestre.
export default function App() {
  const [hovered, setHovered] = useState(null)
  // Sessão salva entra direto no personagem (ou no painel do mestre); o useEffect abaixo confirma com o back-end.
  const [session, setSession] = useState(() => {
    const s = loadSession()
    return s?.token ? s : null
  })
  // Jogadores que o mestre adicionou, além dos da mesa original.
  const [extra, setExtra] = useState([])
  const characters = [...CHARACTERS, ...extra.map(customCharacter)]
  const [selectedId, setSelectedId] = useState(() => (session && !session.master ? session.username : null))
  const selected = selectedId === null ? -1 : characters.findIndex(c => c.id === selectedId)
  const [masterOpen, setMasterOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  // Sessão do personagem de teste do mestre: vive só na memória, a do mestre continua guardada.
  const [testSession, setTestSession] = useState(null)
  const [view, setView] = useState('account') // 'account' | 'password'
  const [notice, setNotice] = useState(null)
  const hoverTimer = useRef()

  const updateSession = s => {
    setSession(s)
    saveSession(s)
  }

  useEffect(() => {
    fetchPlayers().then(list => setExtra(list.map(p => p.username))).catch(() => {})
  }, [])

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
    play('login')
    updateSession(s)
    setView('account')
    setNotice(null)
  }
  const signOut = () => {
    play('logout')
    if (session) logout(session.token).catch(() => {})
    updateSession(null)
    setMasterOpen(false)
    back()
  }
  const passwordChanged = account => {
    play('success')
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
    hoverTimer.current = setTimeout(() => {
      setHovered(i)
      play('char', characters[i])
    }, 90)
  }
  const leaveRow = () => {
    clearTimeout(hoverTimer.current)
    setHovered(null)
  }
  const pick = i => {
    if (selected < 0) {
      play('choose', characters[i])
      setSelectedId(characters[i].id)
    }
  }
  const back = () => {
    setSelectedId(null)
    setHovered(null)
  }

  const chosen = selected < 0 ? null : characters[selected]
  const choosing = selected < 0
  const askPassword = session && (view === 'password' || session.mustChangePassword)

  const passwordForm = character => (
    <PasswordForm
      key={character.id + '-pw'}
      character={character}
      session={session}
      onDone={passwordChanged}
      onCancel={() => (session.mustChangePassword ? signOut() : setView('account'))}
      onExpired={sessionExpired}
    />
  )

  // Som de fundo: a ficha e a criação cuidam do próprio tom; aqui ficam o salão e o painel do mestre.
  const onSheet = !!chosen && !!session && !askPassword && !session.master
  useScene(onSheet || testSession ? null : session?.master && !askPassword ? 'master' : 'hall')

  const startTest = async () => {
    const res = await loginAsTestPlayer(session.token)
    setTestSession({ token: res.token, ...res.account })
  }
  const endTest = () => {
    if (testSession) logout(testSession.token).catch(() => {})
    setTestSession(null)
  }

  // Mestre jogando com o personagem de teste: a ficha de sempre, com a saída de volta ao painel.
  if (session?.master && testSession) {
    return (
      <CharacterSheet
        key="teste-sheet"
        character={TEST_CHARACTER}
        session={testSession}
        testing
        onLogout={endTest}
        onExpired={endTest}
      />
    )
  }

  // Mestre logado: painel do mestre (antes, a troca da senha inicial, sobre a tela de seleção).
  if (session?.master && !askPassword) {
    return (
      <MasterPanel
        session={session}
        notice={notice}
        onChangePassword={() => { setNotice(null); setView('password') }}
        onLogout={signOut}
        onExpired={sessionExpired}
        onTestPlayer={startTest}
      />
    )
  }

  let panel = null
  if (session?.master) {
    panel = <MasterGate>{passwordForm(MASTER)}</MasterGate>
  } else if (masterOpen && !session) {
    panel = (
      <MasterGate>
        <LoginForm key="mestre" character={MASTER} onLogin={signIn} onBack={() => setMasterOpen(false)} backLabel="Voltar" />
      </MasterGate>
    )
  } else if (addOpen && !session) {
    panel = (
      <MasterGate>
        <AddPlayerForm
          onCreated={username => { play('success'); setExtra(list => [...list, username]); setAddOpen(false) }}
          onBack={() => setAddOpen(false)}
        />
      </MasterGate>
    )
  } else if (chosen && !session) {
    panel = <LoginForm key={chosen.id} character={chosen} onLogin={signIn} onBack={back} />
  } else if (chosen && askPassword) {
    panel = passwordForm(chosen)
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
        {choosing && !session && (
          <button className="master-btn" type="button" onClick={() => setMasterOpen(true)}>
            <CrownIcon /> MESTRE
          </button>
        )}
      </header>
      <div className={'row' + (choosing && hovered !== null ? ' has-hot' : '')} onMouseLeave={leaveRow}>
        {characters.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <Separator hidden={!choosing} lit={choosing && (hovered === i - 1 || hovered === i)} />}
            <CharacterPanel
              character={c}
              hot={choosing && hovered === i}
              selected={selected === i}
              gone={!choosing && selected !== i}
              resting={choosing && hovered !== null && hovered !== i}
              focusable={choosing}
              onHover={() => enter(i)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onPick={() => pick(i)}
            />
          </Fragment>
        ))}
      </div>
      {choosing && !session && (
        <footer className="add-bar">
          <button className="add-card" type="button" onClick={() => setAddOpen(true)} aria-label="Adicionar novo jogador">
            <span className="add-plus" aria-hidden="true" />
            <span className="add-text">NOVO JOGADOR</span>
          </button>
        </footer>
      )}
      {panel}
    </div>
  )
}
