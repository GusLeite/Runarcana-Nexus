// Rolagens da mesa (rotas /rolls): o servidor sorteia, guarda e avisa o canal ao vivo (tópico rolls).
import { request } from './auth.js'
import { rollCheck, rollDice } from '../data/rules.js'

export const fetchRolls = (token, limit) => request('/rolls' + (limit ? '?limit=' + limit : ''), { token })
const createRoll = (token, body) => request('/rolls', { method: 'POST', token, body })

// Resposta do servidor → formato que DiceRoll e RollLog usam (kind em minúsculas, como antes).
export function toEntry(v) {
  return {
    id: v.id,
    who: v.who,
    username: v.username,
    mine: v.mine,
    hidden: v.hidden,
    secret: v.visibility === 'PRIVATE',
    createdAt: v.createdAt,
    kind: v.kind === 'DICE' ? 'dice' : 'check',
    label: v.label,
    mode: v.mode ?? 'normal',
    mod: v.mod ?? 0,
    d20: v.d20,
    other: v.other ?? null,
    critRange: v.critRange ?? 20,
    expr: v.expr,
    count: v.count,
    sides: v.sides,
    bonus: v.bonus ?? 0,
    rolls: v.rolls ?? [],
    total: v.total,
  }
}

// Rola pelo servidor. roll: { label, kind: 'CHECK' | 'DICE', mod, mode, critRange, expr, secret }.
// Sem servidor (status 0), sorteia aqui e marca como "não registrado" para não travar a mesa; outros erros sobem.
export async function serverRoll(token, roll) {
  const body = {
    label: roll.label,
    kind: roll.kind,
    mod: roll.mod ?? 0,
    mode: roll.mode ?? 'normal',
    critRange: roll.critRange ?? 20,
    expr: roll.expr,
    visibility: roll.secret ? 'PRIVATE' : 'TABLE',
  }
  try {
    return toEntry(await createRoll(token, body))
  } catch (err) {
    if (err?.status !== 0) throw err
    return localRoll(body, roll.secret)
  }
}

let localSeq = 0
function localRoll(body, secret) {
  const base = { id: 'local-' + ++localSeq, mine: true, hidden: false, secret: !!secret, unregistered: true, createdAt: new Date().toISOString(), label: body.label }
  if (body.kind === 'DICE') {
    const r = rollDice(body.expr)
    if (!r) return null
    return { ...base, kind: 'dice', expr: body.expr, mode: 'normal', mod: 0, ...r }
  }
  const { d20, other } = rollCheck(body.mode)
  return { ...base, kind: 'check', mod: body.mod, mode: body.mode, critRange: body.critRange, d20, other, total: d20 + body.mod }
}
