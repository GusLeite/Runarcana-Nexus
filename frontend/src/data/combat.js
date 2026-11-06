import { CHARACTERS } from './characters.js'
import { placeholderArt } from '../utils/placeholderArt.js'

// Regras e formatação do combate usadas pelas telas do mestre e do jogador.

const hash = text => [...(text ?? '')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)

// Retrato de quem está no confronto: a imagem do inimigo, a arte do personagem ou um placeholder pela cor do nome.
// Cópias numeradas ("Lobo 2") ganham a mesma cor da ficha.
// bg: valor pronto para background-image, com o placeholder numa segunda camada: se o link da imagem quebrar,
// o retrato gerado aparece por baixo em vez de um círculo vazio.
export function portraitOf(c) {
  const base = (c.name ?? '').replace(/\s+\d+$/, '')
  const h = hash(base)
  const hue = (c.kind === 'PLAYER' ? 150 + (h % 90) : (h % 50) + 340) % 360
  const fallback = placeholderArt(hue, h % 5)
  const layer = (img, pos, artHue) => ({ img, pos, hue: artHue, bg: `url("${img}"), url("${fallback}")` })
  if (c.image) return layer(c.image, '50% 30%', hue)
  if (c.kind === 'PLAYER') {
    const art = CHARACTERS.find(a => a.id === (c.name ?? '').trim().toLowerCase())
    if (art) return layer(art.img, art.pos, art.hue)
  }
  return layer(fallback, '50% 30%', hue)
}

// Cor do estado de saúde (o mesmo texto que o back manda para os jogadores).
export const HEALTH_TONE = {
  Ileso: 'ok',
  Ferido: 'hurt',
  Sangrando: 'bleed',
  'À beira da morte': 'dying',
  Derrotado: 'dead',
  Caído: 'dead',
}

export const mod = score => Math.floor(((score ?? 10) - 10) / 2)
export const signed = n => (n >= 0 ? '+' : '−') + Math.abs(n)

// Quem vem depois de "current" na ordem, pulando derrotados (o mesmo do back).
export function nextUp(order, currentId) {
  const alive = order.filter(c => !c.defeated)
  if (!alive.length) return null
  if (currentId == null) return alive[0]
  const at = order.findIndex(c => c.id === currentId)
  for (let i = 1; i <= order.length; i++) {
    const c = order[(at + i) % order.length]
    if (!c.defeated) return c
  }
  return null
}

// Dano gasta os PV temporários antes; cura não passa do máximo. Devolve { currentHp, tempHp }.
export function applyHp({ currentHp, maxHp, tempHp = 0 }, kind, amount) {
  const n = Math.max(0, Math.floor(amount) || 0)
  if (kind === 'heal') return { currentHp: Math.min(maxHp, currentHp + n), tempHp }
  const fromTemp = Math.min(tempHp, n)
  return { currentHp: Math.max(0, currentHp - (n - fromTemp)), tempHp: tempHp - fromTemp }
}

// Linhas do texto de ataques ("Mordida +4, 2d4+2"): cada linha vira um item; acha um bônus de ataque e uma
// expressão de dano para os botões de rolar.
export function parseAttacks(text) {
  return (text ?? '').split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const dice = line.match(/\b(\d{1,2})\s*d\s*(\d{1,3})(\s*[+-]\s*\d{1,3})?/i)
    const hit = line.replace(dice?.[0] ?? '', '').match(/(?:^|[\s(])([+-]\d{1,2})(?![\dd])/i)
    return {
      line,
      hit: hit ? Number(hit[1]) : null,
      damage: dice ? dice[0].replace(/\s+/g, '') : null,
    }
  })
}

// Duração do confronto em minutos de mesa (rodada = 6 s no livro).
export function gameTime(round) {
  const s = Math.max(1, round) * 6
  return s < 60 ? s + ' s' : (s / 60).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' min'
}
