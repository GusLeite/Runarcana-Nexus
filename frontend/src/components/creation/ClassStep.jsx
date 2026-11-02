import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { classArt } from '../../data/classArt.js'
import OriginArt from './OriginArt.jsx'
import ClassFx from './ClassFx.jsx'
import ClassStage from './ClassStage.jsx'
import useHallTop from './useHallTop.js'
import '../../styles/origin.css'

// Etapa Classe: o mesmo salão da Origem, com um painel vertical por classe. O painel sob o mouse se expande, acende e
// toca o vídeo em destaque; clicar abre o destaque (ClassStage), onde estão os detalhes, a subclasse e a confirmação.
export default function ClassStep({ classes, crafts, equipment, classId, subclassId, onPick, onBack, onNext }) {
  const [openId, setOpenId] = useState(null)
  const top = useHallTop()
  const hall = useRef()

  if (!classes?.length) {
    return <p className="muted-note">Nenhuma opção cadastrada ainda nas regras de criação.</p>
  }

  const cardOf = id => hall.current?.querySelector(`[data-class="${id}"]`)
  const chosen = classes.find(k => k.id === classId)
  const chosenSub = chosen?.subclasses?.find(s => s.id === subclassId)

  return (
    <>
      {createPortal(
        <div className="ohall" ref={hall} style={{ top }}>
          <h4 className="ohall-title">Escolha a classe</h4>
          <div className="origin-row class-row" role="group" aria-label="Classes">
            {classes.map((klass, n) => {
              const art = classArt(klass)
              const on = klass.id === classId
              const subs = klass.subclasses?.length ?? 0
              return (
                <button
                  key={klass.id}
                  type="button"
                  data-class={klass.id}
                  aria-haspopup="dialog"
                  aria-pressed={on}
                  className={'ocard' + (on ? ' on' : '') + (openId === klass.id ? ' out' : '')}
                  style={{ '--h': art.hue, '--n': n }}
                  onClick={() => setOpenId(klass.id)}
                >
                  <OriginArt id={klass.id} art={art} />
                  <span className="ocard-shade" />
                  <ClassFx id={klass.id} />
                  {on && <span className="ocard-seal">✓ Escolhida</span>}
                  <span className="ocard-cap">
                    <span className="ocard-kicker">
                      {on && chosenSub ? chosenSub.name : 'd' + klass.hitDie + (subs ? ' · ' + subs + ' ' + (klass.subclassLabel ?? 'Subclasse') + 's' : '')}
                    </span>
                    <span className="ocard-name">{klass.name}</span>
                    <span className="ocard-rule" />
                    <span className="ocard-tag">{art.tagline}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="ohall-bar">
            <button type="button" className="ghost-btn" onClick={onBack}>Voltar</button>
            <span className="ohall-status rhall-status">
              {chosen
                ? <>Classe: <b>{chosen.name}{chosenSub ? ' · ' + chosenSub.name : ''}</b></>
                : 'Passe o mouse sobre uma classe e clique para ver o que ela concede.'}
            </span>
            <button type="button" className="btn next-btn" disabled={!chosen || (chosen.subclasses?.length > 0 && !chosenSub)} onClick={onNext}>PRÓXIMO</button>
          </div>
        </div>,
        document.body,
      )}
      {openId && (
        <ClassStage
          classes={classes}
          startId={openId}
          crafts={crafts}
          equipment={equipment}
          classId={classId}
          subclassId={subclassId}
          cardOf={cardOf}
          onMove={setOpenId}
          onConfirm={onPick}
          onClose={id => {
            setOpenId(null)
            cardOf(id)?.focus()
          }}
        />
      )}
    </>
  )
}
