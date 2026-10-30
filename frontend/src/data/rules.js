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
  BRUTE: 'Bruto',
  HUNTER: 'Caçador',
  FIGHTER: 'Combatente',
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

// perPick (Herança com optionPerPick, ex.: Forma de Sho'Ma): a escolha nova começa sem opção.
export function addHeritage(picks, id, perPick = false) {
  const option = perPick ? null : picks.find(p => p.id === id)?.option ?? null
  return [...picks, { id, option }]
}

// Tira uma escolha (a última) da Herança.
export function removeHeritage(picks, id) {
  const i = picks.map(p => p.id).lastIndexOf(id)
  return i < 0 ? picks : picks.filter((_, n) => n !== i)
}

// A opção (ex.: tribo do Meio-Vastaya) vale para todas as escolhas da mesma Herança; com index, só para a
// escolha de número index dela (Heranças com uma opção por escolha).
export function setHeritageOption(picks, id, option, index = null) {
  let n = -1
  return picks.map(p => {
    if (p.id !== id) return p
    n++
    return index == null || n === index ? { ...p, option } : p
  })
}

// As opções de cada escolha da Herança, na ordem.
export const heritageOptions = (picks, id) => picks.filter(p => p.id === id).map(p => p.option ?? null)

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

// Proficiências com armaduras (concessão ARMOR_PROFICIENCY e ficha).
export const ARMOR_NAMES = { LIGHT: 'Leves', MEDIUM: 'Médias', HEAVY: 'Pesadas', SHIELD: 'Escudos' }

export const SIZE_NAMES = { TINY: 'Miúdo', SMALL: 'Pequeno', MEDIUM: 'Médio', LARGE: 'Grande', HUGE: 'Enorme' }

const attrName = id => attributeById(id)?.name ?? id
const signed = n => (n < 0 ? '−' + Math.abs(n) : '+' + n).replace('.', ',')
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many)

// PV que escala com o bônus de proficiência (HP_BONUS com usesFormula).
const HP_FORMULAS = { HALF_PROFICIENCY: '+½ do bônus de proficiência em', PROFICIENCY: '+bônus de proficiência em' }

// Texto curto de uma concessão do catálogo (rules/criacao.json), para os cartões do assistente.
// crafts: lista de ofícios do catálogo, para mostrar o nome no lugar do id; equipment: itens do rules/itens.json.
export function grantLabel(g, crafts = [], equipment = []) {
  switch (g.type) {
    case 'ATTRIBUTE': return signed(g.amount) + ' ' + attrName(g.attribute)
    case 'ATTRIBUTE_CHOICE': return g.label ?? signed(g.amount) + ' em ' + plural(g.count, 'atributo', 'atributos') + ' à escolha'
    case 'SKILL': return 'Perícia: ' + (SKILL_NAMES[g.skill] ?? g.skill) + (g.expertise ? ' (especialidade se já tiver)' : '')
    case 'SKILL_CHOICE': return g.label ?? plural(g.count, 'perícia', 'perícias') + ' à escolha' + (g.expertise ? ' (especialidade se já tiver)' : '')
    case 'EXPERTISE_CHOICE': return g.label ?? 'Especialidade em ' + plural(g.count, 'perícia', 'perícias') + ' que já tem'
    case 'SAVING_THROW': return 'Resistência: ' + attrName(g.attribute)
    case 'SAVING_THROW_CHOICE': return g.label ?? 'Resistência à escolha: ' + (g.options ?? []).map(attrName).join(' ou ')
    case 'ARMOR_PROFICIENCY': return 'Armaduras: ' + (ARMOR_NAMES[g.value] ?? g.value)
    case 'WEAPON_PROFICIENCY': return 'Armas: ' + g.value
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
    case 'ARMOR_CLASS': return 'CA: ' + g.name + (g.options?.length ? ' (atributo à escolha)' : '')
    case 'AC_BONUS': return 'CA: ' + g.name + ' ' + (g.usesFormula === 'PROFICIENCY' ? '+bônus de proficiência' : signed(g.amount ?? 0))
      + (g.armor?.unarmoredOnly ? ' sem armadura' : '')
    case 'HERITAGE_POINTS': return g.label ?? signed(g.amount) + (Math.abs(g.amount) === 1 ? ' ponto de ' : ' pontos de ') + HERITAGE_SCOPES[g.value ?? 'ANY']
    case 'RESOURCE_CHOICE': return g.label ?? (g.value === 'VEL' ? 'Vel (opcional, até ' + g.amount + ' ◆)' : (RESOURCE_KINDS[g.value] ?? g.value) + ' à escolha')
    case 'EQUIPMENT': return 'Equipamento: ' + equipmentOptionName(g.value, equipment)
    case 'EQUIPMENT_CHOICE': return g.label ?? 'Equipamento à escolha'
    case 'SPELL_CHOICE': return g.label ?? (g.spellLevel ? plural(g.count, 'magia', 'magias') + ' até o ' + g.spellLevel + 'º nível' : plural(g.count, 'truque', 'truques')) + ' à escolha'
    case 'MYSTERY': return 'Mistério: ' + idName(g.value)
    case 'SPELL': return 'Magia: ' + idName(g.value)
    default: return g.type
  }
}

