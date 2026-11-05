import { useEffect, useRef } from 'react'
import { play } from '../../audio/engine.js'

// Palco 3D de uma rolagem. spec: { dice, effects } (ver diceSpec.js). onSettled quando os dados param;
// onFail se a cena não carregar (WebGL perdido, erro no módulo): quem usa volta para o dado 2D.
// compact: palco pequeno no canto, para a rolagem de outra pessoa da mesa.
export default function Dice3D({ spec, compact = false, onSettled, onFail }) {
  const box = useRef(null)
  const done = useRef({ onSettled, onFail })
  done.current = { onSettled, onFail }

  useEffect(() => {
    if (!spec) return undefined
    let stage = null
    let alive = true
    import('./diceScene.js')
      .then(({ createDiceStage }) => {
        if (!alive || !box.current) return
        stage = createDiceStage(box.current, { compact, onClack: v => play('clack', compact ? v * 0.6 : v) })
        return stage.throwDice(spec.dice, spec.effects).then(() => { if (alive) done.current.onSettled?.() })
      })
      .catch(err => {
        if (import.meta.env?.DEV) console.warn('Dados 3D falharam:', err)
        if (alive) done.current.onFail?.()
      })
    return () => {
      alive = false
      stage?.dispose()
    }
  }, [spec, compact])

  return <div ref={box} className={'dice3d-stage' + (compact ? ' compact' : '')} aria-hidden="true" />
}
