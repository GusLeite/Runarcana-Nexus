import { useCallback, useEffect, useRef, useState } from 'react'
import MasterDocuments from './MasterDocuments.jsx'
import MasterAbilities from './MasterAbilities.jsx'
import TabBar from '../sheet/TabBar.jsx'
import { CrownIcon, ExitIcon, KeyIcon } from '../sheet/icons.jsx'
import '../../styles/sheet.css'
import '../../styles/master.css'

const TABS = [
  { id: 'documents', label: 'DOCUMENTOS' },
  { id: 'abilities', label: 'HABILIDADES' },
]

// Painel do mestre: mesma moldura da ficha, com as abas de documentos e de habilidades.
export default function MasterPanel({ session, notice, onChangePassword, onLogout, onExpired }) {
  const [tab, setTab] = useState('documents')
  const [toast, setToast] = useState(notice)
  const expired = useRef(onExpired)
  expired.current = onExpired

  // 401 desloga; o resto vira aviso.
  const onError = useCallback(err => {
    if (err.status === 401) expired.current()
    else setToast(err.message)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="sheet master" style={{ '--h': 42 }}>
      <div className="sheet-bg master-bg" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">RUNARCANA</div>
          <span className="master-badge"><CrownIcon /> MESTRE</span>
        </div>
        <TabBar tabs={TABS} active={tab} onChange={setTab} label="Seções do mestre" />
        <div className="topbar-right">
          <div className="who">
            <span className="who-name">Mestre</span>
            <span className="who-sub">{session.username}</span>
          </div>
          <button className="icon-btn" type="button" onClick={onChangePassword} title="Alterar senha" aria-label="Alterar senha"><KeyIcon /></button>
          <button className="icon-btn" type="button" onClick={onLogout} title="Sair" aria-label="Sair"><ExitIcon /></button>
        </div>
      </header>

      <main className="master-body">
        {tab === 'documents' && <MasterDocuments token={session.token} onError={onError} onToast={setToast} />}
        {tab === 'abilities' && <MasterAbilities token={session.token} onError={onError} onToast={setToast} />}
      </main>

      {toast && <div key={toast} className="toast" role="status">{toast}</div>}
    </div>
  )
}
