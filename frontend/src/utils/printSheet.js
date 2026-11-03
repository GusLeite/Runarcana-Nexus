// Ficha física: monta o PDF de impressão da mesa ("Planilha Dupla 0.93") com os dados da ficha do site. O fundo são
// as duas páginas do PDF original em PNG a 300 dpi (public/ficha-fisica/frente.png e verso.png; o original vem
// cifrado e o pdf-lib não abre). As posições estão em pontos do PDF (842 × 595, A4 deitado) contadas a partir do
// topo, como no desenho; `y()` converte para a origem embaixo do pdf-lib. O pdf-lib só carrega ao gerar.
import {
  ALIGNMENT_NAMES, ARMOR_NAMES, CLASS_NAMES, DAMAGE_TYPES, MOVEMENT_NAMES, RECHARGES, REGION_NAMES, SIZE_NAMES,
  formatFeet, formatModifier, senseLabel,
} from '../data/rules.js'

export const TEMPLATE_URLS = ['/ficha-fisica/frente.png', '/ficha-fisica/verso.png']
const MANA = 'Pontos de Mana'
const W = 842.16
const H = 595.44
const y = top => H - top

// Perícias na ordem do PDF (alfabética, como a planilha imprime).
const SKILL_ROWS = ['ACROBATICS', 'ARCANA', 'ATHLETICS', 'PERFORMANCE', 'DECEPTION', 'STEALTH', 'HISTORY', 'INTIMIDATION',
  'INSIGHT', 'INVESTIGATION', 'ANIMAL_HANDLING', 'MEDICINE', 'NATURE', 'PERCEPTION', 'PERSUASION', 'SLEIGHT_OF_HAND',
  'RELIGION', 'SURVIVAL', 'TECHNOLOGY']
// Salvaguardas: coluna esquerda (FOR, DES, CON) e direita (INT, SAB, CAR).
const SAVE_ROWS = [
  ['STRENGTH', 528, 113.7], ['DEXTERITY', 528, 123.5], ['CONSTITUTION', 528, 133.5],
  ['INTELLIGENCE', 591, 114.5], ['WISDOM', 591, 124.5], ['CHARISMA', 591, 134.3],
]
const ATTR_ROWS = [['str', 119.3], ['dex', 155.3], ['con', 191.3], ['intel', 227.3], ['wis', 263.3], ['cha', 299.3]]
const RUNES = [['Pulso Rúnico', 350.7], ['Fagulha Rúnica', 372.7], ['Fluxo Rúnico', 395.3], ['Vórtice Rúnico', 417.3], ['Explosão Rúnica', 440.7]]

const signed = n => formatModifier(n).replace('−', '-')
const list = items => (items ?? []).filter(Boolean).join(', ')

// Classe e nível: "Mercurial 5" ou, na multiclasse, "Bruto 3 / Arcanista 2"; a subclasse vai junto quando cabe.
export function classLine(sheet) {
  const levels = sheet.classLevels ?? []
  if (levels.length > 1) return levels.map(l => l.name + ' ' + l.level).join(' / ')
  const name = CLASS_NAMES[sheet.characterClass] ?? sheet.characterClass ?? ''
  return (name + ' ' + sheet.level + (sheet.subclass ? ' · ' + sheet.subclass : '')).trim()
}

// Seções do verso (Informações Importantes): o que a ficha do site mostra em chips no herói.
export function importantInfo(sheet) {
  const out = []
  const add = (title, text) => text && out.push({ title, text })
  add('Tamanho', SIZE_NAMES[sheet.size] ?? sheet.size)
  add('Deslocamento', list((sheet.speeds ?? []).map(s => MOVEMENT_NAMES[s.type] + ' ' + formatFeet(s.feet))))
  add('Sentidos', list(Object.entries(sheet.senses ?? {}).map(([k, ft]) => senseLabel(k, ft))))
  add('Resistências', list(sheet.resistances))
  add('Redução de dano', list(Object.entries(sheet.typedReductions ?? {}).map(([t, v]) => 'RD ' + v + ': ' + t)))
  add('Vulnerabilidades', list(sheet.vulnerabilities))
  add('Imunidades', list([...(sheet.immunities ?? []), ...(sheet.conditionImmunities ?? [])]))
  add('Absorções', list(sheet.absorptions))
  add('Condições', list(sheet.conditions))
  add('Forma ativa', [sheet.activeForm, ...(sheet.activeEffects ?? [])].filter(Boolean).join(', '))
  add('Ouro', sheet.gold + ' PO')
  ;(sheet.situational ?? []).forEach(n => add(n.source || 'Nota', n.note))
  return out
}

