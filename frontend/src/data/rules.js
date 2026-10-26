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
  HERITAGE: { name: 'Herança', plural: 'Heranças' },
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
  push('HERITAGE', 'Heranças', abilities.filter(a => a.type === 'HERITAGE'))
  return groups
}

// ---------- criação de personagem ----------

// Tipo de Herança (rules/herancas.json) e de ponto de Herança (concessão HERITAGE_POINTS).
export const HERITAGE_CATEGORIES = { GENERAL: 'Geral', ORIGIN: 'de Origem', REGION: 'de Região' }
export const HERITAGE_SCOPES = { REGION: 'Herança de Região', ORIGIN: 'Herança de Origem', GENERAL: 'Herança Geral', ANY: 'Herança' }

// As Heranças escolhidas vão para o back como lista de { id, option }; repetir o id = escolher de novo.
export const heritageTimes = (picks, id) => picks.filter(p => p.id === id).length

export function addHeritage(picks, id) {
  const option = picks.find(p => p.id === id)?.option ?? null
  return [...picks, { id, option }]
}

// Tira uma escolha (a última) da Herança.
export function removeHeritage(picks, id) {
  const i = picks.map(p => p.id).lastIndexOf(id)
  return i < 0 ? picks : picks.filter((_, n) => n !== i)
}

// A opção (ex.: tribo do Meio-Vastaya) vale para todas as escolhas da mesma Herança.
export const setHeritageOption = (picks, id, option) => picks.map(p => (p.id === id ? { ...p, option } : p))

// Traços da Runinata (rules/tracos.json). Traços e desvantagens vão para o back como lista de { id, detail };
// repetir o id = escolher de novo, e cada escolha tem a sua resposta (detail), quando o traço pede uma.
export const TRAIT_TIERS = { MINOR: 'Menor', MAJOR: 'Maior', SUPERIOR: 'Superior' }

export const traitTimes = (picks, id) => picks.filter(p => p.id === id).length

export const addTrait = (picks, id) => [...picks, { id, detail: null }]

// Tira a última escolha do traço.
export function removeTrait(picks, id) {
  const i = picks.map(p => p.id).lastIndexOf(id)
  return i < 0 ? picks : picks.filter((_, n) => n !== i)
}

// Resposta da n-ésima escolha do traço (0 = a primeira).
export function setTraitDetail(picks, id, n, detail) {
  let seen = -1
  return picks.map(p => (p.id === id && ++seen === n ? { ...p, detail } : p))
}

// Pontos de Origem com meio ponto: 2.5 → "2,5".
export const formatPoints = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

// Tipos de deslocamento (concessão SPEED com value; ficha e prévia em "speeds"). ALL = todos os deslocamentos.
export const MOVEMENT_NAMES = { WALK: 'Caminhada', SWIM: 'Natação', CLIMB: 'Escalada', FLY: 'Voo', BURROW: 'Escavação' }

// Deslocamento em pés, como no livro.
export const formatFeet = ft => ft.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' pés'

export const SIZE_NAMES = { TINY: 'Miúdo', SMALL: 'Pequeno', MEDIUM: 'Médio', LARGE: 'Grande', HUGE: 'Enorme' }

const attrName = id => attributeById(id)?.name ?? id
const signed = n => (n < 0 ? '−' + Math.abs(n) : '+' + n).replace('.', ',')
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many)

// PV que escala com o bônus de proficiência (HP_BONUS com usesFormula).
const HP_FORMULAS = { HALF_PROFICIENCY: '+½ do bônus de proficiência em', PROFICIENCY: '+bônus de proficiência em' }

