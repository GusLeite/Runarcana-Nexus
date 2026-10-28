import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chooseDefense as chooseDefenseApi, chooseShield as chooseShieldApi, fetchSheet, rest as restApi, setAbilityUses, setHp as setHpApi } from '../../api/character.js'
import { fetchDocuments, markDocumentRead } from '../../api/documents.js'
import { createNote, deleteNote, fetchNotes, updateNote } from '../../api/notes.js'
import { rollCheck, rollDice } from '../../data/rules.js'
import SheetHero from './SheetHero.jsx'
import OverviewTab from './OverviewTab.jsx'
import AbilitiesTab from './AbilitiesTab.jsx'
import Inventory from './Inventory.jsx'
import DocumentsTab from './DocumentsTab.jsx'
import NotesTab from './NotesTab.jsx'
import BookTab from './BookTab.jsx'
import DiceRoll from './DiceRoll.jsx'
import TabBar from './TabBar.jsx'
import CreationWizard from '../creation/CreationWizard.jsx'
import Num from './Num.jsx'
import { CoinIcon, ExitIcon, KeyIcon } from './icons.jsx'
import '../../styles/sheet.css'

const MAX_LOG = 8
const TABS = [
  { id: 'sheet', label: 'FICHA' },
  { id: 'abilities', label: 'MAGIAS' },
  { id: 'inventory', label: 'INVENTÁRIO' },
  { id: 'documents', label: 'DOCUMENTOS' },
  { id: 'notes', label: 'ANOTAÇÕES' },
  { id: 'book', label: 'LIVRO' },
]
const MODE_SHORT = { adv: 'V', dis: 'D' }

// Fixadas primeiro, depois as editadas mais recentemente (mesma ordem do back-end).
const sortNotes = list => [...list].sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))