// Nome em PT de uma opção de escolha (atributo, perícia, tamanho, ofício ou idioma).
export function choiceOptionName(type, id, crafts = [], items = []) {
  switch (type) {
    case 'EQUIPMENT_CHOICE': return equipmentOptionName(id, items)
    case 'ATTRIBUTE_CHOICE':
    case 'ARMOR_CLASS': return attrName(id)
    case 'SKILL_CHOICE': return SKILL_NAMES[id] ?? id
    // Nota situacional à escolha (traço Habilidoso): o alvo é "SKILL:STEALTH".
    case 'SITUATIONAL': return id.startsWith('SKILL:') ? SKILL_NAMES[id.slice(6)] ?? id : id
    case 'SAVING_THROW_CHOICE': return attrName(id)
    // Especialidade: perícia ("STEALTH") ou, com ofícios, "SKILL:STEALTH" / "CRAFT:chaveiro".
    case 'EXPERTISE_CHOICE': {
      const [kind, value] = id.includes(':') ? id.split(':') : ['SKILL', id]
      if (kind === 'CRAFT') return 'Ofício: ' + (crafts.find(k => k.id === value)?.name ?? value)
      return (id.includes(':') ? 'Perícia: ' : '') + (SKILL_NAMES[value] ?? value)
    }
    case 'SIZE_CHOICE': return SIZE_NAMES[id] ?? id
    case 'CRAFT_CHOICE': return crafts.find(k => k.id === id)?.name ?? id
    // "SKILL:ARCANA", "CRAFT:alquimista", "ARMOR:LIGHT", "WEAPON:Armas de fogo leves" ou "MARTIAL_WEAPON"
    case 'PROFICIENCY_CHOICE': {
      const [kind, value] = id.split(':')
      if (kind === 'SKILL') return 'Perícia: ' + (SKILL_NAMES[value] ?? value)
      if (kind === 'CRAFT') return 'Ofício: ' + (crafts.find(k => k.id === value)?.name ?? value)
      if (kind === 'ARMOR') return 'Armadura: ' + (ARMOR_NAMES[value] ?? value)
      if (kind === 'WEAPON') return 'Arma: ' + id.slice(7)
      return 'Arma marcial'
    }
    default: return id
  }
}

