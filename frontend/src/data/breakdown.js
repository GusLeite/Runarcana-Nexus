import { ATTRIBUTES, attributeById, modifier } from './rules.js'

// "De onde vem cada número": linhas { label, amount } cujo total é o valor mostrado na ficha.
// Atributos e PV vêm do back (GET /character/me/breakdown); o ataque se explica com a própria ficha.

const sum = lines => lines.reduce((n, l) => n + l.amount, 0)

// Se as linhas não fecham com o total (troca de atributo, efeito), uma linha final cobre a diferença.
function closed(lines, total, label) {
  const rest = total - sum(lines)
  return rest === 0 ? lines : [...lines, { label, amount: rest }]
}

// Atributo: valor base + cada fonte (origem, linhagem, classe, aprimoramentos...). attr = item de ATTRIBUTES.
export function attributeExplanation(breakdown, attr, score) {
  const found = breakdown?.attributes?.find(a => a.attribute === attr.id)
  if (!found) return null
  return { title: attr.name, total: score, lines: closed(found.lines, score, 'Outros ajustes') }
}

// PV máximos: dado de vida, Constituição em cada nível e cada bônus (heranças, aprimoramentos, mestre).
export function hpExplanation(breakdown, maxHp) {
  const hp = breakdown?.hp
  if (!hp) return null
  return { title: 'Pontos de vida máximos', total: maxHp, lines: closed(hp.lines, maxHp, 'Outros ajustes') }
}

// Bônus de ataque: modificador do atributo da arma + proficiência (se tiver).
export function attackExplanation(attack, sheet) {
  const attr = attributeById(attack.attribute)
  const mod = attr ? modifier(sheet[ATTRIBUTES.find(a => a.id === attr.id).key]) : 0
  const lines = [{ label: 'Modificador de ' + (attr?.name ?? 'atributo'), amount: mod }]
  if (attack.proficient) lines.push({ label: 'Bônus de proficiência', amount: sheet.proficiencyBonus })
  else lines.push({ label: 'Sem proficiência com a arma', amount: 0 })
  return { title: attack.name + ' · ataque', total: attack.attackBonus, signed: true, lines: closed(lines, attack.attackBonus, 'Troca de atributo ou efeito da ficha') }
}

// Ataque com um Estilo de Luta: o ataque normal mais o que o estilo acrescenta.
export function styleExplanation(attack, style, sheet) {
  const base = attackExplanation(attack, sheet)
  const extra = style.attackBonus - attack.attackBonus
  const lines = [...base.lines]
  if (extra !== 0) lines.push({ label: 'Estilo de Luta: ' + style.name, amount: extra })
  return { title: attack.name + ' · ' + style.name, total: style.attackBonus, signed: true, lines }
}
