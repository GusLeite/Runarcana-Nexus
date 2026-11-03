import { useCallback, useEffect, useRef, useState } from 'react'
import MasterDocuments from './MasterDocuments.jsx'
import MasterAbilities from './MasterAbilities.jsx'
import MasterRules from './MasterRules.jsx'
import MasterSheets from './MasterSheets.jsx'
import MasterInventory from './MasterInventory.jsx'
import MasterTable from './MasterTable.jsx'
import MasterMerchants from './MasterMerchants.jsx'
import MasterAccounts from './MasterAccounts.jsx'
import WorldButtons from '../map/WorldButtons.jsx'
import GroupJournal from '../sheet/GroupJournal.jsx'
import TabBar from '../sheet/TabBar.jsx'
import useUrlParam from '../../hooks/useUrlParam.js'
import { CrownIcon, ExitIcon, FlaskIcon, KeyIcon } from '../sheet/icons.jsx'
import '../../styles/sheet.css'
import '../../styles/master.css'

const TABS = [
  { id: 'table', label: 'MESA' },
  { id: 'documents', label: 'DOCUMENTOS' },
  { id: 'abilities', label: 'HABILIDADES' },
  { id: 'sheets', label: 'FICHAS' },
  { id: 'inventory', label: 'INVENTÁRIO' },
  { id: 'merchants', label: 'MERCADORES' },
  { id: 'journal', label: 'DIÁRIO' },
  { id: 'rules', label: 'REGRAS' },
  { id: 'accounts', label: 'CONTAS' },
]
const TAB_IDS = TABS.map(t => t.id)

// Painel do mestre: mesma moldura da ficha, com as abas da mesa (todos os personagens de uma vez), documentos, habilidades, fichas (subida de nível), inventário (itens, ouro e inspiração), mercadores, diário do grupo, regras da mesa e contas (senhas provisórias).
export default function MasterPanel({ session, notice, onChangePassword, onLogout, onExpired, onTestPlayer }) {
  // A aba fica na URL (?aba=…), como na ficha.
  const [tab, setTab] = useUrlParam('aba', TAB_IDS, 'table')
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
          <button className="test-btn" type="button" onClick={() => onTestPlayer().catch(onError)} title="Abrir a ficha de um jogador de teste">
            <FlaskIcon /> TESTAR COMO JOGADOR
          </button>
          <WorldButtons session={session} />
          <button className="icon-btn" type="button" onClick={onChangePassword} title="Alterar senha" aria-label="Alterar senha"><KeyIcon /></button>
          <button className="icon-btn" type="button" onClick={onLogout} title="Sair" aria-label="Sair"><ExitIcon /></button>
        </div>
      </header>

      <main className="master-body">
        {tab === 'table' && <MasterTable token={session.token} onError={onError} onToast={setToast} />}
        {tab === 'documents' && <MasterDocuments token={session.token} onError={onError} onToast={setToast} />}
        {tab === 'abilities' && <MasterAbilities token={session.token} onError={onError} onToast={setToast} />}
        {tab === 'sheets' && <MasterSheets token={session.token} onError={onError} onToast={setToast} />}
        {tab === 'inventory' && <MasterInventory token={session.token} onError={onError} onToast={setToast} />}
        {tab === 'merchants' && <MasterMerchants token={session.token} onError={onError} onToast={setToast} />}
        {tab === 'journal' && <section className="card master-journal"><GroupJournal token={session.token} onError={onError} onToast={setToast} /></section>}
        {tab === 'rules' && <MasterRules token={session.token} onError={onError} onToast={setToast} />}
        {tab === 'accounts' && <MasterAccounts token={session.token} onError={onError} />}
      </main>

      {toast && <div key={toast} className="toast" role="status">{toast}</div>}
    </div>
  )
}
