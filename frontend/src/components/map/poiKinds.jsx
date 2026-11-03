export const POI_KINDS = {
  CITY: 'Cidade',
  LANDMARK: 'Marco',
  QUEST: 'Missão',
  DANGER: 'Perigo',
  MYSTERY: 'Mistério',
}

const GLYPHS = {
  CITY: <path d="M5 20v-8l4-3 3 2V6l4-3 4 3v14Z" />,
  LANDMARK: <path d="M12 3 21 20H3Z" />,
  QUEST: <path d="M12 3a5 5 0 0 1 3 9c-2 1-2 2-2 4h-2c0-3 1-4 3-5a3 3 0 1 0-5-2H7a5 5 0 0 1 5-6Zm-1 15h2v3h-2Z" />,
  DANGER: <path d="M12 3c5 0 8 3 8 8 0 3-1 5-3 6v3h-3v-2h-1v2h-2v-2h-1v2H7v-3c-2-1-3-3-3-6 0-5 3-8 8-8ZM8.5 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />,
  MYSTERY: <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z" />,
}

export function PoiGlyph({ kind }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{GLYPHS[kind]}</svg>
}
