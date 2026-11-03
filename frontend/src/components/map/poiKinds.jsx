export const POI_KINDS = {
  CITY: 'Cidade',
  LANDMARK: 'Marco',
  QUEST: 'Missão',
  DANGER: 'Perigo',
  MYSTERY: 'Mistério',
  OUTPOST: 'Posto avançado',
  HIDEOUT: 'Esconderijo',
  RUIN: 'Ruína',
  CAMP: 'Acampamento',
  DUNGEON: 'Masmorra',
  PORT: 'Porto',
}

const GLYPHS = {
  CITY: <path d="M5 20v-8l4-3 3 2V6l4-3 4 3v14Z" />,
  LANDMARK: <path d="M12 3 21 20H3Z" />,
  QUEST: <path d="M12 3a5 5 0 0 1 3 9c-2 1-2 2-2 4h-2c0-3 1-4 3-5a3 3 0 1 0-5-2H7a5 5 0 0 1 5-6Zm-1 15h2v3h-2Z" />,
  DANGER: <path d="M12 3c5 0 8 3 8 8 0 3-1 5-3 6v3h-3v-2h-1v2h-2v-2h-1v2H7v-3c-2-1-3-3-3-6 0-5 3-8 8-8ZM8.5 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />,
  MYSTERY: <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z" />,
  OUTPOST: <path d="M6 21V4h2v1h11l-3 4 3 4H8v8Z" />,
  HIDEOUT: <path d="M12 3 3 12h3v8h12v-8h3Zm0 6a2 2 0 0 1 2 2v2h-4v-2a2 2 0 0 1 2-2Z" />,
  RUIN: <path d="M4 21v-9h3v-2h3v2h4v-2h3v2h3v9h-3v-5h-3v5H10v-5H7v5Z" />,
  CAMP: <path d="M12 4 2 20h20Zm0 7 4 7h-8Z" />,
  DUNGEON: <path d="M5 21V10a7 7 0 0 1 14 0v11h-4v-6a3 3 0 0 0-6 0v6Z" />,
  PORT: <path d="M11 2h2v3.1A3 3 0 0 1 14.9 8H17v2h-2.1l.1 7a6 6 0 0 0 4-4l2 .4a8 8 0 0 1-6.9 6.2V22h-2v-2.4A8 8 0 0 1 5 13.4l2-.4a6 6 0 0 0 4 4l.1-7H9V8h2.1A3 3 0 0 1 11 5.1Zm1 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />,
}

export function PoiGlyph({ kind }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{GLYPHS[kind]}</svg>
}
