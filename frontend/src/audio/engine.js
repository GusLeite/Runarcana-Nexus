// Motor de som do Runarcana: tudo é sintetizado na hora com a Web Audio API (osciladores, ruído e uma reverberação
// de catedral), então não há arquivo de áudio para baixar. Efeitos: `play('nome', arg)`.
// O navegador só libera o som depois de um gesto do usuário (`unlock`); antes disso tudo é silêncio.

const STORE = 'runarcana.sound.v2'
const DEFAULTS = { sfx: true, volume: 0.7 }

const readPrefs = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE)) }
  } catch {
    return { ...DEFAULTS }
  }
}

let prefs = readPrefs()
const listeners = new Set()

// Preferências (para a interface do controle de som): getPrefs devolve um objeto novo a cada mudança.
export const getPrefs = () => prefs
export const subscribe = fn => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function setPrefs(patch) {
  prefs = { ...prefs, ...patch }
  try {
    localStorage.setItem(STORE, JSON.stringify(prefs))
  } catch { /* sem armazenamento: vale só nesta visita */ }
  apply()
  listeners.forEach(fn => fn())
}

// Para diagnóstico (console: `await (await import('/src/audio/engine.js')).debugState()`).
export const debugState = () => ({ unlocked, state: ctx?.state ?? 'sem contexto', prefs, sampleRate: ctx?.sampleRate, out: out?.gain.value })

// ---------- contexto e barramentos ----------

let ctx = null
let out, noiseBuf
let sfx // barramento: { gain, dry, send }
let unlocked = false

// Reverberação: ruído que decai, estéreo.
function impulse(c, seconds, decay) {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

// Cada barramento tem a via seca (dry) e a via da reverberação (send); `gain` liga/desliga as duas juntas.
function makeBus(c) {
  const gain = c.createGain()
  gain.connect(out)
  const dry = c.createGain()
  dry.connect(gain)
  const send = c.createGain()
  const conv = c.createConvolver()
  conv.buffer = impulse(c, 3, 2.4)
  const wet = c.createGain()
  wet.gain.value = 0.6
  send.connect(conv)
  conv.connect(wet)
  wet.connect(gain)
  return { gain, dry, send }
}

function audio() {
  if (ctx) return ctx
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext
  if (!AC) return null
  // 48 kHz fixo: alguns drivers do Windows (dispositivo em 192 kHz) ficam mudos com a taxa nativa.
  try {
    ctx = new AC({ sampleRate: 48000, latencyHint: 'interactive' })
  } catch {
    ctx = new AC()
  }
  // O compressor segura os picos quando vários sons se somam.
  const comp = ctx.createDynamicsCompressor()
  comp.connect(ctx.destination)
  out = ctx.createGain()
  out.gain.value = 0
  out.connect(comp)
  sfx = makeBus(ctx)
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  apply()
  return ctx
}

function apply() {
  if (!ctx) return
  const now = ctx.currentTime
  out.gain.setTargetAtTime(prefs.volume * prefs.volume, now, 0.05)
  sfx.gain.gain.setTargetAtTime(prefs.sfx ? 1 : 0, now, 0.03)
}

// Chamado no primeiro gesto do usuário (clique, toque ou tecla).
// Chamado a cada gesto até o áudio de fato estar tocando: alguns navegadores só aceitam o `resume` no click/toque
// (não no pointerdown), então uma tentativa única não basta.
let hooked = false
export function unlock() {
  unlocked = true
  const c = audio()
  if (!c) return
  if (c.state !== 'running') c.resume().catch(() => {})
  if (hooked) return
  hooked = true
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx.suspend().catch(() => {})
    else ctx.resume().catch(() => {})
  })
}

// ---------- vozes ----------

const rand = (a, b) => a + Math.random() * (b - a)

function wire(node, bus, send) {
  node.connect(bus.dry)
  if (send) {
    const s = ctx.createGain()
    s.gain.value = send
    node.connect(s)
    s.connect(bus.send)
  }
}

