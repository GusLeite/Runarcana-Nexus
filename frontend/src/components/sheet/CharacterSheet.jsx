import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyLevelUp, castSpell, fetchBreakdown, fetchConditions, setDeathSaves as setDeathSavesApi, chooseDefense as chooseDefenseApi, chooseShield as chooseShieldApi, chooseForm as chooseFormApi, toggleEffect as toggleEffectApi, consumeItem, fetchPreparation, fetchSheet, previewLevelUp, rest as restApi, setAbilityUses, setHp as setHpApi, spendGold as spendGoldApi, spendInspiration } from '../../api/character.js'
import { fetchDocuments, markDocumentRead } from '../../api/documents.js'
import { createNote, deleteNote, fetchNotes, updateNote } from '../../api/notes.js'
import { fetchVisiblePois } from '../../api/map.js'
import { buyFromMerchant, fetchActiveMerchant, haggleWithMerchant, pingMerchant, sellToMerchant } from '../../api/merchants.js'
import { SKILL_NAMES, deathSaveResult, rollCheck, rollD20, rollDice } from '../../data/rules.js'
import WorldButtons from '../map/WorldButtons.jsx'
import SheetHero from './SheetHero.jsx'
import PrepareSpells from './PrepareSpells.jsx'
import OverviewTab from './OverviewTab.jsx'
import AbilitiesTab from './AbilitiesTab.jsx'
import Inventory from './Inventory.jsx'
import Purse from './Purse.jsx'
import DocumentsTab from './DocumentsTab.jsx'
import NotesTab from './NotesTab.jsx'
import MerchantTab from './MerchantTab.jsx'
import BookTab from './BookTab.jsx'
import GroupJournal from './GroupJournal.jsx'
import DiceRoll from './DiceRoll.jsx'
import TabBar from './TabBar.jsx'
import CreationScreen from '../creation/CreationScreen.jsx'
import LevelUp from '../creation/LevelUp.jsx'
import { fetchCatalog } from '../../api/creation.js'
import { play } from '../../audio/engine.js'
import useUrlParam from '../../hooks/useUrlParam.js'
import { levelUpGains } from '../../data/levelGains.js'
import LevelUpCeremony from './LevelUpCeremony.jsx'
import { ExitIcon, InfoIcon, KeyIcon, PrintIcon } from './icons.jsx'
import { ExplainProvider } from './Explain.jsx'
import '../../styles/sheet.css'

const MAX_LOG = 8
const PENDING_POLL = 10000
const MERCHANT_POLL = 5000
const MERCHANT_TAB = { id: 'merchant', label: 'MERCADOR', glow: true }
const TABS = [
  { id: 'sheet', label: 'FICHA' },
  { id: 'abilities', label: 'MAGIAS' },
  { id: 'inventory', label: 'INVENTÁRIO' },
  { id: 'documents', label: 'DOCUMENTOS' },
  { id: 'notes', label: 'ANOTAÇÕES' },
  { id: 'journal', label: 'DIÁRIO' },
  { id: 'book', label: 'LIVRO' },
]
const TAB_IDS = [...TABS.map(t => t.id), MERCHANT_TAB.id]
const MODE_SHORT = { adv: 'V', dis: 'D' }

// Fixadas primeiro, depois as editadas mais recentemente (mesma ordem do back-end).
const sortNotes = list => [...list].sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))