// Texto curto de uma concessão do catálogo (rules/criacao.json), para os cartões do assistente.
// crafts: lista de ofícios do catálogo, para mostrar o nome no lugar do id.
export function grantLabel(g, crafts = []) {
  switch (g.type) {
    case 'ATTRIBUTE': return signed(g.amount) + ' ' + attrName(g.attribute)
    case 'ATTRIBUTE_CHOICE': return g.label ?? signed(g.amount) + ' em ' + plural(g.count, 'atributo', 'atributos') + ' à escolha'
    case 'SKILL': return 'Perícia: ' + (SKILL_NAMES[g.skill] ?? g.skill)
    case 'SKILL_CHOICE': return g.label ?? plural(g.count, 'perícia', 'perícias') + ' à escolha'
    case 'SAVING_THROW': return 'Resistência: ' + attrName(g.attribute)
    case 'FEATURE': return (ABILITY_TYPES[g.abilityType ?? 'PASSIVE']?.name ?? 'Passiva') + ': ' + g.name + (g.options?.length ? ' (à escolha)' : '')
    case 'PROFICIENCY_CHOICE': return g.label ?? plural(g.count, 'proficiência', 'proficiências') + ' à escolha'
    case 'HP_BONUS': return g.label ?? (HP_FORMULAS[g.usesFormula] ?? signed(g.amount)) + ' PV' + (g.perLevel ? ' por nível' : '')
    case 'SPEED': return signed(g.feet) + ' pés de ' + (!g.value || g.value === 'WALK' ? 'deslocamento'
      : g.value === 'ALL' ? 'todos os deslocamentos' : MOVEMENT_NAMES[g.value]?.toLowerCase() ?? g.value)
    case 'GOLD': return signed(g.amount) + ' de ouro'
    case 'SIZE': return 'Tamanho: ' + (SIZE_NAMES[g.value] ?? g.value)
    case 'SIZE_CHOICE': return g.label ?? 'Tamanho: ' + g.options.map(o => SIZE_NAMES[o] ?? o).join(' ou ')
    case 'CRAFT': return 'Ofício: ' + (crafts.find(k => k.id === g.value)?.name ?? g.value)
    case 'CRAFT_CHOICE': return g.label ?? plural(g.count, 'ofício', 'ofícios') + ' à escolha'
    case 'LANGUAGE': return 'Idioma: ' + g.value
    case 'LANGUAGE_CHOICE': return g.label ?? plural(g.count, 'idioma', 'idiomas') + (g.fromRegion ? ' da região' : ' à escolha')
    case 'HERITAGE_POINTS': return g.label ?? signed(g.amount) + (Math.abs(g.amount) === 1 ? ' ponto de ' : ' pontos de ') + HERITAGE_SCOPES[g.value ?? 'ANY']
    default: return g.type
  }
}

// Nome em PT de uma opção de escolha (atributo, perícia, tamanho, ofício ou idioma).
export function choiceOptionName(type, id, crafts = []) {
  switch (type) {
    case 'ATTRIBUTE_CHOICE': return attrName(id)
    case 'SKILL_CHOICE': return SKILL_NAMES[id] ?? id
    case 'SIZE_CHOICE': return SIZE_NAMES[id] ?? id
    case 'CRAFT_CHOICE': return crafts.find(k => k.id === id)?.name ?? id
    // "SKILL:ARCANA", "CRAFT:alquimista" ou "MARTIAL_WEAPON"
    case 'PROFICIENCY_CHOICE': {
      const [kind, value] = id.split(':')
      if (kind === 'SKILL') return 'Perícia: ' + (SKILL_NAMES[value] ?? value)
      if (kind === 'CRAFT') return 'Ofício: ' + (crafts.find(k => k.id === value)?.name ?? value)
      return 'Arma marcial'
    }
    default: return id
  }
}

// Custo total da compra de pontos com os valores atuais (null onde ainda não há valor).
export function pointBuySpent(pointBuy, values) {
  return Object.values(values).reduce((sum, v) => sum + (v == null ? 0 : pointBuy.costs[String(v)] ?? 0), 0)
}

// 4d6 descartando o menor, o jeito clássico de rolar atributos.
export function roll4d6DropLowest(random) {
  const dice = [rollDie(6, random), rollDie(6, random), rollDie(6, random), rollDie(6, random)].sort((a, b) => a - b)
  return dice[1] + dice[2] + dice[3]
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
