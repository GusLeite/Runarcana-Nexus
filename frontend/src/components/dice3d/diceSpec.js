// Que dados 3D uma rolagem vira (sem importar three nem a física, para decidir antes de carregar a cena).
// null = sem versão 3D (dado sem forma, como d100, ou dados demais): a tela usa o dado 2D de sempre.
import { supportsSides } from './diceShapes.js'

export const MAX_DICE = 10

export function diceForRoll(roll) {
  if (!roll) return null
  if (roll.hidden) {
    // Rolagem secreta de outro: um d20 envolto em névoa, sem números (o servidor nem manda o valor).
    return { dice: [{ sides: 20, value: 1 + Math.floor(Math.random() * 20) }], effects: { fog: true } }
  }
  if (roll.kind === 'check') {
    if (!(roll.d20 >= 1 && roll.d20 <= 20)) return null
    const dice = [{ sides: 20, value: roll.d20 }]
    const effects = {}
    if (roll.other != null) {
      dice.push({ sides: 20, value: roll.other })
      effects.dim = [1] // vantagem/desvantagem: o descartado escurece
    }
    if (roll.d20 >= (roll.critRange ?? 20)) effects.crit = 0
    else if (roll.d20 === 1) effects.fumble = 0
    return { dice, effects }
  }
  const values = roll.rolls ?? []
  if (!supportsSides(roll.sides) || values.length === 0 || values.length > MAX_DICE) return null
  if (values.some(v => !(v >= 1 && v <= roll.sides))) return null
  return { dice: values.map(value => ({ sides: roll.sides, value })), effects: {} }
}
