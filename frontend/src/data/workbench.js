// Bancada de fabricação: cada ofício cai numa "estação" (forja, alambique, tear...) com verbo, cor e emblema próprios,
// e as contas do teste (que face do d20 dá o quê), espelhando WorkbenchService no back.

export const STATIONS = {
  forge: { name: 'Forja', verb: 'FORJAR', working: 'Martelando…', hue: '#ff8a3d', hue2: '#ffd27a' },
  alchemy: { name: 'Alambique', verb: 'DESTILAR', working: 'Destilando…', hue: '#5fe08a', hue2: '#c8ffb0' },
  kitchen: { name: 'Fogareiro', verb: 'COZINHAR', working: 'No fogo…', hue: '#ffb347', hue2: '#ffe0a3' },
  gems: { name: 'Mesa de lapidação', verb: 'LAPIDAR', working: 'Lapidando…', hue: '#c07cff', hue2: '#ecd2ff' },
  loom: { name: 'Tear', verb: 'COSTURAR', working: 'Costurando…', hue: '#ff7ab6', hue2: '#ffd0e6' },
  gears: { name: 'Engenho', verb: 'MONTAR', working: 'Ajustando engrenagens…', hue: '#2fd3c0', hue2: '#b6fff4' },
  runes: { name: 'Círculo rúnico', verb: 'ENCANTAR', working: 'Gravando runas…', hue: '#7aa8ff', hue2: '#d6e4ff' },
  carving: { name: 'Bancada de entalhe', verb: 'ENTALHAR', working: 'Entalhando…', hue: '#d9b46a', hue2: '#fff0c4' },
  quill: { name: 'Escrivaninha', verb: 'CRIAR', working: 'Traçando…', hue: '#e8dfc8', hue2: '#ffffff' },
}

const BY_CRAFT = {
  cuteleiro: 'forge', armoreiro: 'forge', armeiro: 'forge', chaveiro: 'forge',
  alquimista: 'alchemy', apotecario: 'alchemy', fermentador: 'alchemy',
  cozinheiro: 'kitchen',
  joalheiro: 'gems',
  modista: 'loom',
  tecmaturgo: 'gears', armadilheiro: 'gears', encarrocador: 'gears',
  encantador: 'runes',
  pedreiro: 'carving', artesanato: 'carving', arqueirista: 'carving',
  falsificador: 'quill', artista: 'quill', guia: 'quill', coletor: 'quill', jogador: 'quill',
}

export const stationOf = craftId => BY_CRAFT[craftId] ?? 'forge'

// O que cada face do d20 dá (mesma regra do back): 'masterwork' (na margem de Obra-Prima), 'success' (total >= CD),
// 'failed' (falha por menos de 5: metade dos materiais volta) ou 'ruined' (1 natural ou falha por 5 ou mais).
export function faceOutcome(d20, bonus, dc, masterworkAt = 20) {
  const total = d20 + (bonus ?? 0)
  if (d20 >= masterworkAt) return 'masterwork'
  if (d20 !== 1 && total >= dc) return 'success'
  if (d20 === 1 || total <= dc - 5) return 'ruined'
  return 'failed'
}

export function faces(bonus, dc, masterworkAt) {
  return Array.from({ length: 20 }, (_, i) => faceOutcome(i + 1, bonus, dc, masterworkAt))
}

// Chances em %, de 5 em 5: { masterwork, success (inclui a Obra-prima), failed, ruined }.
export function chances(bonus, dc, masterworkAt) {
  const f = faces(bonus, dc, masterworkAt)
  const n = k => f.filter(x => x === k).length * 5
  return { masterwork: n('masterwork'), success: n('success') + n('masterwork'), failed: n('failed'), ruined: n('ruined') }
}

// Materiais = metade do valor, em PO para cima.
export const materialCost = value => Math.ceil((value ?? 0) / 2)

// Grau escolhido: CD e valor (o último da lista vale para os graus seguintes).
export function tierOf(recipe, tier = 0) {
  const pick = list => (list?.length ? list[Math.min(tier, list.length - 1)] : null)
  const dc = pick(recipe.dcs)
  const value = pick(recipe.values)
  return { dc, value, cost: value == null ? null : materialCost(value) }
}

// "2 ml de Cintila Pura, Frutomel e Conjunto de Ofício" → ["2 ml de Cintila Pura", "Frutomel", "Conjunto de Ofício"].
export function splitComponents(text) {
  if (!text) return []
  return text
    .replace(/\.$/, '')
    .split(/,|;|\s+e\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9])/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 6)
}

export const OUTCOME_TEXT = {
  masterwork: { title: 'OBRA-PRIMA!', sub: 'Uma peça digna de lenda.' },
  success: { title: 'SUCESSO', sub: 'Pronto, direto para a mochila.' },
  failed: { title: 'QUASE…', sub: 'Não saiu, mas parte dos materiais se salvou.' },
  ruined: { title: 'ARRUINADO', sub: 'Os materiais se perderam.' },
}

export const fold = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
