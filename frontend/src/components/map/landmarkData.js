// Marcos em 3D do mapa de Runeterra, com as posições e os ajustes do original (pins-pt_br.json do site).
// Cada marco é um grupo no ponto (x, y, z) do mundo; cada modelo dentro dele tem escala, giro (rotY), deslocamento
// (offsetX/Y/Z, no sistema do modelo) e, se gira sozinho, rotationSpeed (radianos por quadro a 60 quadros por segundo).
// Os arquivos ficam em public/map/landmarks/ (baixados por scripts/fetch-map-assets.sh).
export const MAP_LANDMARKS = [
  {
    slug: 'sun-disc', name: 'O Disco Solar', x: 3, y: -416, z: 8.470588235294118,
    models: [{ obj: 'sun-disc.obj', texture: 'sun-disc.jpg', scale: 9, rotY: 0, offset: [4, 20, 5] }],
  },
  {
    slug: 'immortal-bastion', name: 'O Bastião Imortal', x: -5, y: 110, z: 6.117647058823529,
    models: [{ obj: 'immortal-bastion.obj', texture: 'immortal-bastion.jpg', scale: 10, rotY: 0, offset: [7, 15, 7] }],
  },
  {
    slug: 'ixaocan', name: 'Ixaocan', x: 333, y: -382, z: 6.352941176470588,
    models: [
      { obj: 'ixaocan_ground.obj', texture: 'ixaocan_shadow.png', scale: 6, rotY: -0.785398, offset: [0, 15, 4.25] },
      { obj: 'ixaocan.obj', texture: 'ixaocan.png', scale: 6, rotY: -0.785398, offset: [0, 15, 4.25] },
      { obj: 'ixaocan_orbs.obj', texture: 'ixaocan.png', scale: 6, rotY: -0.785398, offset: [0, 15, 4.25], spin: { y: 0.001 } },
    ],
  },
  {
    slug: 'mount-targon', name: 'Monte Targon', x: -201, y: -424, z: 21.411764705882355,
    models: [{ obj: 'mount-targon.obj', texture: 'mount-targon.png', scale: 6, rotY: -1.57, offset: [0, 10, -13] }],
    // Feixe de luz do cume ao céu: plano de 6 x 1000 que sobe, com a textura correndo.
    beam: { x: -201, y: -414, z: 543, width: 6, height: 1000, texture: 'beam.jpg' },
  },
  {
    slug: 'demacia-city-landmark', name: 'A Grande Cidade de Demacia', x: -456, y: 37, z: 3.0588235294117645,
    models: [{ obj: 'demacia-city-landmark.obj', texture: 'demacia-city-landmark.jpg', scale: 7, rotY: 0, offset: [0, 12, 13] }],
  },
  {
    slug: 'frostguard', name: 'A Cidadela Praeglacius', x: -215, y: 399, z: 13.647058823529411,
    models: [{ obj: 'frostguard.obj', texture: 'frostguard.jpg', scale: 7, rotY: 0, offset: [11, 28, 15] }],
  },
  {
    slug: 'placidium', name: 'O Placídio de Navori', x: 480, y: 240, z: 5.176470588235294,
    models: [{ obj: 'placidium.obj', texture: 'placidium.png', scale: 8, rotY: 0, offset: [16, 10, 14] }],
  },
  {
    slug: 'the-void', name: 'O Vazio', x: 270, y: -537, z: 9.411764705882353,
    models: [{ obj: 'the-void.obj', texture: 'the-void.jpg', scale: 10, rotY: 0, offset: [-7, 17, 0] }],
  },
]

// Onde ficam os arquivos no servidor.
export const LANDMARK_DIR = '/map/landmarks/'
