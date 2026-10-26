import { useEffect, useMemo, useRef, useState } from 'react'
import { createCharacter, fetchCatalog, previewCreation } from '../../api/creation.js'
import { ATTRIBUTES } from '../../data/rules.js'
import { replay } from '../../utils/motion.js'
import OptionStep from './OptionStep.jsx'
import AttributeStep from './AttributeStep.jsx'
import ChoiceStep from './ChoiceStep.jsx'
import HeritageStep from './HeritageStep.jsx'
import TraitStep from './TraitStep.jsx'
import DetailsStep from './DetailsStep.jsx'
import BuildSummary from './BuildSummary.jsx'
import '../../styles/creation.css'

const STEPS = [
  { id: 'origin', label: 'Origem' },
  { id: 'traits', label: 'Traços' },
  { id: 'region', label: 'Região' },
  { id: 'class', label: 'Classe' },
  { id: 'background', label: 'Passado' },
  { id: 'attributes', label: 'Atributos' },
  { id: 'choices', label: 'Escolhas' },
  { id: 'heritages', label: 'Heranças' },
  { id: 'details', label: 'Detalhes' },
]
const PREVIEW_DELAY = 220

// Valores iniciais de cada método de atributos.
export function startingAttributes(method, methods) {
  const fill = v => Object.fromEntries(ATTRIBUTES.map(a => [a.id, v]))
  if (method === 'POINT_BUY') return fill(methods.pointBuy.min)
  if (method === 'MANUAL') return fill(10)
  return fill(null)
}