// Verso (Informações Adicionais): habilidades e heranças só com o título (e usos/dano); passivas, formas e magias
// com o texto de cada uma.
export function additionalInfo(sheet, abilities, extraSpells = []) {
  const entry = (a, withText = true) => {
    const uses = a.maxUses ? a.maxUses + (a.maxUses === 1 ? ' uso' : ' usos') + (a.recharge && RECHARGES[a.recharge] ? ' / ' + RECHARGES[a.recharge].toLowerCase() : '') : ''
    return { title: a.name, sub: [uses, a.damage].filter(Boolean).join(' · '), text: withText ? a.description ?? '' : '' }
  }
  const titleOnly = a => entry(a, false)
  const sections = []
  const push = (title, items) => items.length && sections.push({ title, items })
  push('Habilidades', abilities.filter(a => a.type === 'ABILITY' && a.name !== MANA).map(titleOnly))
  push('Passivas', abilities.filter(a => a.type === 'PASSIVE').map(a => entry(a)))
  push('Heranças', abilities.filter(a => a.type === 'HERITAGE').map(titleOnly))
  push('Formas', (sheet.forms ?? []).map(f => ({ title: f.name, sub: '', text: f.description ?? '' })))
  push('Magias (continuação)', extraSpells.map(entry))
  return sections
}

// Magias da frente: truques e círculos em ordem; as que não cabem nas 20 linhas vão para o verso.
export function spellRows(abilities) {
  return abilities.filter(a => a.type === 'SPELL')
    .sort((a, b) => (a.spellLevel ?? 0) - (b.spellLevel ?? 0) || a.name.localeCompare(b.name))
}

