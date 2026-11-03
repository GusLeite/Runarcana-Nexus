// Cor de cada jogador nas trajetórias do mapa: sempre a mesma para o mesmo nome, dentre uma paleta que se distingue sobre o relevo.
export const ROUTE_COLORS = [0x4fd1c5, 0xc79bff, 0xff8d7a, 0x8be08b, 0x7aa8ff, 0xff9ad5, 0xf7dc6a, 0xffa35c]

export function routeColor(owner) {
  let hash = 0
  for (const ch of owner ?? '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return ROUTE_COLORS[hash % ROUTE_COLORS.length]
}

// A mesma cor em CSS (#rrggbb), para os botões da lista.
export const cssColor = color => '#' + color.toString(16).padStart(6, '0')
