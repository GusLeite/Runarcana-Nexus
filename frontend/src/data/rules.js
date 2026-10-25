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

// d20 com crypto quando disponível (rolagem justa), Math.random como reserva.
export function rollD20(random = defaultRandom) {
  return Math.floor(random() * 20) + 1
}

function defaultRandom() {
  if (globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buf)
    return buf[0] / 2 ** 32
  }
  return Math.random()
}
