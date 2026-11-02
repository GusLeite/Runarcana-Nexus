// Ícones de item desenhados em SVG (32×32) enquanto os itens não têm arte própria.
// Cada desenho tem traço claro e uma parte preenchida (.f) com a cor da raridade (--r), que o CSS aplica.
// O desenho vem do nome do item (espada, machado, poção, pergaminho...) e, na falta, do tipo.

const fold = s => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const DRAWINGS = {
  sword: <><path className="f" d="M11 19 25 5h3v3L13 22Z" /><path d="M8 17l8 8M12 21 5 28" /><circle cx="4" cy="29" r="1.5" /></>,
  axe: <><path d="M8 28 21 7" /><path className="f" d="M17 7c3-5 10-5 12-2-1 6-1 11-6 14l-3-2c2-3 2-6-3-10Z" /></>,
  bow: <><path className="f" d="M9 4c12 1 18 11 15 24C17 22 11 16 9 4Z" /><path d="M9 4 24 28M5 28 28 5M28 5l-1 5M28 5l-5 1" /></>,
  staff: <><path d="M7 29 22 10" /><circle className="f" cx="24" cy="8" r="4.5" /><path d="M20 4l-2-2M28 12l2 2M28 4l2-2M20 12l-2 2" /></>,
  dagger: <><path className="f" d="M16 18 25 7l3 3-11 9Z" /><path d="M11 16l7 7M15 20 7 28" /></>,
  mace: <><path d="M8 28 19 17" /><path className="f" d="M17 5l10 10-5 5-10-10Z" /><path d="M20 8l4 4M16 12l4 4" /></>,
  spear: <><path d="M5 28 23 10" /><path className="f" d="M22 4l7 3 3 7-6-3Z" /></>,
  shield: <><path className="f" d="M16 3.5 26 7v9c0 6-4 10-10 12.5C10 26 6 22 6 16V7Z" /><path d="M16 8v18M9 14h14" /><circle cx="16" cy="14" r="2.5" /></>,
  helm: <><path className="f" d="M6 20v-6a10 10 0 0 1 20 0v6l-3 5h-4v-6h-6v6H9Z" /><path d="M10 15h12M16 4v8" /></>,
  tunic: <><path className="f" d="m11 5-6 4 3 6 3-1v14h12V14l3 1 3-6-6-4c-1 2-3 3-5 3s-4-1-5-3Z" /><path d="M16 8v18M12 20h8" /></>,
  potion: <><path className="f" d="M14 11 8 21a5 5 0 0 0 4.5 8h7a5 5 0 0 0 4.5-8L18 11Z" /><path d="M13 4h6M14 4v7M18 4v7M10 20h12" /><circle cx="14" cy="24" r="1" /><circle cx="19" cy="22" r="1.2" /></>,
  scroll: <><path className="f" d="M9 6h15v18a3 3 0 0 1-3 3H8a3 3 0 0 0 3-3V8a2 2 0 0 0-2-2Z" /><path d="M13 11h8M13 15h8M13 19h5" /><path d="M9 6a2 2 0 0 0-2 2v2h4" /></>,
  book: <><path className="f" d="M5 6h8a3 3 0 0 1 3 2 3 3 0 0 1 3-2h8v19h-8a3 3 0 0 0-3 2 3 3 0 0 0-3-2H5Z" /><path d="M16 8v19M8 11h5M19 11h5" /></>,
  key: <><circle className="f" cx="10" cy="10" r="5.5" /><circle cx="10" cy="10" r="1.6" /><path d="M14 14l13 13M22 22l3-3M18 18l3-3" /></>,
  torch: <><path d="M12 29 17 14" /><path className="f" d="M14 13c-3-3 0-6 1-10 4 3 7 6 4 10Z" /><path d="M13 14h6" /></>,
  pouch: <><path className="f" d="M11 9c-3 4-6 8-6 13a5 5 0 0 0 5 5h12a5 5 0 0 0 5-5c0-5-3-9-6-13Z" /><path d="M11 9h10M12 4l4 5 4-5" /><circle cx="16" cy="20" r="3" /></>,
  gem: <><path className="f" d="M16 4 27 16 16 28 5 16Z" /><path d="M5 16h22M16 4l-4 12 4 12 4-12Z" /></>,
}

const BY_NAME = [
  ['shield', /escudo/],
  ['helm', /elmo|capacete/],
  ['axe', /machad|alabarda/],
  ['bow', /\b(arco|arcos|besta|bodoque|funda)\b/],
  ['staff', /cajado|bordao|varinha|cetro|orbe/],
  ['dagger', /adaga|punhal|faca|estilete/],
  ['mace', /martelo|maca\b|clava|bastao|mangual|marreta|porrete/],
  ['spear', /lanca|tridente|pique|azagaia|dardo/],
  ['sword', /espada|sabre|cimitarra|rapieira|montante|florete|gladio/],
  ['potion', /pocao|elixir|frasco|tonico|antidoto|veneno|oleo|essencia/],
  ['scroll', /pergaminho|mapa|carta|bilhete|receita/],
  ['book', /livro|grimorio|diario|tomo|caderno/],
  ['key', /chave|gazua/],
  ['torch', /tocha|lanterna|vela|lampiao/],
  ['pouch', /bolsa|saco|sacola|moeda|mochila|cinto/],
  ['gem', /gema|joia|anel|amuleto|cristal|rubi|safira|esmeralda|diamante|pingente|colar/],
]

export function iconKey(item) {
  const name = fold(item.name)
  const hit = BY_NAME.find(([, re]) => re.test(name))
  if (hit) return hit[0]
  if (item.kind === 'WEAPON') return item.properties?.includes('AMMUNITION') ? 'bow' : 'sword'
  if (item.kind === 'ARMOR') return item.armorWeight === 'HEAVY' ? 'helm' : 'tunic'
  if (item.kind === 'CONSUMABLE') return 'potion'
  return 'gem'
}

export default function ItemIcon({ item }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true">{DRAWINGS[iconKey(item)]}</svg>
}
