import CombatArena from '../combat/CombatArena.jsx'
import Attacks from './Attacks.jsx'

// Aba COMBATE do jogador: aparece sozinha quando o mestre ativa um confronto, e a ficha fica presa nela
// (só MAGIAS e INVENTÁRIO continuam abertas). À esquerda, a trilha de iniciativa; à direita, o "seu turno":
// rolar a iniciativa (uma vez; depois só o mestre ajusta), os ataques e atalhos para magias e mochila.
export default function CombatTab({ encounter, catalog, sheet, attacks, onRollMine, rolling, onRoll, onRollDice, onGo }) {
  const me = encounter.order.find(c => c.mine)
  const myTurn = me && encounter.currentId === me.id
  const position = me ? encounter.order.indexOf(me) + 1 : null

  return (
    <div className="cb-player">
      <CombatArena encounter={encounter} catalog={catalog} onRollMine={onRollMine} rolling={rolling} />
      <aside className="cb-side-col">
        <section className={'card cb-me' + (myTurn ? ' my-turn' : '')}>
          {!me ? (
            <p className="muted-note">Seu personagem não está neste confronto. Acompanhe a luta por aqui.</p>
          ) : (
            <>
              <div className="cb-me-head">
                <small>{myTurn ? 'É a sua vez!' : me.initiative == null ? 'Role a sua iniciativa' : 'Sua posição'}</small>
                <b>{myTurn ? 'AJA AGORA' : me.initiative == null ? '—' : position + 'º na ordem'}</b>
              </div>
              {me.initiative == null && (
                <button type="button" className="btn cb-big-roll" onClick={onRollMine} disabled={rolling}>
                  {rolling ? 'ROLANDO…' : 'ROLAR INICIATIVA'}
                </button>
              )}
              {me.initiative != null && (
                <p className="cb-me-init">Iniciativa <b>{me.initiative}</b>
                  {me.initiativeD20 != null ? <small> (d20 {me.initiativeD20})</small> : <small> (ajustada pelo mestre)</small>}</p>
              )}
              <div className="cb-me-go">
                <button type="button" className="ghost-btn" onClick={() => onGo('abilities')}>✦ Magias</button>
                <button type="button" className="ghost-btn" onClick={() => onGo('inventory')}>◆ Inventário</button>
              </div>
            </>
          )}
        </section>
        {sheet && attacks?.length > 0 && (
          <section className="card cb-my-attacks">
            <Attacks attacks={attacks} sheet={sheet} onRoll={onRoll} onRollDice={onRollDice} />
          </section>
        )}
        <p className="muted-note cb-lock-note">Durante o combate a ficha fica nesta aba, em Magias e no Inventário. O mestre libera ao encerrar.</p>
      </aside>
    </div>
  )
}