// Tela pós-login: a ficha do personagem no estilo do cliente do LoL, em abas.
// Arte e cores vêm de data/characters.js; os dados, de /character/me, /documents/me e /notes.
export default function CharacterSheet({ character, session, notice, onChangePassword, onLogout, onExpired }) {
  const [state, setState] = useState({ status: 'loading' })
  const [abilities, setAbilities] = useState([])
  const [documents, setDocuments] = useState([])
  const [notes, setNotes] = useState([])
  const [tab, setTab] = useState('sheet')
  const [docId, setDocId] = useState(null)
  const [noteId, setNoteId] = useState(null)
  const [rolls, setRolls] = useState([])
  const [current, setCurrent] = useState(null)
  const [mode, setMode] = useState('normal')
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState(notice)
  // Em ref para as buscas não repetirem a cada render do App (o callback muda de identidade).
  const expired = useRef(onExpired)
  expired.current = onExpired
  const token = session.token

  // Erro de uma ação: 401 desloga; o resto vira aviso.
  const fail = useCallback(err => {
    if (err.status === 401) expired.current()
    else setToast(err.message)
  }, [])

  const load = useCallback(() => {
    setState({ status: 'loading' })
    fetchSheet(token)
      .then(sheet => {
        setState({ status: 'ready', sheet })
        setAbilities(sheet.abilities ?? [])
      })
      .catch(err => {
        if (err.status === 401) expired.current()
        else if (err.status === 404) setState({ status: 'empty', message: err.message })
        else setState({ status: 'error', message: err.message })
      })
    // Documentos e anotações não travam a ficha: se falharem, as abas ficam vazias.
    fetchDocuments(token).then(setDocuments).catch(() => {})
    fetchNotes(token).then(list => setNotes(sortNotes(list))).catch(() => {})
  }, [token])

  useEffect(load, [load])

  // Defesa em uso (sem armadura, CA alternativa ou armadura do inventário): o back devolve a CA recalculada.
  const chooseDefense = useCallback(key => {
    chooseDefenseApi(token, key)
      .then(armorClass => setState(s => (s.status === 'ready' ? { ...s, sheet: { ...s.sheet, armorClass } } : s)))
      .catch(fail)
  }, [token, fail])

  // PV do jogador: atualiza na hora e volta atrás se o back recusar.
  const setHp = useCallback(next => {
    const before = state.status === 'ready' ? state.sheet.character : null
    if (!before) return
    const put = character => setState(s => (s.status === 'ready' ? { ...s, sheet: { ...s.sheet, character } } : s))
    put({ ...before, ...next })
    setHpApi(token, next.currentHp, next.tempHp).catch(err => { put(before); fail(err) })
  }, [state, token, fail])

  const chooseShield = useCallback(key => {
    chooseShieldApi(token, key)
      .then(armorClass => setState(s => (s.status === 'ready' ? { ...s, sheet: { ...s.sheet, armorClass } } : s)))
      .catch(fail)
  }, [token, fail])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // ---------- rolagens ----------

  const pushRoll = entry => {
    setCurrent(entry)
    setRolls(list => [entry, ...list].slice(0, MAX_LOG))
  }

  const roll = useCallback((label, mod = 0) => {
    const { d20, other } = rollCheck(mode)
    pushRoll({ id: Date.now() + Math.random(), kind: 'check', label, mod, d20, other, mode, total: d20 + mod })
  }, [mode])

  const rollExpr = useCallback((label, expr) => {
    const r = rollDice(expr)
    if (r) pushRoll({ id: Date.now() + Math.random(), kind: 'dice', label, expr, ...r })
  }, [])

  // Atalho: R rola um d20 puro, Esc fecha a rolagem (fora de campos de texto).
  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === 'Escape') setCurrent(null)
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) roll('d20')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [roll])

  const closeRoll = useCallback(() => setCurrent(null), [])

  // ---------- habilidades ----------

  const setUses = useCallback((ability, usesLeft) => {
    const before = abilities
    setAbilities(list => list.map(a => (a.id === ability.id ? { ...a, usesLeft } : a)))
    setAbilityUses(token, ability.id, usesLeft).catch(err => { setAbilities(before); fail(err) })
  }, [abilities, token, fail])

  const rest = useCallback(type => {
    setBusy(true)
    restApi(token, type)
      .then(list => {
        setAbilities(list)
        setToast(type === 'LONG' ? 'Descanso longo: todos os usos voltaram.' : 'Descanso curto: usos recuperados.')
      })
      .catch(fail)
      .finally(() => setBusy(false))
  }, [token, fail])

  // ---------- documentos ----------

  // Um aviso por documento, mesmo que o efeito da aba dispare de novo antes do estado atualizar.
  const sentReads = useRef(new Set())
  const markRead = useCallback(doc => {
    setDocuments(list => list.map(d => (d.id === doc.id ? { ...d, read: true } : d)))
    if (sentReads.current.has(doc.id)) return
    sentReads.current.add(doc.id)
    markDocumentRead(token, doc.id).catch(() => sentReads.current.delete(doc.id))
  }, [token])

  // ---------- anotações ----------

  const newNote = useCallback(() => {
    setBusy(true)
    createNote(token, { title: 'Nova anotação', body: '', pinned: false })
      .then(note => {
        setNotes(list => sortNotes([note, ...list]))
        setNoteId(note.id)
      })
      .catch(fail)
      .finally(() => setBusy(false))
  }, [token, fail])

  const saveNote = useCallback((id, values) =>
    updateNote(token, id, values)
      .then(note => setNotes(list => sortNotes(list.map(n => (n.id === id ? note : n)))))
      .catch(err => { fail(err); throw err }), [token, fail])

  const removeNote = useCallback(note => {
    deleteNote(token, note.id)
      .then(() => {
        setNotes(list => list.filter(n => n.id !== note.id))
        setNoteId(null)
      })
      .catch(fail)
  }, [token, fail])

  // Vai para uma aba já com um item escolhido (usado pelos atalhos da aba Ficha).
  const go = useCallback((target, id) => {
    setTab(target)
    if (target === 'documents' && id != null) setDocId(id)
    if (target === 'notes' && id != null) setNoteId(id)
  }, [])

  const sheet = state.status === 'ready' ? state.sheet.character : null
  const unread = documents.filter(d => !d.read).length
  const badges = {
    abilities: abilities.length,
    inventory: state.status === 'ready' ? state.sheet.inventory.length : 0,
    documents: unread,
    notes: notes.length,
  }

  const motes = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    '--x': ((i * 37) % 100) + '%',
    '--d': 9 + ((i * 7) % 9) + 's',
    '--dl': -((i * 13) % 17) + 's',
    '--s': 2 + (i % 3) + 'px',
  })), [])

  return (
    <div className="sheet" style={{ '--h': character.hue }}>
      <div className="sheet-bg" style={{ backgroundImage: `url("${character.img}")` }} aria-hidden="true" />
      <div className="sheet-motes" aria-hidden="true">
        {motes.map((style, i) => <span key={i} style={style} />)}
      </div>

      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">RUNARCANA</div>
          <button className="play" type="button" onClick={() => roll('d20')} title="Atalho: R">
            <span>ROLAR D20{MODE_SHORT[mode] && <i className={'play-mode ' + mode}>{MODE_SHORT[mode]}</i>}</span>
          </button>
        </div>
        <TabBar tabs={TABS} active={tab} onChange={setTab} badges={badges} alertId="documents" label="Seções" />
        <div className="topbar-right">
          {sheet && (
            <div className="purse" title="Ouro">
              <CoinIcon />
              <b><Num value={sheet.gold} duration={1000} /></b>
            </div>
          )}
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

      <main className={'sheet-body tab-' + tab}>
        <SheetHero character={character} sheet={sheet} armorClass={state.status === 'ready' ? state.sheet.armorClass : null}
          onDefense={chooseDefense} onShield={chooseShield} onHp={setHp} />

        {state.status === 'loading' && (
          <div className="sheet-state" role="status"><div className="hex-spinner" />Abrindo a ficha…</div>
        )}
        {state.status === 'error' && (
          <div className="sheet-state card">
            <h3>Algo deu errado</h3>
            <p>{state.message}</p>
            <button className="ghost-btn" type="button" onClick={load}>Tentar de novo</button>
          </div>
        )}
        {/* Sem ficha: convite para criar e, depois, o assistente de criação. */}
        {state.status === 'empty' && !creating && (
          <div className="sheet-state card empty-cta">
            <h3>Ficha em branco</h3>
            <p>Seu personagem ainda não existe. Escolha origem, classe e antecedente e veja a ficha se montar.</p>
            <button className="btn" type="button" onClick={() => setCreating(true)}>CRIAR PERSONAGEM</button>
          </div>
        )}
        {state.status === 'empty' && creating && (
          <div className="sheet-col wide">
            <CreationWizard
              token={token}
              defaultPlayer={session.username}
              onError={fail}
              onCreated={created => {
                setCreating(false)
                setToast(created.characterName + ' foi criado!')
                load()
              }}
            />
          </div>
        )}

        {sheet && tab === 'sheet' && (
          <OverviewTab
            sheet={sheet}
            abilities={abilities}
            documents={documents}
            notes={notes}
            rolls={rolls}
            mode={mode}
            onMode={setMode}
            onRoll={roll}
            onRollDice={rollExpr}
            onGo={go}
          />
        )}

        {sheet && tab !== 'sheet' && (
          <div className="sheet-col wide" key={tab}>
            <section className="card" style={{ '--i': 1 }}>
              {tab === 'abilities' && (
                <AbilitiesTab abilities={abilities} onSetUses={setUses} onRest={rest} onRollDice={rollExpr} busy={busy} />
              )}
              {tab === 'inventory' && <Inventory items={state.sheet.inventory} strength={sheet.str} />}
              {tab === 'documents' && (
                <DocumentsTab documents={documents} selectedId={docId} onSelect={setDocId} onOpen={markRead} />
              )}
              {tab === 'book' && <BookTab token={token} onError={fail} />}
              {tab === 'notes' && (
                <NotesTab
                  notes={notes}
                  selectedId={noteId}
                  onSelect={setNoteId}
                  onCreate={newNote}
                  onSave={saveNote}
                  onDelete={removeNote}
                  busy={busy}
                />
              )}
            </section>
          </div>
        )}
      </main>

      <DiceRoll roll={current} onClose={closeRoll} />
      {toast && <div key={toast} className="toast" role="status">{toast}</div>}
    </div>
  )
}
