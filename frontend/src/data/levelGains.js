import { ATTRIBUTES } from './rules.js'

const SPELL = 'SPELL'
const names = list => list ?? []
const added = (before, after) => names(after).filter(x => !names(before).includes(x))

// O que mudou entre a ficha de antes e a de depois da subida de nível, para o resumo da cerimônia.
// before/after: respostas de /character/me ({ character, abilities }). Só entra o que mudou.
export function levelUpGains(before, after) {
  const a = before.character
  const b = after.character
  const oldIds = new Set(names(before.abilities).map(x => x.id))
  const fresh = names(after.abilities).filter(x => !oldIds.has(x.id))
  const oldClasses = names(a.classLevels).map(c => c.classId)
  return {
    fromLevel: a.level,
    toLevel: b.level,
    maxHp: b.maxHp !== a.maxHp ? { from: a.maxHp, to: b.maxHp } : null,
    proficiency: b.proficiencyBonus !== a.proficiencyBonus ? { from: a.proficiencyBonus, to: b.proficiencyBonus } : null,
    attributes: ATTRIBUTES.filter(x => b[x.key] !== a[x.key]).map(x => ({ abbr: x.abbr, from: a[x.key], to: b[x.key] })),
    newClasses: names(b.classLevels).filter(c => !oldClasses.includes(c.classId)).map(c => c.name),
    subclass: b.subclass && b.subclass !== a.subclass ? b.subclass : null,
    abilities: fresh.filter(x => x.type !== SPELL).map(x => x.name),
    spells: fresh.filter(x => x.type === SPELL).map(x => x.name),
    heritages: added(a.heritages, b.heritages),
    crafts: added(a.crafts, b.crafts),
    languages: added(a.languages, b.languages),
  }
}