// Tela pós-login: a ficha do personagem no estilo do cliente do LoL, em abas.
// Arte e cores vêm de data/characters.js; os dados, de /character/me, /documents/me e /notes.
export default function CharacterSheet({ character, session, notice, onChangePassword, onLogout, onExpired, testing }) {
  const [state, setState] = useState({ status: 'loading' })
  const [abilities, setAbilities] = useState([])
  const [documents, setDocuments] = useState([])
  const [notes, setNotes] = useState([])
  // A aba fica na URL (?aba=…): recarregar volta para ela e o "voltar" do navegador troca de aba.
  const [tab, setTab] = useUrlParam('aba', TAB_IDS, 'sheet')
  const [docId, setDocId] = useState(null)
  const [noteId, setNoteId] = useState(null)
  const [rolls, setRolls] = useState([])
  const [current, setCurrent] = useState(null)
  const [mode, setMode] = useState('normal')
  const [busy, setBusy] = useState(false)
  // Subida de nível liberada pelo mestre: o formulário ocupa o lugar das abas; o catálogo vem quando abre.
  const [leveling, setLeveling] = useState(false)
  const [catalog, setCatalog] = useState(null)
  const [toast, setToast] = useState(notice)
  // Em ref para as buscas não repetirem a cada render do App (o callback muda de identidade).
  const expired = useRef(onExpired)
  expired.current = onExpired
  const token = session.token

  // Erro de uma ação: 401 desloga; o resto vira aviso.
  const fail = useCallback(err => {
    play('error')
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
    play(next.currentHp > before.currentHp ? 'heal' : next.currentHp < before.currentHp ? 'damage' : 'ward')
    const put = character => setState(s => (s.status === 'ready' ? { ...s, sheet: { ...s.sheet, character } } : s))
    // Com PV de novo, os testes contra a morte zeram (o back faz o mesmo).
    put({ ...before, ...next, ...(next.currentHp > 0 ? { deathSuccesses: 0, deathFailures: 0 } : {}) })
    setHpApi(token, next.currentHp, next.tempHp).catch(err => { put(before); fail(err) })
  }, [state, token, fail])

  // Testes contra a morte (0 PV): marcar à mão ou rolar o d20 (20 volta com 1 PV).
  const putCharacter = useCallback(character => setState(s => (s.status === 'ready' ? { ...s, sheet: { ...s.sheet, character } } : s)), [])
  const setDeathSaves = useCallback((successes, failures) => {
    setDeathSavesApi(token, successes, failures).then(putCharacter).catch(fail)
  }, [token, fail, putCharacter])
  const rollDeathSave = useCallback(() => {
    const c = state.status === 'ready' ? state.sheet.character : null
    if (!c) return
    const d20 = rollD20()
    pushRoll({ id: Date.now() + Math.random(), kind: 'check', label: 'Teste contra a morte', mod: 0, d20, other: null, mode: 'normal', total: d20 })
    const r = deathSaveResult(d20, c.deathSuccesses ?? 0, c.deathFailures ?? 0)
    if (r.revived) {
      setHp({ currentHp: 1, tempHp: c.tempHp ?? 0 })
      setToast('20 natural: ' + c.characterName + ' volta com 1 PV!')
    } else setDeathSaves(r.successes, r.failures)
  }, [state, setHp, setDeathSaves])

  // Condições do livro (nome e regra), para os chips do herói.
  const [conditionCatalog, setConditionCatalog] = useState(null)
  useEffect(() => {
    if (state.status === 'ready' && !conditionCatalog) fetchConditions(token).then(setConditionCatalog).catch(() => {})
  }, [token, state.status, conditionCatalog])

  // O jogador só gasta: o back devolve a ficha inteira (inventário, ouro, inspiração).
  const putSheet = useCallback(sheet => setState(s => (s.status === 'ready' ? { ...s, sheet } : s)), [])
  const consumeOne = useCallback(item => {
    consumeItem(token, item.id).then(sheet => { play('consume'); putSheet(sheet); setToast('Usou 1: ' + item.name + '.') }).catch(fail)
  }, [token, fail, putSheet])
  // Ficha física: o PDF de impressão da mesa preenchido com a ficha atual (as habilidades vêm do estado, com os usos em dia).
  const [printing, setPrinting] = useState(false)
  const printSheet = useCallback(() => {
    if (state.status !== 'ready') return
    setPrinting(true)
    import('../../utils/printSheet.js')
      .then(m => m.downloadPrintSheet({ sheet: state.sheet, abilities, portraitSrc: character.img }))
      .then(() => setToast('Ficha física gerada.'))
      .catch(err => { play('error'); setToast(err.message || 'Não deu para gerar a ficha física.') })
      .finally(() => setPrinting(false))
  }, [state, abilities, character.img])
  const spendGold = useCallback(amount => spendGoldApi(token, amount).then(sheet => { play('coin'); putSheet(sheet) }).catch(err => { fail(err); throw err }), [token, fail, putSheet])
  const spendInspirationNow = useCallback(() => {
    spendInspiration(token).then(sheet => { play('success'); putSheet(sheet); setToast('Inspiração gasta.') }).catch(fail)
  }, [token, fail, putSheet])

  // Mercador aberto pelo mestre: a cada poucos segundos (com a aba visível) o ping diz se abriu, fechou ou mudou;
  // só então a loja, que traz a imagem, é buscada de novo. known: id e revisão do que está na tela (undefined = 1ª vez).
  const [merchant, setMerchant] = useState(null)
  const known = useRef(undefined)
  const hasSheet = state.status === 'ready'
  const putMerchant = useCallback(m => {
    known.current = { id: m.id, revision: m.revision }
    setMerchant(m)
  }, [])
  useEffect(() => {
    if (!hasSheet) return undefined
    const check = () => {
      if (document.hidden) return
      pingMerchant(token)
        .then(ping => {
          const before = known.current
          if (ping.id == null) {
            known.current = null
            setMerchant(null)
            setTab(t => (t === 'merchant' ? 'inventory' : t), { replace: true })
            if (before) setToast('O mercador fechou a loja.')
          } else if (before?.id !== ping.id || before?.revision !== ping.revision) {
            fetchActiveMerchant(token)
              .then(m => {
                putMerchant(m)
                if (before !== undefined && before?.id !== m.id) setToast(m.name + ' abriu a loja! Veja a aba MERCADOR.')
              })
              .catch(() => {})
          }
        })
        .catch(() => {})
    }
    check()
    const t = setInterval(check, MERCHANT_POLL)
    return () => clearInterval(t)
  }, [token, hasSheet, putMerchant])

  // Ao entrar na loja, ouro e mochila vêm atualizados (o mestre pode ter mexido) e, com eles, as ofertas.
  useEffect(() => {
    if (tab !== 'merchant') return
    fetchSheet(token).then(putSheet).catch(() => {})
    fetchActiveMerchant(token).then(putMerchant).catch(() => {})
  }, [token, tab, putSheet, putMerchant])

  const trade = useCallback((call, done) => {
    setBusy(true)
    return call()
      .then(({ merchant: m, sheet }) => {
        play('coin')
        putMerchant(m)
        putSheet(sheet)
        setToast(done)
      })
      .catch(err => {
        fail(err)
        // Recusado (esgotou, o preço mudou): mostra a loja como está agora.
        fetchActiveMerchant(token).then(putMerchant).catch(() => {})
        throw err
      })
      .finally(() => setBusy(false))
  }, [token, fail, putSheet, putMerchant])
  const buy = useCallback((line, quantity) => trade(() => buyFromMerchant(token, line.id, quantity, line.price),
    'Comprou ' + (quantity > 1 ? quantity + '× ' : '') + line.name + '.'), [token, trade])
  const sell = useCallback((item, quantity, unitValue) => trade(() => sellToMerchant(token, item.id, quantity, unitValue),
    'Vendeu ' + (quantity > 1 ? quantity + '× ' : '') + item.name + ' por ' + unitValue * quantity + ' PO.'), [token, trade])
  // Pechincha: o back rola; o dado aparece como uma rolagem comum e a loja volta com os preços dele.
  const haggle = useCallback(skill => {
    setBusy(true)
    haggleWithMerchant(token, skill)
      .then(m => {
        const h = m.haggle
        putMerchant(m)
        pushRoll({ id: Date.now() + Math.random(), kind: 'check', label: 'Pechincha (' + SKILL_NAMES[skill] + ')', mod: h.modifier, d20: h.d20, other: null, mode: 'normal', total: h.total })
        play(h.percent < 0 ? 'coin' : h.percent > 0 ? 'error' : 'ward')
      })
      .catch(err => {
        fail(err)
        fetchActiveMerchant(token).then(putMerchant).catch(() => {})
      })
      .finally(() => setBusy(false))
  }, [token, fail, putMerchant])

  // Forma temporária: o back devolve a ficha inteira (atributos, deslocamento e tamanho mudam).
  const chooseForm = useCallback(name => {
    chooseFormApi(token, name)
      .then(sheet => setState(s => (s.status === 'ready' ? { ...s, sheet } : s)))
      .catch(fail)
  }, [token, fail])

  // Efeito ativo: o back também devolve a ficha inteira.
  const toggleEffect = useCallback(name => {
    toggleEffectApi(token, name)
      .then(sheet => setState(s => (s.status === 'ready' ? { ...s, sheet } : s)))
      .catch(fail)
  }, [token, fail])

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

  const roll = useCallback((label, mod = 0, critRange = 20) => {
    const { d20, other } = rollCheck(mode)
    pushRoll({ id: Date.now() + Math.random(), kind: 'check', label, mod, d20, other, mode, critRange, total: d20 + mod })
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

  const cast = useCallback((spell, level) => {
    setBusy(true)
    castSpell(token, spell.id, level)
      .then(r => {
        play('cast')
        setAbilities(r.abilities)
        setToast('Conjurou ' + spell.name + (r.level ? ' no ' + r.level + 'º nível' : '')
          + (r.usedUse ? ' (1 uso da magia).' : r.manaCost ? ' (−' + r.manaCost + ' Mana).' : '.'))
      })
      .catch(fail)
      .finally(() => setBusy(false))
  }, [token, fail])

  // Magias preparadas (Acólito, Xamã): o descanso longo abre a escolha antes de descansar.
  const [preparation, setPreparation] = useState(null)
  const [preparing, setPreparing] = useState(false)
  useEffect(() => {
    if (state.status !== 'ready') return
    fetchPreparation(token).then(setPreparation).catch(() => setPreparation(null))
  }, [token, state.status])
  const prepares = preparation?.classes?.length > 0

  // Modo "de onde vem": liga no botão do topo; a conta (atributos e PV) vem do back e refaz quando a ficha muda.
  const [explain, setExplain] = useState(() => {
    try { return localStorage.getItem('runarcana.explain') === '1' } catch { return false }
  })
  const toggleExplain = useCallback(() => setExplain(on => {
    try { localStorage.setItem('runarcana.explain', on ? '0' : '1') } catch { /* sem armazenamento: vale só nesta visita */ }
    return !on
  }), [])
  const [breakdown, setBreakdown] = useState({ data: null, unavailable: false })
  const statsKey = state.status === 'ready'
    ? [state.sheet.character.level, state.sheet.character.maxHp, state.sheet.character.str, state.sheet.character.dex, state.sheet.character.con,
      state.sheet.character.intel, state.sheet.character.wis, state.sheet.character.cha].join('|')
    : null
  useEffect(() => {
    if (!explain || !statsKey) return
    let alive = true
    fetchBreakdown(token)
      .then(data => alive && setBreakdown({ data, unavailable: false }))
      .catch(err => {
        if (!alive) return
        if (err.status === 401) expired.current()
        else setBreakdown({ data: null, unavailable: true })
      })
    return () => { alive = false }
  }, [token, explain, statsKey])

  const doRest = useCallback((type, prepared) => {
    setBusy(true)
    restApi(token, type, prepared)
      .then(list => {
        play('rest', type === 'LONG')
        setAbilities(list)
        setPreparing(false)
        setToast(type === 'LONG' ? (prepared ? 'Descanso longo: usos de volta e magias preparadas.' : 'Descanso longo: todos os usos voltaram.')
          : 'Descanso curto: usos recuperados.')
        if (prepared) fetchPreparation(token).then(setPreparation).catch(() => {})
        // Descanso zera os testes contra a morte e o longo baixa a Exaustão: atualiza a ficha.
        fetchSheet(token).then(putSheet).catch(() => {})
      })
      .catch(fail)
      .finally(() => setBusy(false))
  }, [token, fail, putSheet])

  const rest = useCallback(type => {
    if (type === 'LONG' && prepares) setPreparing(true)
    else doRest(type)
  }, [prepares, doRest])

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
  const canLevel = !!sheet?.canLevelUp && sheet.pendingLevels > 0

  const openLevelUp = () => {
    setLeveling(true)
    if (!catalog) fetchCatalog(token).then(setCatalog).catch(err => { setLeveling(false); fail(err) })
  }
  const levelUpPreview = useCallback(levels => previewLevelUp(token, levels), [token])
  const levelUpApply = useCallback(levels => applyLevelUp(token, levels), [token])

  // Depois de salvar o nível: busca a ficha nova e compara com a de antes para a cerimônia.
  const [ceremony, setCeremony] = useState(null)
  const levelApplied = useCallback(updated => {
    const before = state.status === 'ready' ? state.sheet : null
    setLeveling(false)
    fetchSheet(token)
      .then(after => {
        play('levelup')
        putSheet(after)
        setAbilities(after.abilities ?? [])
        if (before) setCeremony(levelUpGains({ ...before, abilities }, after))
        else setToast(updated.characterName + ' subiu para o ' + updated.level + 'º nível!')
      })
      .catch(() => load())
  }, [state, abilities, token, putSheet, load])
  const closeCeremony = useCallback(() => setCeremony(null), [])

  // Locais do mapa: a cada 10 s (com a aba visível) confere se o mestre revelou algum novo para este jogador.
  const knownPois = useRef(null)
  useEffect(() => {
    if (!hasSheet) return undefined
    const check = () => {
      if (document.hidden && knownPois.current) return
      fetchVisiblePois(token)
        .then(list => {
          const fresh = knownPois.current ? list.filter(p => !knownPois.current.has(p.id)) : []
          knownPois.current = new Set(list.map(p => p.id))
          if (fresh.length) {
            play('success')
            setToast((fresh.length > 1 ? fresh.length + ' novos locais revelados no mapa' : 'Novo local revelado no mapa: ' + fresh[0].name) + '. Abra o mapa no topo.')
          }
        })
        .catch(() => {})
    }
    check()
    const t = setInterval(check, PENDING_POLL)
    return () => clearInterval(t)
  }, [token, hasSheet])

  // O mestre libera a subida no painel: a cada 10 s (com a aba visível) confere se mudou o que está liberado.
  const pendingNow = sheet?.pendingLevels
  useEffect(() => {
    if (pendingNow == null) return
    const t = setInterval(() => {
      if (document.hidden) return
      fetchSheet(token)
        .then(s => {
          if (s.character.pendingLevels !== pendingNow) {
            // Liberou um nível agora: aviso com som, além do botão que brilha no topo.
            if (s.character.pendingLevels > pendingNow && s.character.canLevelUp) {
              play('levelready')
              setToast('O mestre liberou o ' + (s.character.level + 1) + 'º nível! Clique em SUBIR DE NÍVEL.')
            }
            setState(st => (st.status === 'ready'
              ? { ...st, sheet: { ...st.sheet, character: { ...st.sheet.character, pendingLevels: s.character.pendingLevels } } } : st))
          }
        })
        .catch(() => {})
    }, PENDING_POLL)
    return () => clearInterval(t)
  }, [token, pendingNow])
  // Se o mestre cancelar enquanto o jogador escolhe, o formulário fecha.
  useEffect(() => {
    if (leveling && sheet && !canLevel) setLeveling(false)
  }, [leveling, sheet, canLevel])
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

  // Conta sem ficha: em vez da ficha, a tela exclusiva da criação.
  if (state.status === 'empty') {
    return (
      <CreationScreen
        character={character}
        session={session}
        toast={toast}
        onError={fail}
        onCreated={created => {
          play('levelup')
          setToast(created.characterName + ' foi criado!')
          load()
        }}
        onChangePassword={onChangePassword}
        onLogout={onLogout}
        testing={testing}
      />
    )
  }

  return (
    <ExplainProvider on={explain} breakdown={breakdown.data} unavailable={breakdown.unavailable}>
    <div className={'sheet' + (explain ? ' explaining' : '')} style={{ '--h': character.hue }}>
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
        <TabBar tabs={merchant ? [...TABS.slice(0, 3), MERCHANT_TAB, ...TABS.slice(3)] : TABS} active={tab} onChange={t => { setLeveling(false); setTab(t) }} badges={badges} alertId="documents" label="Seções" />
        <div className="topbar-right">
          {canLevel && !leveling && (
            <button className="lvl-ready" type="button" onClick={openLevelUp} title={'O mestre liberou o ' + (sheet.level + 1) + 'º nível'}>
              SUBIR DE NÍVEL{sheet.pendingLevels > 1 && <span className="lvl-ready-n">{sheet.pendingLevels}</span>}
            </button>
          )}
          {sheet && (
            <Purse gold={sheet.gold} onSpend={spendGold} />
          )}
          <div className="who">
            <span className="who-name">{character.name}</span>
            <span className="who-sub">{session.username}</span>
          </div>
          {sheet && (
            <button className={'icon-btn' + (explain ? ' on' : '')} type="button" onClick={toggleExplain} aria-pressed={explain}
              title={explain ? 'Desligar: parar de mostrar de onde vem cada número' : 'Ligar: passe o mouse em um atributo, nos PV ou em um ataque para ver de onde vem cada ponto'}
              aria-label="Mostrar de onde vem cada número">
              <InfoIcon />
            </button>
          )}
          {!testing && (
            <button className="icon-btn" type="button" onClick={onChangePassword} title="Alterar senha" aria-label="Alterar senha">
              <KeyIcon />
            </button>
          )}
          <button className="icon-btn" type="button" onClick={onLogout} title={testing ? 'Voltar ao painel do mestre' : 'Sair'} aria-label={testing ? 'Voltar ao painel do mestre' : 'Sair'}>
            <ExitIcon />
          </button>
        </div>
      </header>

      <WorldButtons session={session}>
        {sheet && (
          <button className="dock-btn print" type="button" onClick={printSheet} disabled={printing}
            title={printing ? 'Gerando a ficha física…' : 'Baixar ficha física (PDF para imprimir)'} aria-label="Baixar ficha física">
            <PrintIcon /><span>{printing ? 'Gerando…' : 'Imprimir ficha'}</span>
          </button>
        )}
      </WorldButtons>

      <main className={'sheet-body tab-' + (leveling ? 'levelup' : tab)}>
        <SheetHero character={character} sheet={sheet} armorClass={state.status === 'ready' ? state.sheet.armorClass : null}
          onDefense={chooseDefense} onShield={chooseShield} onHp={setHp}
          onDeathSaves={setDeathSaves} onDeathRoll={rollDeathSave} conditionCatalog={conditionCatalog} />

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
        {sheet && leveling && (
          <div className="sheet-col wide">
            {catalog ? (
              <LevelUp
                key={sheet.level}
                character={sheet}
                catalog={catalog}
                onPreview={levelUpPreview}
                onApply={levelUpApply}
                onApplied={levelApplied}
                onCancel={() => setLeveling(false)}
                onError={fail}
              />
            ) : (
              <div className="sheet-state" role="status"><div className="hex-spinner" />Abrindo a subida de nível…</div>
            )}
          </div>
        )}

        {sheet && !leveling && tab === 'sheet' && (
          <OverviewTab
            sheet={sheet}
            attacks={state.sheet.attacks ?? []}
            crafts={state.sheet.crafts ?? []}
            abilities={abilities}
            documents={documents}
            notes={notes}
            rolls={rolls}
            mode={mode}
            onMode={setMode}
            onRoll={roll}
            onRollDice={rollExpr}
            onGo={go}
            onInspiration={spendInspirationNow}
            onForm={chooseForm}
            onEffect={toggleEffect}
          />
        )}

        {sheet && !leveling && tab !== 'sheet' && (
          <div className="sheet-col wide" key={tab}>
            <section className="card" style={{ '--i': 1 }}>
              {tab === 'abilities' && (
                <AbilitiesTab abilities={abilities} spellcasting={state.sheet.spellcasting} onSetUses={setUses} onRest={rest} onRoll={roll}
                  onRollDice={rollExpr} onCast={cast} busy={busy} prepares={prepares} />
              )}
              {tab === 'inventory' && <Inventory items={state.sheet.inventory} strength={sheet.str} onUse={consumeOne} />}
              {tab === 'merchant' && merchant && (
                <MerchantTab merchant={merchant} inventory={state.sheet.inventory} gold={sheet.gold} skills={sheet.skills} busy={busy} onBuy={buy} onSell={sell} onHaggle={haggle} />
              )}
              {tab === 'documents' && (
                <DocumentsTab documents={documents} selectedId={docId} onSelect={setDocId} onOpen={markRead} />
              )}
              {tab === 'book' && <BookTab token={token} onError={fail} />}
              {tab === 'journal' && <GroupJournal token={token} onError={fail} onToast={setToast} />}
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
      {preparing && preparation && (
        <PrepareSpells preparation={preparation} busy={busy} onConfirm={picks => doRest('LONG', picks)} onCancel={() => setPreparing(false)} />
      )}
      {ceremony && <LevelUpCeremony gains={ceremony} name={sheet?.characterName ?? character.name} onClose={closeCeremony} />}
      {toast && <div key={toast} className="toast" role="status">{toast}</div>}
    </div>
    </ExplainProvider>
  )
}