// "maos-magicas" → "Maos magicas" (id sem o catálogo de magias, só para os cartões).
function idName(id = '') {
  const text = id.replace(/-/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Opção de equipamento (rules/itens.json): "besta-leve+virotes-de-besta" → "Besta Leve + Virotes de besta (20)",
// "machadinha*2" → "Machadinha ×2".
export function equipmentOptionName(option, items = []) {
  return option.split('+').map(part => {
    const [id, qty] = part.split('*')
    const name = items.find(i => i.id === id)?.name ?? id
    return Number(qty) > 1 ? name + ' ×' + qty : name
  }).join(' + ')
}

// Categoria do catálogo do primeiro item da opção (agrupa as escolhas longas de equipamento).
export function equipmentCategory(option, items = []) {
  const id = option.split('+')[0].split('*')[0]
  return items.find(i => i.id === id)?.category ?? null
}

// Tipos de recurso de classe do Capítulo 5 (rules/recursos.json).
export const RESOURCE_KINDS = {
  IRA: 'Ira', SUTRA: 'Sutra', VEL: 'Vel', TECNICA: 'Técnica de Combate', INVOCACAO: 'Invocação', GRANDE_ESPIRITO: 'Grande Espírito',
  ASPECTO_TERRESTRE: 'Aspecto Terrestre', ASPECTO_AQUATICO: 'Aspecto Aquático', ASPECTO_ALADO: 'Aspecto Alado', RUNA: 'Runa',
}

// Pontos de Vel (◆) que um recurso ocupa; sem custo, 1.
export function resourceCost(resource) {
  return resource?.cost ?? 1
}

// Marca ou desmarca uma opção: com max 1, trocar substitui; cheio, não acrescenta.
export function togglePick(current, id, max) {
  if (current.includes(id)) return current.filter(x => x !== id)
  if (max === 1) return [id]
  return current.length < max ? [...current, id] : current
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

// Teste contra a morte (d20): 20 = volta com 1 PV; 1 = duas falhas; 10+ = um sucesso; senão uma falha (máx. 3 cada).
export function deathSaveResult(d20, successes = 0, failures = 0) {
  if (d20 === 20) return { successes: 0, failures: 0, revived: true }
  if (d20 === 1) return { successes, failures: Math.min(3, failures + 2), revived: false }
  if (d20 >= 10) return { successes: Math.min(3, successes + 1), failures, revived: false }
  return { successes, failures: Math.min(3, failures + 1), revived: false }
}

// Dano do crítico: os dados rolam multiplier vezes, o bônus soma uma vez ("1d8+3", 3 → "3d8+3").
export function critDice(expr, multiplier = 2) {
  const d = parseDice(expr)
  if (!d) return null
  return d.count * multiplier + 'd' + d.sides + (d.bonus ? (d.bonus > 0 ? '+' : '-') + Math.abs(d.bonus) : '')
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

// Escolha da fonte dominante (chave "dominant:...", Progressão Tecnológica com as duas Fontes) que ainda não foi feita
// (ou que está sendo feita agora, em draftChoices): na subida de nível, quando a 2ª Fonte chega.
export function dominantChoices(choices, draftChoices) {
  return (choices ?? []).filter(c => c.key.startsWith('dominant:') && (!c.selected?.length || c.key in (draftChoices ?? {})))
}

// Escolhas que vêm das Heranças (chave "heritage:<id>:<índice>"), só das que estão em picks ([{ id }]).
export function heritageChoices(choices, picks) {
  const ids = new Set((picks ?? []).map(p => p.id))
  return (choices ?? []).filter(c => c.key.startsWith('heritage:') && ids.has(c.key.split(':')[1]))
}

// Ofícios do livro (id do criacao.json → nome), para as fórmulas.
export const CRAFT_NAMES = {
  alquimista: 'Alquimista', apotecario: 'Apotecário', armadilheiro: 'Armadilheiro', armeiro: 'Armeiro', armoreiro: 'Armoreiro',
  arqueirista: 'Arqueirista', chaveiro: 'Chaveiro', cozinheiro: 'Cozinheiro', cuteleiro: 'Cuteleiro', encantador: 'Encantador',
  encarrocador: 'Encarroçador', fermentador: 'Fermentador', joalheiro: 'Joalheiro', modista: 'Modista', pedreiro: 'Pedreiro',
  tecmaturgo: 'Tecmaturgo', artesanato: 'Artesanato', artista: 'Artista', coletor: 'Coletor', falsificador: 'Falsificador',
  guia: 'Guia', jogador: 'Jogador',
}
export const craftIdOf = name => Object.keys(CRAFT_NAMES).find(id => CRAFT_NAMES[id].toLowerCase() === (name ?? '').toLowerCase())

// Notas situacionais da ficha para um alvo ("SKILL:STEALTH", "SAVE:DEXTERITY", "SAVE", "AC", "INITIATIVE"), já com a fonte:
// "Sagaz: vantagem em Furtividade...". Para salvaguardas, "SAVE:X" também pega as gerais ("SAVE").
export function situationalFor(sheet, target) {
  const list = sheet?.situational ?? []
  return list.filter(n => n.target === target || (target.startsWith('SAVE:') && n.target === 'SAVE'))
    .map(n => n.source.replace(/^[^:]+: /, '') + ': ' + n.note)
}

// ---------- Subida de nível ----------

// Níveis do personagem que dão 1 ponto de Herança.
export const HERITAGE_LEVELS = [5, 9, 13, 17]

// As escolhas da prévia que são do nível N: as chaves "level:N:..." e as escolhas internas dos recursos escolhidos
// nele ("resource:<id>@level:N:...:<índice>"), cada interna logo depois da escolha que a criou.
export function levelChoices(choices, level) {
  const mark = 'level:' + level + ':'
  const mine = (choices ?? []).filter(c => c.key.startsWith(mark) || c.key.includes('@' + mark))
  const parentOf = c => (c.key.includes('@') ? c.key.slice(c.key.indexOf('@') + 1).replace(/:\d+$/, '') : null)
  const out = []
  const place = parent => mine.filter(c => parentOf(c) === parent.key).forEach(c => { out.push(c); place(c) })
  mine.filter(c => !parentOf(c) || !mine.some(p => p.key === parentOf(c))).forEach(c => { out.push(c); place(c) })
  return out
}

// Só as escolhas que ainda existem na prévia (trocar a classe do nível apaga as da classe anterior).
export function keepChoices(picks, choices) {
  const keys = new Set((choices ?? []).map(c => c.key))
  return Object.fromEntries(Object.entries(picks).filter(([k]) => keys.has(k)))
}

// ---------- Pontos de vida ----------

// Dano, cura e PV temporários: { currentHp, tempHp } depois da ação. O dano gasta os temporários primeiro;
// a cura não passa do máximo e não mexe nos temporários; "temp" troca os temporários pelo valor (não somam).
export function applyHp({ currentHp, tempHp = 0, maxHp }, action, amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0))
  if (action === 'damage') {
    const absorbed = Math.min(tempHp, n)
    return { currentHp: Math.max(0, currentHp - (n - absorbed)), tempHp: tempHp - absorbed }
  }
  if (action === 'heal') return { currentHp: Math.min(maxHp, currentHp + n), tempHp }
  if (action === 'temp') return { currentHp, tempHp: n }
  return { currentHp, tempHp }
}
