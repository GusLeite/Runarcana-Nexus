// Cena viva do Alistar: fragment shader que deforma só as áreas da arte que deveriam se mexer e desenha as partículas.
// Coordenadas em fração da imagem (0 a 1, com y para baixo). Ver LivingArt.jsx.
export const MINOTAURO_SCENE = `
precision highp float;
uniform sampler2D img;
uniform float t;
varying vec2 v;

const float ASPECT = 1215.0 / 717.0;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float fbm(vec2 p) { return noise(p) * 0.55 + noise(p * 2.1 + 3.7) * 0.3 + noise(p * 4.3 + 8.1) * 0.15; }

// Máscara suave: 1 no centro, some em torno do raio r.
float blob(vec2 uv, vec2 c, vec2 r) {
  vec2 d = (uv - c) / r;
  return exp(-dot(d, d) * 1.6);
}

// Partículas em grade rolando na direção dir: cada célula sorteia se tem partícula e onde.
float specks(vec2 uv, float cells, vec2 dir, float radius, float density, float seed) {
  vec2 q = vec2(uv.x * ASPECT, uv.y) * cells - dir * t;
  vec2 cell = floor(q);
  float on = step(1.0 - density, hash(cell + seed));
  vec2 at = vec2(hash(cell + seed + 1.3), hash(cell + seed + 2.7)) * 0.7 + 0.15;
  float blink = 0.55 + 0.45 * sin(t * (1.0 + hash(cell + seed + 4.1) * 2.0) + hash(cell) * 6.28);
  return on * blink * smoothstep(radius, radius * 0.25, length(fract(q) - at));
}

void main() {
  // Câmera: zoom e deriva lentos. O zoom mínimo guarda margem para as deformações não mostrarem a borda.
  vec2 uv = 0.5 + (v - 0.5) / (1.06 + 0.012 * sin(t * 0.13)) + vec2(sin(t * 0.11), cos(t * 0.09)) * 0.004;
  vec2 p = uv;

  float rightFist = blob(uv, vec2(0.87, 0.80), vec2(0.13, 0.16));
  float leftFist = blob(uv, vec2(0.31, 0.20), vec2(0.13, 0.17));

  // Respiração: o tronco e a cabeça sobem e descem a partir do chão.
  float breath = sin(t * 1.15);
  p -= (uv - vec2(0.6, 0.95)) * blob(uv, vec2(0.6, 0.48), vec2(0.3, 0.42)) * 0.009 * breath;

  // Punhos: balanço pesado, fora de fase.
  p += leftFist * vec2(sin(t * 0.8 + 1.0), cos(t * 0.65)) * 0.005;
  p += rightFist * vec2(cos(t * 0.7), sin(t * 0.9 + 2.0)) * 0.005;

  // Juba ao vento: ondas que correm para a direita, mais fortes nas pontas.
  float mane = blob(uv, vec2(0.68, 0.11), vec2(0.17, 0.12));
  p += mane * (vec2(fbm(uv * vec2(16.0, 9.0) + vec2(-t * 0.8, t * 0.25)), fbm(uv * vec2(12.0, 10.0) + vec2(5.0, -t * 0.6))) - 0.5) * 0.03;
  // Pelos do queixo: tremem com o fôlego.
  p += blob(uv, vec2(0.585, 0.56), vec2(0.05, 0.05)) * vec2(sin(t * 2.3 + uv.y * 40.0), 0.0) * 0.0035;

  // Correntes penduradas: pêndulo, parado no alto e solto embaixo.
  p.x += blob(uv, vec2(0.175, 0.38), vec2(0.05, 0.14)) * sin(t * 0.9 - uv.y * 5.0) * 0.008 * smoothstep(0.22, 0.48, uv.y);
  p.x += blob(uv, vec2(0.17, 0.04), vec2(0.06, 0.08)) * sin(t * 0.7 + 1.5) * 0.004;
  p.x += blob(uv, vec2(0.385, 0.6), vec2(0.03, 0.05)) * sin(t * 1.1) * 0.003;

  // Poeira da pilastra e do chão: desliza como fumaça, sem levar o punho junto.
  float dust = blob(uv, vec2(0.84, 0.56), vec2(0.15, 0.24)) + blob(uv, vec2(0.58, 0.94), vec2(0.4, 0.09)) * 0.7;
  dust *= 1.0 - rightFist * 0.9;
  p += dust * (vec2(fbm(uv * 5.0 + vec2(-t * 0.17, t * 0.11)), fbm(uv * 5.0 + vec2(7.0 + t * 0.13, -t * 0.19))) - 0.5) * 0.045;

  // Escombros: os pedaços da pilastra e o entulho desfocado flutuam em câmera lenta.
  p += blob(uv, vec2(0.88, 0.27), vec2(0.09, 0.15)) * vec2(sin(t * 0.5), cos(t * 0.4 + 1.0)) * 0.005;
  p += blob(uv, vec2(0.13, 0.76), vec2(0.17, 0.26)) * vec2(sin(t * 0.3 + 0.5), cos(t * 0.24)) * 0.011;

  vec3 col = texture2D(img, p).rgb;

  // Luz: o sol atrás da pilastra e o feixe da esquerda oscilam, com névoa passando pela frente.
  col += vec3(1.0, 0.82, 0.55) * blob(uv, vec2(0.97, 0.12), vec2(0.26, 0.3)) * (0.07 + 0.09 * fbm(vec2(t * 0.25, uv.y * 3.0)));
  col += vec3(0.75, 0.8, 0.72) * blob(uv, vec2(0.14, 0.45), vec2(0.05, 0.25)) * (0.03 + 0.09 * fbm(vec2(uv.y * 4.0, t * 0.2)));
  col += vec3(0.85, 0.74, 0.55) * blob(uv, vec2(0.6, 0.78), vec2(0.42, 0.26)) * fbm(uv * 3.0 + vec2(t * 0.06, -t * 0.04)) * 0.16;

  // Olhos: acompanham a cabeça (p) e pulsam.
  float pulse = 0.5 + 0.5 * sin(t * 1.7);
  float eyes = blob(p, vec2(0.56, 0.374), vec2(0.008, 0.013)) + blob(p, vec2(0.632, 0.402), vec2(0.008, 0.013));
  float halo = blob(p, vec2(0.56, 0.374), vec2(0.024, 0.04)) + blob(p, vec2(0.632, 0.402), vec2(0.024, 0.04));
  col += vec3(1.0, 0.1, 0.06) * (eyes * (0.25 + 0.4 * pulse) + halo * (0.04 + 0.1 * pulse));

  // Bufada: vapor que sai das narinas a cada expiração e desce.
  float phase = fract(t * 1.15 / 6.2832);
  vec2 nose = vec2(0.585 - phase * 0.05, 0.505 + phase * 0.08);
  col += vec3(0.8, 0.8, 0.78) * blob(uv, nose, vec2(0.018 + phase * 0.05, 0.02 + phase * 0.06)) * fbm(uv * 26.0 + t * 0.5) * (1.0 - phase) * smoothstep(0.0, 0.1, phase) * 0.55;

  // Areia caindo da pilastra.
  col = mix(col, vec3(0.86, 0.72, 0.5), specks(uv, 62.0, vec2(0.15, -11.0), 0.22, 0.34, 1.0) * blob(uv, vec2(0.84, 0.48), vec2(0.11, 0.3)) * 0.85);
  // Lascas voando da pilastra para os lados.
  col = mix(col, vec3(0.3, 0.23, 0.16), specks(uv, 34.0, vec2(-3.6, 2.6), 0.2, 0.22, 7.0) * blob(uv, vec2(0.78, 0.35), vec2(0.14, 0.2)));
  // Sangue pingando do punho.
  col = mix(col, vec3(0.5, 0.05, 0.03), specks(uv, 44.0, vec2(0.0, -8.0), 0.18, 0.24, 13.0) * blob(uv, vec2(0.385, 0.4), vec2(0.03, 0.1)) * 0.9);
  // Poeira em suspensão, por toda a cena.
  col += vec3(1.0, 0.86, 0.62) * specks(uv, 20.0, vec2(0.28, 0.42), 0.09, 0.3, 21.0) * 0.32;

  gl_FragColor = vec4(col, 1.0);
}
`