// Gera o PDF preenchido. pages: bytes PNG da frente e do verso; portrait: bytes de um PNG/JPEG (ou null).
export async function buildPrintSheet({ pages, sheet: full, abilities = full.abilities ?? [], portrait = null, portraitType = 'png' }) {
  const { PDFDocument, StandardFonts, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  doc.setTitle('Ficha de ' + (full.character.characterName ?? ''))
  const [front, back] = await Promise.all(pages.map(async bytes => {
    const page = doc.addPage([W, H])
    page.drawImage(await doc.embedPng(bytes), { x: 0, y: 0, width: W, height: H })
    return page
  }))
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.1, 0.12, 0.15)
  const faded = rgb(0.45, 0.47, 0.5)
  const sheet = full.character

  // Só caracteres que a fonte padrão (WinAnsi) desenha; o resto vira o equivalente simples ou some.
  const charset = new Set(font.getCharacterSet())
  const clean = text => String(text ?? '').replace(/[−‐‑]/g, '-').replace(/\s+/g, ' ')
    .split('').filter(ch => charset.has(ch.codePointAt(0))).join('').trim()

  // Texto numa linha: encolhe até caber em `width` (mín. 5 pt) e corta com reticências se ainda sobrar.
  const fit = (f, text, size, width) => {
    let s = size
    while (s > 5 && f.widthOfTextAtSize(text, s) > width) s -= 0.25
    let t = text
    if (f.widthOfTextAtSize(t, s) > width) {
      while (t.length > 1 && f.widthOfTextAtSize(t + '…', s) > width) t = t.slice(0, -1)
      t += '…'
    }
    return { t, s }
  }
  const text = (page, value, x, top, { size = 9, width = 200, align = 'left', f = font, color = ink } = {}) => {
    const str = clean(value)
    if (!str) return
    const { t, s } = fit(f, str, size, width)
    const w = f.widthOfTextAtSize(t, s)
    const dx = align === 'center' ? -w / 2 : align === 'right' ? -w : 0
    page.drawText(t, { x: x + dx, y: y(top), size: s, font: f, color })
  }
  // Centro vertical: `top` é o centro da caixa; desloca pela altura das maiúsculas.
  const centered = (page, value, cx, cy, size, width, f = bold) => text(page, value, cx, cy + size * 0.36, { size, width, align: 'center', f })

  // Quebra em linhas que caibam em `width`.
  const wrap = (f, value, size, width) => {
    const words = clean(value).split(' ').filter(Boolean)
    const lines = []
    let line = ''
    for (const word of words) {
      const next = line ? line + ' ' + word : word
      if (f.widthOfTextAtSize(next, size) <= width) line = next
      else {
        if (line) lines.push(line)
        line = word
        while (f.widthOfTextAtSize(line, size) > width && line.length > 1) {
          let cut = line.length - 1
          while (cut > 1 && f.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--
          lines.push(line.slice(0, cut))
          line = line.slice(cut)
        }
      }
    }
    if (line) lines.push(line)
    return lines
  }

  // Caixa com blocos "Título: texto" que diminui a letra até tudo caber (mín. 5 pt; depois corta).
  const box = (page, blocks, { x, top, width, height, size = 8, inline = true }) => {
    const items = blocks.filter(b => b?.text)
    if (!items.length) return
    let s = size
    const layout = sz => items.flatMap(b => {
      const lines = inline && b.title ? wrap(font, b.title + ': ' + b.text, sz, width) : wrap(font, b.text, sz, width)
      return lines.map((l, i) => ({ l, i, b }))
    })
    let lines = layout(s)
    while (s > 5 && lines.length * s * 1.2 > height) { s -= 0.25; lines = layout(s) }
    const max = Math.floor(height / (s * 1.2))
    lines.slice(0, max).forEach(({ l, i, b }, n) => {
      const ty = top + s + n * s * 1.2
      if (inline && b.title && i === 0 && l.startsWith(clean(b.title) + ':')) {
        const head = clean(b.title) + ':'
        page.drawText(head, { x, y: y(ty), size: s, font: bold, color: ink })
        page.drawText(l.slice(head.length), { x: x + bold.widthOfTextAtSize(head, s), y: y(ty), size: s, font, color: ink })
      } else page.drawText(l, { x, y: y(ty), size: s, font, color: ink })
    })
  }

  // Marca (hexágono cheio) nos hexágonos de proficiência, testes contra a morte e exaustão. cy a partir do topo.
  const mark = (page, cx, cy, r = 2.3) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 6 + (i * Math.PI) / 3
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    })
    const d = 'M' + pts.map(([px, py]) => px.toFixed(2) + ' ' + py.toFixed(2)).join(' L') + ' Z'
    page.drawSvgPath(d, { x: 0, y: H, color: ink, borderWidth: 0 })
  }

  // ---------- frente ----------
  const p = front
  // Cabeçalho (valor acima da linha de cada rótulo).
  const HEAD = 69
  text(p, sheet.playerName, 93, HEAD, { size: 10, width: 95, align: 'center', f: bold })
  text(p, sheet.characterName, 205, HEAD, { size: 10, width: 95, align: 'center', f: bold })
  text(p, sheet.origin && (sheet.lineage ? sheet.origin + ' (' + sheet.lineage + ')' : sheet.origin), 317, HEAD, { size: 10, width: 95, align: 'center', f: bold })
  text(p, REGION_NAMES[sheet.region] ?? sheet.region, 429, HEAD, { size: 10, width: 95, align: 'center', f: bold })
  text(p, sheet.background, 539, HEAD, { size: 10, width: 95, align: 'center', f: bold })
  text(p, ALIGNMENT_NAMES[sheet.alignment] ?? sheet.alignment, 651, HEAD, { size: 10, width: 95, align: 'center', f: bold })
  text(p, classLine(sheet), 763, HEAD, { size: 10, width: 95, align: 'center', f: bold })

  // Perícias: bônus na linha; 1º hexágono = proficiente, os dois = especialidade.
  const skills = Object.fromEntries((sheet.skills ?? []).map(s => [s.skill, s]))
  SKILL_ROWS.forEach((id, i) => {
    const row = 102.3 + i * 10.86
    const s = skills[id]
    if (!s) return
    text(p, signed(s.modifier), 65.5, row + 2.8, { size: 7.5, width: 14, align: 'center', f: bold })
    if (s.proficient || s.expertise) mark(p, 47.2, row - 2.8)
    if (s.expertise) mark(p, 53.3, row + 0.7)
  })

  // Coluna do personagem.
  centered(p, signed(sheet.proficiencyBonus), 166, 137, 15, 30)
  centered(p, sheet.inspiration || '', 232.7, 135, 15, 30)
  centered(p, sheet.gold, 170.7, 236.7, 9, 18)
  const ac = full.armorClass
  if (ac) {
    centered(p, ac.value, 233.3, 197, 15, 26)
    const shield = ac.shields?.find(s => s.key === ac.shield)
    if (shield) centered(p, '+' + shield.bonus, 206, 200, 8, 12)
  }
  centered(p, signed(sheet.initiative), 210, 249, 14, 28)
  const walk = sheet.speeds?.find(s => s.type === 'WALK')?.feet ?? sheet.speed
  if (walk != null) {
    centered(p, String(walk).replace('.', ','), 252.7, 246.5, 13, 26)
    text(p, 'pés', 252.7, 257, { size: 6, width: 26, align: 'center' })
  }
  centered(p, sheet.passivePerception, 159, 295.7, 12, 24)
  centered(p, sheet.passiveInsight, 220.7, 295.7, 12, 24)

  // Atributos: modificador no hexágono grande, valor no pequeno.
  ATTR_ROWS.forEach(([key, row]) => {
    const score = sheet[key]
    centered(p, signed(Math.floor((score - 10) / 2)), 317.3, row, 14, 26)
    centered(p, score, 291.7, row, 8.5, 14)
  })

  // Retrato no quadro grande, preenchendo sem distorcer (corta as sobras).
  if (portrait) {
    try {
      const img = portraitType === 'jpg' ? await doc.embedJpg(portrait) : await doc.embedPng(portrait)
      const bx = 345, bt = 104, bw = 163, bh = 199
      const k = Math.max(bw / img.width, bh / img.height)
      const w = img.width * k, h = img.height * k
      // Corta mais embaixo que em cima: o rosto costuma ficar no alto da arte.
      const off = (h - bh) * 0.2
      p.pushOperators(pushGraphicsState(), rectangle(bx, y(bt + bh), bw, bh), clip(), endPath())
      p.drawImage(img, { x: bx + (bw - w) / 2, y: y(bt - off + h), width: w, height: h })
      p.pushOperators(popGraphicsState())
    } catch {
      // Arte que o pdf-lib não lê: a ficha sai sem retrato.
    }
  }

  // Salvaguardas.
  const saves = new Set(sheet.savingThrows ?? [])
  const expertSaves = new Set(sheet.savingThrowExpertise ?? [])
  SAVE_ROWS.forEach(([attr, x, row], i) => {
    const key = ATTR_ROWS[['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'].indexOf(attr)][0]
    const prof = saves.has(attr) ? sheet.proficiencyBonus * (expertSaves.has(attr) ? 2 : 1) : 0
    text(p, signed(Math.floor((sheet[key] - 10) / 2) + prof), x + 6.5, row + 2.5, { size: 7.5, width: 13, align: 'center', f: bold })
    const hx = i < 3 ? 519.7 : 582.5
    if (saves.has(attr)) mark(p, hx, row - 2.9)
    if (expertSaves.has(attr)) mark(p, hx + 4.1, row - 0.9)
  })
  ;[581.7, 590, 598.3].forEach((x, i) => {
    if (i < sheet.deathSuccesses) mark(p, x, 159.3, 2.6)
    if (i < sheet.deathFailures) mark(p, x, 169, 2.6)
  })
  ;[558.3, 566.2, 574, 581.8, 589.7, 597.5].forEach((x, i) => { if (i < Math.min(6, sheet.exhaustion)) mark(p, x, 190.7, 2.6) })

  // Pontos de vida e dados de vida.
  centered(p, sheet.currentHp, 536, 270, 14, 26)
  centered(p, sheet.maxHp, 574, 268, 16, 30)
  if (sheet.tempHp) centered(p, sheet.tempHp, 612.7, 270, 14, 26)
  // No canto direito da linha: o hexágono do máximo desce até perto dela no meio.
  text(p, sheet.level + 'd' + sheet.hitDie, 626, 299, { size: 9, width: 30, align: 'right', f: bold })

  // Ataques: 8 linhas.
  ;(full.attacks ?? []).slice(0, 8).forEach((a, i) => {
    const row = 347.7 + i * 12.33 - 1.5
    const type = DAMAGE_TYPES[a.damageType]
    text(p, a.name, 50, row, { size: 7.5, width: 62 })
    text(p, signed(a.attackBonus), 130.6, row, { size: 7.5, width: 28, align: 'center', f: bold })
    text(p, [a.damage, a.versatileDamage && '(' + a.versatileDamage + ' 2 mãos)', type].filter(Boolean).join(' '), 150.5, row, { size: 7.5, width: 95 })
  })

  // Pertences: o inventário dividido nas duas caixas.
  const items = (full.inventory ?? []).map(it => ({ text: (it.quantity > 1 ? it.quantity + 'x ' : '') + it.name }))
  const half = Math.ceil(items.length / 2)
  box(p, items.slice(0, half), { x: 55, top: 452, width: 86, height: 92, size: 7.5 })
  box(p, items.slice(half), { x: 157, top: 452, width: 86, height: 92, size: 7.5 })

  // Magias: 10 linhas em cada coluna; o círculo vai no hexágono ("T" = truque). Não preparadas saem apagadas.
  const spells = spellRows(abilities)
  const shown = spells.length > 20 ? spells.slice(0, 19) : spells
  shown.forEach((s, i) => {
    const col = i < 10 ? 0 : 1
    const line = [349, 361.3, 373.3, 385.7, 397.7, 409.7, 422, 434, 446, 458.7][i % 10]
    const hx = col ? 356.7 : 265
    const lx = col ? 362.5 : 271
    centered(p, s.spellLevel ? s.spellLevel : 'T', hx, line - 4.3, 5.5, 7)
    text(p, s.name, lx, line - 1.3, { size: 7, width: 73, color: s.prepared === false ? faded : ink })
  })
  if (spells.length > 20) text(p, '+' + (spells.length - 19) + ' no verso', 362.5, 457.4, { size: 7, width: 73, f: bold })
  const mana = abilities.find(a => a.name === MANA)
  const caster = full.spellcasting?.casters?.[0]
  if (mana) text(p, mana.maxUses, 309, 466.5, { size: 7.5, width: 15, align: 'center', f: bold })
  if (caster) {
    text(p, caster.saveDc, 364, 466.5, { size: 7.5, width: 13, align: 'center', f: bold })
    text(p, signed(caster.attackBonus), 429, 466.5, { size: 7.5, width: 14, align: 'center', f: bold })
  }

  // Runas: só se a ficha tiver a habilidade com o nome da runa.
  RUNES.forEach(([name, row]) => {
    const rune = abilities.find(a => a.name.toLowerCase().startsWith(name.toLowerCase()))
    if (rune) text(p, [rune.damage, rune.maxUses ? rune.maxUses + ' usos' : ''].filter(Boolean).join(' · ') || rune.name, 564.5, row + 2.8, { size: 8, width: 115, align: 'center' })
  })

  // Caixas de baixo.
  const crafts = (full.crafts ?? []).map(c => c.name + (c.level ? ' ' + c.level : '') + (c.bonus != null ? ' (' + signed(c.bonus) + ')' : ''))
  box(p, [
    { title: 'Idiomas', text: list(sheet.languages) },
    { title: 'Ofícios', text: list(crafts.length ? crafts : sheet.crafts) },
  ], { x: 265, top: 488, width: 108, height: 56, size: 7.5 })
  box(p, [
    { title: 'Armaduras', text: list((sheet.armorProficiencies ?? []).map(a => ARMOR_NAMES[a] ?? a)) },
    { title: 'Armas', text: list(sheet.weaponProficiencies) },
  ], { x: 391, top: 488, width: 108, height: 56, size: 7.5 })
  const heritages = [...new Set([...(sheet.heritages ?? []), ...abilities.filter(a => a.type === 'HERITAGE').map(a => a.name)])]
  box(p, heritages.map(h => ({ text: h })), { x: 517, top: 488, width: 108, height: 56, size: 7.5 })

  // ---------- verso ----------
  const b = back
  text(b, sheet.characterName, 92, HEAD, { size: 10, width: 95, align: 'center', f: bold })
  if (sheet.age) text(b, sheet.age + ' anos', 314.7, HEAD, { size: 10, width: 95, align: 'center', f: bold })
  if (sheet.height) text(b, sheet.height.toLocaleString('pt-BR') + ' m', 426.7, HEAD, { size: 10, width: 95, align: 'center', f: bold })

  box(b, importantInfo(sheet), { x: 49, top: 106, width: 152, height: 436, size: 8 })

  // Informações adicionais: as seções correm pelas três colunas.
  const columns = [[226, 172], [412, 200], [626, 174]]
  const extra = spells.length > 20 ? spells.slice(19) : []
  const sections = additionalInfo(sheet, abilities, extra)
  const flow = sz => {
    const out = []
    sections.forEach(sec => {
      out.push({ kind: 'section', l: sec.title.toUpperCase(), h: sz * 1.6 })
      sec.items.forEach(it => {
        out.push({ kind: 'title', l: it.title + (it.sub ? ' (' + it.sub + ')' : ''), h: sz * 1.25 })
        if (it.text) {
          out.push({ kind: 'body', text: it.text, h: 0 })
          out.push({ kind: 'gap', h: sz * 0.5 })
        }
      })
    })
    return out
  }
  // Tenta tamanhos de letra do maior ao menor até tudo caber nas três colunas.
  let size = 7.5
  let placed = null
  for (; size >= 5; size -= 0.25) {
    const lineH = (size - 0.5) * 1.18
    const out = []
    let col = 0
    let cursor = 0
    const height = 410
    let ok = true
    const place = (kind, l, h) => {
      if (cursor + h > height) { col++; cursor = 0 }
      if (col > 2) { ok = false; return }
      out.push({ kind, l, col, top: 118 + cursor })
      cursor += h
    }
    for (const it of flow(size)) {
      if (it.kind === 'body') {
        wrap(font, it.text, size - 0.5, columns[Math.min(col, 2)][1]).forEach(l => place('body', l, lineH))
      } else if (it.kind === 'gap') cursor += it.h
      else place(it.kind, it.l, it.h)
      if (!ok) break
    }
    placed = out
    if (ok) break
  }
  ;(placed ?? []).filter(it => it.col <= 2).forEach(it => {
    const [x, width] = columns[it.col]
    if (it.kind === 'section') text(b, it.l, x, it.top + size, { size: size + 0.5, width, f: bold })
    else if (it.kind === 'title') text(b, it.l, x, it.top + size, { size, width, f: bold })
    else text(b, it.l, x, it.top + size - 0.5, { size: size - 0.5, width })
  })

  return doc.save()
}

// Desenha a arte (qualquer formato que o navegador abre, inclusive SVG e webp) num PNG para o pdf-lib.
async function rasterize(src) {
  if (!src) return null
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  await img.decode()
  const scale = Math.min(1, 900 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round((img.naturalWidth || 600) * scale)
  canvas.height = Math.round((img.naturalHeight || 800) * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  return new Uint8Array(await blob.arrayBuffer())
}

// Botão da ficha: busca o modelo, gera e baixa "<nome> - ficha.pdf".
export async function downloadPrintSheet({ sheet, abilities, portraitSrc }) {
  const pages = await Promise.all(TEMPLATE_URLS.map(async url => {
    const res = await fetch(url)
    if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) throw new Error('Não achei o modelo da ficha física no servidor.')
    return new Uint8Array(await res.arrayBuffer())
  }))
  let portrait = null
  try { portrait = await rasterize(portraitSrc) } catch { portrait = null }
  const bytes = await buildPrintSheet({ pages, sheet, abilities, portrait, portraitType: 'jpg' })
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = (sheet.character.characterName || 'personagem') + ' - ficha.pdf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