// Nota simples. t = atraso (s); f2 = frequência final de um deslize; lp = passa-baixas.
function tone({ f, f2, type = 'sine', t = 0, dur = 0.2, vol = 0.15, attack = 0.004, bus = sfx, send = 0, lp, det = 0 }) {
  const t0 = ctx.currentTime + t
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(f, t0)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur)
  o.detune.value = det
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(vol, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  let node = o
  if (lp) {
    const fl = ctx.createBiquadFilter()
    fl.type = 'lowpass'
    fl.frequency.value = lp
    o.connect(fl)
    node = fl
  }
  node.connect(g)
  wire(g, bus, send)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

// Ruído filtrado (papel, metal, vento). f → f2 desliza o filtro.
function noise({ t = 0, dur = 0.1, vol = 0.1, type = 'bandpass', f = 1000, f2, q = 1, attack = 0.003, bus = sfx, send = 0 }) {
  const t0 = ctx.currentTime + t
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const fl = ctx.createBiquadFilter()
  fl.type = type
  fl.Q.value = q
  fl.frequency.setValueAtTime(f, t0)
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(vol, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(fl)
  fl.connect(g)
  wire(g, bus, send)
  src.start(t0, rand(0, 1.5))
  src.stop(t0 + dur + 0.05)
}

// Sino/metal: parciais inarmônicas que somem em tempos diferentes.
const PARTIALS = [[1, 1, 1], [2.76, 0.5, 0.6], [5.4, 0.25, 0.4], [8.93, 0.12, 0.25]]
function bell(f, t = 0, vol = 0.1, dur = 1.4, send = 0.5, bus = sfx) {
  PARTIALS.forEach(([ratio, amp, life]) => {
    if (f * ratio < 9000) tone({ f: f * ratio, t, dur: dur * life, vol: vol * amp, send, bus, attack: 0.002 })
  })
}

// Corda dedilhada (alaúde).
function pluck(f, t = 0, vol = 0.12, send = 0.3) {
  tone({ f, type: 'triangle', t, dur: 0.55, vol, lp: 2400, send })
  tone({ f: f * 2, t, dur: 0.22, vol: vol / 3, send })
}

// ---------- efeitos ----------

const clink = t => {
  tone({ f: 2637, t, dur: 0.2, vol: 0.07, send: 0.3 })
  tone({ f: 3951, t, dur: 0.14, vol: 0.04, send: 0.3 })
  noise({ t, dur: 0.04, vol: 0.05, f: 7000, q: 1.5 })
}

// Cada personagem da seleção tem a sua assinatura ao ser tocado pelo mouse.
const CHAR_HOVER = {
  gaudron(rootHz) {
    // forja: um golpe de martelo no ferro e faíscas
    tone({ f: 98, f2: 60, dur: 0.5, vol: 0.12, type: 'triangle', lp: 500 })
    bell(rootHz, 0.01, 0.07, 1.6, 0.5)
    for (let i = 0; i < 4; i++) noise({ t: 0.05 + i * rand(0.05, 0.12), dur: 0.03, vol: 0.05, f: rand(4000, 8000), q: 2 })
  },
  rudo() {
    // coração batendo
    tone({ f: 62, f2: 38, dur: 0.2, vol: 0.2 })
    tone({ f: 56, f2: 36, t: 0.22, dur: 0.24, vol: 0.16 })
    noise({ dur: 0.4, vol: 0.03, type: 'lowpass', f: 200, q: 0.5, attack: 0.1 })
  },
  proto() {
    // magia calma: um acorde grave que abre (quinta) e um sino baixo, sem agudos
    tone({ f: 220, dur: 0.9, vol: 0.05, attack: 0.18, send: 0.6, lp: 900 })
    tone({ f: 330, dur: 0.9, vol: 0.04, attack: 0.22, send: 0.6, lp: 900 })
    bell(440, 0.2, 0.04, 1.4, 0.6)
  },
  loge() {
    // assombração: sopro e duas vozes desafinadas
    noise({ dur: 0.9, vol: 0.06, f: 1400, f2: 350, q: 2, attack: 0.15, send: 0.9 })
    tone({ f: 233, dur: 0.9, vol: 0.04, attack: 0.2, send: 0.8, det: -12 })
    tone({ f: 233, dur: 0.9, vol: 0.04, attack: 0.2, send: 0.8, det: 14 })
  },
}

const SFX = {
  hover: () => tone({ f: 3200, f2: 2200, dur: 0.04, vol: 0.022 }),
  tap: () => {
    tone({ f: 260, f2: 120, type: 'triangle', dur: 0.08, vol: 0.1 })
    noise({ dur: 0.025, vol: 0.04, f: 2200, q: 0.9 })
  },
  toggle: () => {
    tone({ f: 520, type: 'triangle', dur: 0.06, vol: 0.07 })
    tone({ f: 780, type: 'triangle', t: 0.05, dur: 0.08, vol: 0.06 })
  },
  key: () => noise({ dur: 0.015, vol: 0.02, f: rand(2600, 3400), q: 1.2 }),
  quill: () => noise({ dur: 0.05, vol: 0.03, f: rand(4200, 5500), f2: 2500, q: 0.6, attack: 0.01 }),
  page: () => {
    noise({ dur: 0.3, vol: 0.1, f: 600, f2: 3600, q: 0.6, attack: 0.06, send: 0.2 })
    noise({ t: 0.12, dur: 0.15, vol: 0.05, f: 4500, f2: 2000 })
    tone({ f: 330, f2: 440, t: 0.02, dur: 0.25, vol: 0.04, send: 0.4 })
  },
  confirm: () => {
    pluck(392)
    pluck(523, 0.06)
    pluck(784, 0.12)
  },
  gate: () => {
    tone({ f: 73, f2: 55, type: 'sawtooth', dur: 0.9, vol: 0.1, lp: 300, send: 0.4 })
    bell(293.7, 0.1, 0.09, 2.2, 0.8)
    bell(440, 0.28, 0.07, 2.4, 0.8)
  },
  danger: () => {
    tone({ f: 150, f2: 45, type: 'sawtooth', dur: 0.4, vol: 0.13, lp: 500 })
    noise({ dur: 0.15, vol: 0.1, type: 'lowpass', f: 250, q: 0.4 })
  },
  error: () => {
    tone({ f: 185, type: 'square', dur: 0.32, vol: 0.06, lp: 700 })
    tone({ f: 262, type: 'square', dur: 0.32, vol: 0.05, lp: 700 })
    tone({ f: 92, f2: 70, type: 'sawtooth', dur: 0.4, vol: 0.08, lp: 300 })
  },
  notice: () => {
    bell(784, 0, 0.08, 1.4, 0.6)
    bell(1175, 0.09, 0.05, 1.2, 0.6)
  },
  success: () => {
    pluck(523)
    pluck(659, 0.08)
    pluck(784, 0.16)
    bell(1047, 0.26, 0.06, 1.8, 0.7)
  },
  coin: () => {
    clink(0)
    clink(0.07)
    if (Math.random() < 0.6) clink(0.13)
  },
  consume: () => {
    ;[0, 0.09, 0.17].forEach((t, i) => tone({ f: 300 + i * 60, f2: 700 + i * 80, t, dur: 0.08, vol: 0.07 }))
    noise({ dur: 0.3, vol: 0.04, type: 'lowpass', f: 600, q: 0.5 })
  },
  char: ch => {
    const hz = 196 * Math.pow(2, (((ch?.hue ?? 0) % 360) / 360) * (7 / 12))
    const sign = CHAR_HOVER[ch?.id]
    if (sign) sign(hz)
    else bell(hz * 2, 0, 0.07, 1.4, 0.6)
  },
  choose: ch => {
    // desembainhar: lâmina que sobe + sino do personagem
    noise({ dur: 0.45, vol: 0.09, type: 'highpass', f: 3000, f2: 9000, q: 0.7, attack: 0.05, send: 0.3 })
    tone({ f: 90, f2: 45, dur: 0.4, vol: 0.13 })
    bell(196 * Math.pow(2, (((ch?.hue ?? 0) % 360) / 360) * (7 / 12)) * 2, 0.08, 0.08, 1.8, 0.8)
  },
  login: () => {
    tone({ f: 90, f2: 50, dur: 0.6, vol: 0.14, lp: 400 })
    noise({ dur: 0.5, vol: 0.05, type: 'lowpass', f: 300, q: 0.5, attack: 0.1 })
    bell(220, 0.2, 0.08, 2.4, 0.8)
    bell(330, 0.36, 0.08, 2.4, 0.8)
    bell(440, 0.52, 0.07, 2.6, 0.9)
  },
  logout: () => {
    bell(330, 0, 0.07, 1.8, 0.8)
    bell(220, 0.16, 0.07, 2.2, 0.8)
    tone({ f: 80, f2: 45, t: 0.3, dur: 0.4, vol: 0.1, lp: 300 })
  },
  rattle: () => {
    // o dado quicando: cliques de madeira que vão diminuindo (um a cada 55 ms, como os números na tela)
    for (let i = 0; i < 14; i++) {
      const t = i * 0.055 + rand(0, 0.012)
      const v = 1 - i * 0.04
      noise({ t, dur: 0.025, vol: 0.07 * v, f: rand(1200, 3700), q: 3 })
      tone({ f: rand(300, 500), f2: 150, t, dur: 0.04, vol: 0.04 * v, type: 'triangle' })
    }
  },
  settle: () => {
    tone({ f: 200, f2: 90, type: 'triangle', dur: 0.2, vol: 0.16 })
    noise({ dur: 0.08, vol: 0.1, type: 'lowpass', f: 700, q: 0.5 })
    bell(523, 0.02, 0.04, 0.8, 0.4)
  },
  crit: () => {
    SFX.settle()
    ;[659, 880, 1047, 1319].forEach((f, i) => bell(f, 0.08 + i * 0.08, 0.09, 2, 0.8))
    noise({ t: 0.1, dur: 0.9, vol: 0.05, type: 'highpass', f: 2500, f2: 9000, q: 0.5, attack: 0.3, send: 0.5 })
  },
  fumble: () => {
    tone({ f: 130, f2: 55, type: 'sawtooth', dur: 0.9, vol: 0.12, lp: 400 })
    bell(207.6, 0.05, 0.07, 1.6, 0.7)
    noise({ dur: 0.4, vol: 0.08, type: 'lowpass', f: 300, q: 0.5 })
  },
  heal: () => {
    ;[659, 880, 1319].forEach((f, i) => bell(f, i * 0.1, 0.08, 1.4, 0.7))
    tone({ f: 330, f2: 660, dur: 0.4, vol: 0.04, send: 0.6, attack: 0.1 })
  },
  damage: () => {
    tone({ f: 120, f2: 40, dur: 0.25, vol: 0.18 })
    tone({ f: 90, type: 'sawtooth', dur: 0.2, vol: 0.07, lp: 300 })
    noise({ dur: 0.1, vol: 0.1, f: 400, q: 0.8 })
  },
  ward: () => {
    bell(494, 0, 0.07, 1.6, 0.7)
    tone({ f: 247, f2: 370, dur: 0.5, vol: 0.05, send: 0.6, attack: 0.15 })
  },
  cast: () => {
    noise({ dur: 0.7, vol: 0.08, f: 400, f2: 5000, q: 1.5, attack: 0.15, send: 0.6 })
    tone({ f: 330, f2: 1320, dur: 0.6, vol: 0.06, send: 0.7, attack: 0.1 })
    bell(1760, 0.55, 0.06, 1.5, 0.8)
  },
  rest: long => {
    ;(long ? [196, 247, 294, 392] : [294, 392]).forEach((f, i) =>
      tone({ f, dur: long ? 2.2 : 1.2, vol: 0.05, attack: 0.4, send: 0.7, t: i * 0.12 }))
  },
  levelready: () => {
    bell(587, 0, 0.08, 2, 0.8)
    bell(880, 0.15, 0.08, 2.2, 0.8)
    bell(1175, 0.3, 0.07, 2.5, 0.9)
  },
  levelup: () => {
    ;[392, 494, 587, 784, 988].forEach((f, i) => {
      pluck(f, i * 0.1, 0.12, 0.5)
      bell(f * 2, i * 0.1 + 0.02, 0.05, 1.6, 0.8)
    })
    ;[392, 587, 784].forEach(f => tone({ f, type: 'triangle', t: 0.5, dur: 2, vol: 0.06, attack: 0.1, send: 0.8 }))
  },
}

// Sons da ficha e do painel do mestre: suaves e arredondados (pop de bolha, acorde macio no botão principal)
// para ficarem satisfatórios no uso repetido. Prefixo `lol-` por tradição; `lol-x` vale no lugar de `x`.
Object.assign(SFX, {
  // Sem ruído agudo: só notas redondas e filtradas, curtas e baixas, para não cansar com o uso.
  'lol-hover': () => tone({ f: 520, f2: 600, dur: 0.05, vol: 0.02, attack: 0.01, lp: 1800 }),
  'lol-tap': () => {
    // um "pop" de bolha: pitch que cai rápido, com um pouco de corpo
    tone({ f: 620, f2: 300, dur: 0.09, vol: 0.09, lp: 1500 })
    noise({ dur: 0.02, vol: 0.03, type: 'lowpass', f: 1200, q: 0.5 })
  },
  'lol-page': () => {
    noise({ dur: 0.2, vol: 0.05, type: 'lowpass', f: 400, f2: 1800, q: 0.5, attack: 0.06 })
    tone({ f: 523, f2: 659, dur: 0.15, vol: 0.04, lp: 2000, send: 0.25 })
  },
  'lol-confirm': () => {
    // três notas suaves subindo (acorde maior) sobre um baque quente
    tone({ f: 130, f2: 90, dur: 0.15, vol: 0.08, lp: 400 })
    ;[392, 494, 587].forEach((f, i) => tone({ f, t: i * 0.06, dur: 0.35, vol: 0.08, attack: 0.01, lp: 2000, send: 0.35 }))
  },
  'lol-toggle': () => {
    tone({ f: 500, dur: 0.05, vol: 0.06, lp: 1800 })
    tone({ f: 750, t: 0.05, dur: 0.07, vol: 0.05, lp: 1800 })
  },
  'lol-danger': () => tone({ f: 140, f2: 70, dur: 0.18, vol: 0.1, lp: 400 }),
})

const MIN_GAP = { hover: 60, key: 30, quill: 30, tap: 40 }
const last = {}

export function play(name, arg) {
  if (!prefs.sfx || !unlocked) return
  // Variante de estilo sem receita própria cai no som comum.
  if (!SFX[name] && name.startsWith('lol-')) name = name.slice(4)
  const fn = SFX[name]
  if (!fn) return
  const now = performance.now()
  if (now - (last[name] ?? -1e9) < (MIN_GAP[name.replace('lol-', '')] ?? 25)) return
  // Aviso comum logo depois de um erro seria barulho em dobro.
  if (name === 'notice' && now - (last.error ?? -1e9) < 500) return
  last[name] = now
  const c = audio()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  try {
    fn(arg)
  } catch (err) {
    // Um som que falha não derruba a tela; no desenvolvimento, avisa.
    if (import.meta.env?.DEV) console.warn('Som "' + name + '" falhou:', err)
  }
}
