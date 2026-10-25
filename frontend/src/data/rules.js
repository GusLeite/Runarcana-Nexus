// Regras e rótulos em PT da ficha (Runarcana, baseado em D&D 5e).
// Os cálculos que contam (bônus de perícia, proficiência, passivas) vêm prontos do back-end;
// aqui ficam só os nomes, a formatação e o que é derivado direto dos atributos.

export const ATTRIBUTES = [
  { key: 'str', id: 'STRENGTH', abbr: 'FOR', name: 'Força' },
  { key: 'dex', id: 'DEXTERITY', abbr: 'DES', name: 'Destreza' },
  { key: 'con', id: 'CONSTITUTION', abbr: 'CON', name: 'Constituição' },
  { key: 'intel', id: 'INTELLIGENCE', abbr: 'INT', name: 'Inteligência' },
  { key: 'wis', id: 'WISDOM', abbr: 'SAB', name: 'Sabedoria' },
  { key: 'cha', id: 'CHARISMA', abbr: 'CAR', name: 'Carisma' },
]

export const attributeById = id => ATTRIBUTES.find(a => a.id === id)

export const SKILL_NAMES = {
  ATHLETICS: 'Atletismo',
  ACROBATICS: 'Acrobacia',
  SLEIGHT_OF_HAND: 'Prestidigitação',
  STEALTH: 'Furtividade',
  ARCANA: 'Arcanismo',
  HISTORY: 'História',
  INVESTIGATION: 'Investigação',
  NATURE: 'Natureza',
  RELIGION: 'Religião',
  TECHNOLOGY: 'Tecnologia',
  INSIGHT: 'Intuição',
  ANIMAL_HANDLING: 'Adestrar Animais',
  MEDICINE: 'Medicina',
  PERCEPTION: 'Percepção',
  SURVIVAL: 'Sobrevivência',
  DECEPTION: 'Enganação',
  INTIMIDATION: 'Intimidação',
  PERFORMANCE: 'Atuação',
  PERSUASION: 'Persuasão',
}

export const CLASS_NAMES = {
  ACOLYTE: 'Acólito',
  ARCANIST: 'Arcanista',
  MARKSMAN: 'Atirador',
  BODHISATTVA: 'Bodisatva',
  BRUTE: 'Brutamontes',
  HUNTER: 'Caçador',
  FIGHTER: 'Lutador',
  MERCURIAL: 'Mercurial',
  SHAMAN: 'Xamã',
}

export const REGION_NAMES = {
  BILGEWATER: 'Águas de Sentina',
  BANDLE_CITY: 'Cidade de Bandle',
  DEMACIA: 'Demacia',
  FRELJORD: 'Freljord',
  SHADOW_ISLES: 'Ilhas das Sombras',
  IONIA: 'Ionia',
  IXTAL: 'Ixtal',
  NOXUS: 'Noxus',
  NAZUMAH: 'Nazumah',
  PILTOVER: 'Piltover',
  SHURIMA: 'Shurima',
  TARGON: 'Targon',
  VOID: 'O Vazio',
  ZAUN: 'Zaun',
}

export const ALIGNMENT_NAMES = {
  LAWFUL_GOOD: 'Leal e Bom',
  NEUTRAL_GOOD: 'Neutro e Bom',
  CHAOTIC_GOOD: 'Caótico e Bom',
  LAWFUL_NEUTRAL: 'Leal e Neutro',
  TRUE_NEUTRAL: 'Neutro',
  CHAOTIC_NEUTRAL: 'Caótico e Neutro',
  LAWFUL_EVIL: 'Leal e Mau',
  NEUTRAL_EVIL: 'Neutro e Mau',
  CHAOTIC_EVIL: 'Caótico e Mau',
}

// Cores seguem a escala de raridade do cliente do LoL (cinza → verde → azul → roxo → dourado).
export const RARITIES = {
  Common: { name: 'Comum', color: '#a09b8c' },
  Uncommon: { name: 'Incomum', color: '#3fbf6a' },
  Rare: { name: 'Raro', color: '#3aa0ff' },
  Epic: { name: 'Épico', color: '#b25cff' },
  Legendary: { name: 'Lendário', color: '#f0b232' },
  Mythical: { name: 'Mítico', color: '#ff6a3d' },
  Forbidden: { name: 'Proibido', color: '#e0204a' },
}

export const rarityOf = rarity => RARITIES[rarity] ?? RARITIES.Common

export const ITEM_KINDS = {
  WEAPON: 'Arma',
  ARMOR: 'Armadura',
  CONSUMABLE: 'Consumível',
  OBJECT: 'Objeto',
}

export const DAMAGE_TYPES = { B: 'contundente', P: 'perfurante', S: 'cortante' }

export const WEAPON_PROPERTIES = {
  FINESSE: 'Acuidade',
  THROWN: 'Arremesso',
  TWO_HANDED: 'Duas mãos',
  LIGHT: 'Leve',
  HEAVY: 'Pesada',
  VERSATILE: 'Versátil',
  AMMUNITION: 'Munição',
  RELOAD: 'Recarga',
  EXPLOSIVE: 'Explosiva',
  SCATTER: 'Dispersão',
  REACH: 'Alcance',
}

