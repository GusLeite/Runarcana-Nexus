import { MAP_LANDMARKS } from './landmarkData.js'

// Quando cada ponto aparece, como no mapa original: marcos (os de modelo 3D) já de perto, cidades um pouco mais perto
// e vilarejos e lugares menores só bem de perto. Vale para os lugares do mapa oficial; os pontos do mestre aparecem de perto.
// Os números são o mínimo de aproximação (zoomProgress) para o ponto surgir.
const MAJOR = new Set(MAP_LANDMARKS.map(landmark => landmark.slug))
export const POI_LEVELS = { major: 0.32, city: 0.4, minor: 0.75 }

export function poiLevel(poi) {
  if (!poi.official) return 'near'
  if (MAJOR.has(poi.officialKey)) return POI_LEVELS.major
  return poi.kind === 'CITY' ? POI_LEVELS.city : POI_LEVELS.minor
}
