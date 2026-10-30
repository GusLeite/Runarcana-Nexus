import { ExitIcon, KeyIcon } from '../sheet/icons.jsx'
import CreationWizard from './CreationWizard.jsx'

// Tela exclusiva da criação, para a conta que ainda não tem personagem: sem herói, abas e rolagens da ficha.
export default function CreationScreen({ character, session, toast, onCreated, onError, onChangePassword, onLogout }) {
  return (
    <div className="sheet creation-screen" style={{ '--h': character.hue }}>
      <div className="sheet-bg" style={{ backgroundImage: `url("${character.img}")` }} aria-hidden="true" />

      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">RUNARCANA</div>
        </div>
        <h1 className="creation-heading">Criação de personagem</h1>
        <div className="topbar-right">
          <div className="who">
            <span className="who-name">{character.name}</span>
            <span className="who-sub">{session.username}</span>
          </div>
          <button className="icon-btn" type="button" onClick={onChangePassword} title="Alterar senha" aria-label="Alterar senha">
            <KeyIcon />
          </button>
          <button className="icon-btn" type="button" onClick={onLogout} title="Sair" aria-label="Sair">
            <ExitIcon />
          </button>
        </div>
      </header>

      <main className="creation-page">
        <div className="sheet-col">
          <CreationWizard token={session.token} defaultPlayer={session.username} onError={onError} onCreated={onCreated} />
        </div>
      </main>

      {toast && <div key={toast} className="toast" role="status">{toast}</div>}
    </div>
  )
}