export const ARMOR_WEIGHTS = { LIGHT: 'Leve', MEDIUM: 'Média', HEAVY: 'Pesada' }

export const modifier = score => Math.floor((score - 10) / 2)

// "+3", "+0", "−1" (sinal de menos de verdade, que alinha com o "+").
export const formatModifier = value => (value < 0 ? '−' + Math.abs(value) : '+' + value)

// Capacidade de carga do 5e (Força × 15 lb), convertida para kg.
export const carryCapacity = str => str * 7.5

export const formatKg = value =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' kg'

export const totalWeight = inventory =>
  inventory.reduce((sum, item) => sum + (item.weight ?? 0) * item.quantity, 0)

export const totalValue = inventory =>
  inventory.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)

// Linhas de atributos do item para o painel de detalhes.
export function itemStats(item) {
  const stats = []
  if (item.damage) {
    stats.push('Dano ' + item.damage + (item.damageType ? ' ' + DAMAGE_TYPES[item.damageType] : ''))
  }
  if (item.properties?.length) {
    stats.push(item.properties.map(p => WEAPON_PROPERTIES[p] ?? p).join(' · '))
  }
  if (item.armorClass != null) {
    stats.push('CA ' + item.armorClass + (item.armorWeight ? ' · ' + ARMOR_WEIGHTS[item.armorWeight] : ''))
  }
  return stats
}

// Perícias agrupadas pelo atributo base, na ordem da ficha.
export function groupSkills(skills) {
  return ATTRIBUTES
    .map(attr => ({ attr, skills: skills.filter(s => s.attribute === attr.id) }))
    .filter(group => group.skills.length > 0)
}

// ---------- magias e habilidades ----------

export const ABILITY_TYPES = {
  ABILITY: { name: 'Habilidade', plural: 'Habilidades' },
  PASSIVE: { name: 'Passiva', plural: 'Passivas' },
  SPELL: { name: 'Magia', plural: 'Magias' },
}

export const RECHARGES = {
  SHORT_REST: 'Descanso curto',
  LONG_REST: 'Descanso longo',
  NONE: 'Não recupera',
}

export const spellLevelName = level => (level === 0 ? 'Truque' : level + 'º círculo')

// Ordem da aba: habilidades, passivas e magias por círculo (truques primeiro).
export function groupAbilities(abilities) {
  const groups = []
  const push = (key, title, list) => list.length && groups.push({ key, title, list })
  push('ABILITY', 'Habilidades', abilities.filter(a => a.type === 'ABILITY'))
  push('PASSIVE', 'Passivas', abilities.filter(a => a.type === 'PASSIVE'))
  const spells = abilities.filter(a => a.type === 'SPELL')
  const levels = [...new Set(spells.map(s => s.spellLevel ?? 0))].sort((a, b) => a - b)
  levels.forEach(l => push('SPELL-' + l, l === 0 ? 'Truques' : 'Magias de ' + l + 'º círculo', spells.filter(s => (s.spellLevel ?? 0) === l)))
  return groups
}

// ---------- documentos ----------

export const DOCUMENT_KINDS = {
  LETTER: { name: 'Carta', color: '#c8a24a' },
  CLUE: { name: 'Pista', color: '#2fd3c0' },
  MAP: { name: 'Mapa', color: '#6fbf5a' },
  LORE: { name: 'Lore', color: '#8f7cff' },
  SECRET: { name: 'Segredo', color: '#e0204a' },
  REWARD: { name: 'Recompensa', color: '#f0b232' },
}

export const documentKindOf = kind => DOCUMENT_KINDS[kind] ?? DOCUMENT_KINDS.LETTER

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ---------- dados ----------

// d20 com crypto quando disponível (rolagem justa), Math.random como reserva.
export function rollD20(random = defaultRandom) {
  return rollDie(20, random)
}

export function rollDie(sides, random = defaultRandom) {
  return Math.floor(random() * sides) + 1
}

// Teste de d20 com vantagem ('adv'), desvantagem ('dis') ou normal: devolve o dado que vale e o descartado.
export function rollCheck(mode = 'normal', random = defaultRandom) {
  const a = rollD20(random)
  if (mode === 'normal') return { d20: a, other: null }
  const b = rollD20(random)
  const keep = mode === 'adv' ? Math.max(a, b) : Math.min(a, b)
  return { d20: keep, other: keep === a ? b : a }
}

// "2d6+4" → { count: 2, sides: 6, bonus: 4 }; null se não for uma expressão de dados.
export function parseDice(expr) {
  const m = /^\s*(\d+)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i.exec(expr ?? '')
  if (!m) return null
  const count = Number(m[1])
  const sides = Number(m[2])
  if (count < 1 || count > 100 || sides < 2) return null
  return { count, sides, bonus: m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0 }
}

export function rollDice(expr, random = defaultRandom) {
  const dice = parseDice(expr)
  if (!dice) return null
  const rolls = Array.from({ length: dice.count }, () => rollDie(dice.sides, random))
  return { ...dice, rolls, total: rolls.reduce((s, r) => s + r, 0) + dice.bonus }
}

function defaultRandom() {
  if (globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buf)
    return buf[0] / 2 ** 32
  }
  return Math.random()
}