// Assistente de criação de personagem. As regras (o que cada origem/classe/antecedente dá) vêm do
// catálogo do back; a ficha em construção à direita é calculada pelo back (/creation/preview) a cada mudança.
export default function CreationWizard({ token, defaultPlayer, onCreated, onError }) {
  const [catalog, setCatalog] = useState(null)
  const [draft, setDraft] = useState(null)
  const [preview, setPreview] = useState(null)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const panel = useRef()

  useEffect(() => {
    fetchCatalog(token)
      .then(c => {
        setCatalog(c)
        const methods = c.attributeMethods
        const method = methods.pointBuy ? 'POINT_BUY' : methods.standardArray ? 'STANDARD_ARRAY' : 'MANUAL'
        setDraft({
          originId: null, lineageId: null, classId: null, backgroundId: null, regionId: null,
          attributeMethod: method, baseAttributes: startingAttributes(method, methods), choices: {}, heritages: [],
          traitBudget: null, traits: [], drawbacks: [],
          characterName: '', playerName: defaultPlayer ?? '', age: '', height: '', alignment: null,
        })
      })
      .catch(onError)
  }, [token, defaultPlayer, onError])

  // Prévia com um pequeno atraso, para não chamar o back a cada tecla.
  useEffect(() => {
    if (!draft) return
    const t = setTimeout(() => {
      previewCreation(token, toRequest(draft)).then(setPreview).catch(onError)
    }, PREVIEW_DELAY)
    return () => clearTimeout(t)
  }, [draft, token, onError])

  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }))
  const origin = catalog?.origins.find(o => o.id === draft?.originId)
  const lineages = origin?.lineages ?? []
  // Runinata: tem a etapa Traços e só tem Passado com um traço que libera (Antecedente).
  const usesTraits = !!origin?.usesTraits && !!catalog?.traits
  const traitBackground = usesTraits && draft.traits.some(p => catalog.traits.traits.find(t => t.id === p.id)?.background)
  const noBackground = usesTraits && !traitBackground
  // Passado, Região e Heranças só aparecem se o catálogo tiver opções para eles; Traços, só na origem que usa.
  const steps = useMemo(() => STEPS.filter(s =>
    (s.id !== 'background' || catalog?.backgrounds?.length) && (s.id !== 'region' || catalog?.regions?.length)
    && (s.id !== 'heritages' || catalog?.heritages?.length) && (s.id !== 'traits' || usesTraits)), [catalog, usesTraits])
  const current = steps[step]?.id
  const last = step === steps.length - 1

  const create = async () => {
    setBusy(true)
    setMsg(null)
    try {
      onCreated(await createCharacter(token, toRequest(draft)))
    } catch (err) {
      if (err.status === 401) onError(err)
      else {
        setMsg(err.message)
        replay(panel.current, 'shake')
      }
      setBusy(false)
    }
  }

  if (!catalog || !draft) {
    return <section className="card wizard-loading"><div className="hex-spinner" />Abrindo as regras de criação…</section>
  }

  // Etapa "concluída" (losango ✓). Atributos: na compra de pontos, só depois de gastar algum ponto
  // (todos em 8 é válido, mas ainda não é uma escolha). Escolhas: só depois de origem e classe definidas.
  const attributeErrors = preview?.errors.some(e => /atribut|pontos|arranjo/i.test(e))
  const choiceErrors = preview?.errors.some(e => e.startsWith('Faltam escolhas') || e.startsWith('Escolha só') || e.startsWith('Opção inválida'))
  const heritageErrors = preview?.errors.some(e => /Heran|ser escolhida|Escolha a opção de/.test(e))
  const traitErrors = preview?.errors.some(e => /traço|Traço|pontos de Origem|Responda em|ser escolhido|Desvantagem desconhecida/.test(e))
  const done = {
    origin: !!draft.originId && (!lineages.length || !!draft.lineageId),
    traits: !!preview?.traitBudget && !traitErrors,
    region: !!draft.regionId,
    class: !!draft.classId,
    background: noBackground ? !draft.backgroundId : !!draft.backgroundId,
    attributes: !!preview && !attributeErrors && (draft.attributeMethod !== 'POINT_BUY' || (preview.pointBuy?.spent ?? 0) > 0),
    choices: !!preview && !!draft.originId && !!draft.classId && !choiceErrors,
    heritages: !!preview && !!draft.originId && !!draft.regionId && !heritageErrors,
    details: !!draft.characterName.trim() && Number(draft.age) >= 1 && Number(draft.height) > 0,
  }

  return (
    <div className="creation">
      <section className="card wizard" style={{ '--i': 1 }} ref={panel}>
        <div className="wizard-head">
          <h3 className="card-title">Criação de personagem</h3>
          <ol className="stepper">
            {steps.map((s, i) => (
              <li key={s.id}>
                <button type="button" className={'step' + (i === step ? ' on' : '') + (done[s.id] ? ' done' : '')} onClick={() => setStep(i)}
                  aria-current={i === step ? 'step' : undefined}>
                  <span className="step-gem"><span>{done[s.id] ? '✓' : i + 1}</span></span>
                  <span className="step-label">{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="wizard-body" key={current}>
          {current === 'origin' && (
            <>
              <OptionStep kind="origin" title="Escolha a origem" items={catalog.origins} crafts={catalog.crafts}
                selected={draft.originId}
                onPick={id => setDraft(d => (d.originId === id ? d : { ...d, originId: id, lineageId: null }))} />
              {lineages.length > 0 && (
                <div className="lineage-step" key={draft.originId}>
                  <OptionStep kind="lineage" title={'Escolha a linhagem (' + origin.name + ')'} items={lineages} crafts={catalog.crafts}
                    selected={draft.lineageId} onPick={id => set('lineageId', id)} />
                </div>
              )}
            </>
          )}
          {current === 'traits' && (
            <TraitStep system={catalog.traits} preview={preview} draft={draft} onChange={set} />
          )}
          {current === 'region' && (
            <OptionStep kind="region" title="Escolha a região" hint="Onde o personagem cresceu. Libera as Heranças de Região."
              items={catalog.regions} crafts={catalog.crafts} selected={draft.regionId} onPick={id => set('regionId', id)} />
          )}
          {current === 'class' && (
            <OptionStep kind="class" title="Escolha a classe" items={catalog.classes} crafts={catalog.crafts} selected={draft.classId} onPick={id => set('classId', id)} />
          )}
          {current === 'background' && (noBackground ? (
            <>
              <h4 className="step-title">Passado</h4>
              <p className="muted-note">A Runinata não tem Passado, a não ser com o traço menor Antecedente (etapa Traços).</p>
              {draft.backgroundId && (
                <button type="button" className="ghost-btn small" onClick={() => set('backgroundId', null)}>Tirar o passado escolhido</button>
              )}
            </>
          ) : (
            <OptionStep kind="background" title="Escolha o passado" items={catalog.backgrounds} crafts={catalog.crafts} selected={draft.backgroundId} onPick={id => set('backgroundId', id)} />
          ))}
          {current === 'attributes' && (
            <AttributeStep methods={catalog.attributeMethods} draft={draft} preview={preview}
              onMethod={m => setDraft(d => ({ ...d, attributeMethod: m, baseAttributes: startingAttributes(m, catalog.attributeMethods) }))}
              onChange={values => set('baseAttributes', values)} />
          )}
          {current === 'choices' && (
            <ChoiceStep choices={preview?.choices ?? []} picks={draft.choices} crafts={catalog.crafts ?? []}
              onChange={(key, list) => setDraft(d => ({ ...d, choices: { ...d.choices, [key]: list } }))} />
          )}
          {current === 'heritages' && (
            <HeritageStep heritages={catalog.heritages} preview={preview} picks={draft.heritages} onChange={list => set('heritages', list)} />
          )}
          {current === 'details' && (
            <DetailsStep draft={draft} onChange={set} />
          )}
        </div>

        {msg && <div className="err" role="alert">{msg}</div>}
        <div className="wizard-nav">
          <button type="button" className="ghost-btn" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Voltar</button>
          {last ? (
            <button type="button" className="btn create-btn" disabled={busy || !preview?.complete} onClick={create}>
              {busy ? 'CRIANDO…' : 'CRIAR PERSONAGEM'}
            </button>
          ) : (
            <button type="button" className="btn next-btn" onClick={() => setStep(s => s + 1)}>PRÓXIMO</button>
          )}
        </div>
      </section>

      <BuildSummary preview={preview} catalog={catalog} draft={draft} />
    </div>
  )
}

// O que vai para o back: campos vazios viram null e números viram números.
export function toRequest(d) {
  return {
    ...d,
    characterName: d.characterName.trim() || null,
    playerName: d.playerName.trim() || null,
    age: d.age === '' ? null : Number(d.age),
    height: d.height === '' ? null : Number(String(d.height).replace(',', '.')),
  }
}
