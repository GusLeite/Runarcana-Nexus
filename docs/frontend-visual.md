# Front-end — animações, personagens e arte

> Parte do [frontend.md](frontend.md).

## Animações de polimento

Ficam quase todas em `styles/motion.css`, importado **por último** no `main.jsx` (o Vite põe o CSS dos componentes antes do `global.css`, então a ordem importa).

- **Entradas em cascata**: hexágonos de atributo (giram e crescem), perícias, linhas de habilidade, casas do inventário, barra rápida, documentos, anotações, enviados do mestre e histórico de rolagens. Cada item recebe `style={{ '--n': índice }}` e o atraso é `calc(var(--n) * …)`. Entradas usam `animation-fill-mode: backwards`, para não travar o `transform` do hover depois de terminar.
- **Troca de conteúdo**: dica do item, dica da habilidade e editor de nota entram deslizando (os componentes têm `key` pelo id). O pergaminho do documento se desenrola de cima para baixo, o selo de cera "carimba" e o CONFIDENCIAL bate depois.
- **Números que contam** (`hooks/useCountUp.js` + `components/sheet/Num.jsx`): modificadores e valores dos atributos, estatísticas, PV, ouro e valor do inventário contam até o valor (de 0 na primeira vez; depois, do valor anterior).
- **Abas** (`components/sheet/TabBar.jsx`, na ficha e no mestre): um sublinhado dourado único desliza até a aba ativa (mede `offsetLeft/offsetWidth`; recalcula ao trocar de aba, mudar contador ou redimensionar). O contador "pula" quando muda.
- **Toques de jogo**: flash dourado ao entrar na ficha ou no painel (lock-in), brilho que atravessa o botão "Rolar d20" e a barra de PV de tempos em tempos, zoom lento contínuo na arte do herói, pulso no anel de nível, moeda que gira no hover, brilho que passa no hexágono no hover, 14 faíscas no 20 natural, selo NOVO pulsando, casa do item escolhido com anel pulsando.
- **Usos de habilidade**: o losango gasto encolhe; no descanso eles reacendem em onda (`transition-delay` pelo índice).
- **Feedback**: login e troca de senha **tremem** no erro (`utils/motion.js` `replay` recoloca a classe `shake`); itens apagados (anotação, documento e habilidade do mestre) encolhem e deslizam antes de sair (`leaving` + `afterLeave`, 260 ms); toast entra pela lateral com uma barra que esvazia nos 4 s; foco dos campos com halo turquesa; botões afundam ao clicar.
- **Menos movimento**: com `prefers-reduced-motion: reduce` (no Windows, "Efeitos de animação" desligado) tudo isso é desligado, inclusive `::before/::after`, e os números já aparecem no valor final. O navegador do preview do Claude vem com essa opção ligada; para ver as animações nele foi preciso desligá-la só na aba de teste.

## Como a animação funciona

Os painéis da seleção são animados só por transições do CSS, a partir das classes `.hot`, `.sel`, `.gone` e `.row.has-hot`; não há loop em JavaScript, e em repouso nada é recalculado. Com um painel aceso, os vídeos dos outros ficam pausados (`resting` no `CharacterPanel`).

**Regras de desempenho** (valem para os painéis da seleção, as origens e as classes):
- camadas pintadas não acompanham a largura do painel: `--hot-w` (64vw na seleção, 38vw nos salões) é a largura do painel aceso, e sombra, feixe, arena e efeitos têm esse tamanho fixo, para não serem repintados enquanto ele cresce;
- brilho interno com gradientes, nunca `box-shadow` borrado em área grande; partículas com `radial-gradient`, sem sombra;
- gradientes grandes e suaves em 1/4 do tamanho, ampliados com `scale(4)` e `will-change:transform`;
- efeito fora da árvore (`display:none`) quando o painel não está aceso;
- nos salões, só o vídeo do painel aceso toca, e o `FocusVideo` escreve a posição direto no DOM, sem render do React.

## Personagens e efeitos

Definidos em `src/data/characters.js`:

| Campo | Uso |
|---|---|
| `id, name, role, lore` | textos |
| `hue` | cor do brilho do painel (`--h`); com `variant` (0–4), gera o placeholder |
| `img` | arte real importada de `assets/`; se não existir, usa `placeholderArt(hue, variant)` |
| `vid` | MP4 mudo em loop sobre a imagem (`img` vira o poster) |
| `pos` | enquadramento da arte (`background-position`/`object-position`) |
| `fx: 'embers'` | martelada na arena (`Embers.jsx`, CSS `.gd-*`): brasas e calor enquanto durar o hover; com `.hot`, a tela escurece e a luz é puxada para o chão; aos 0,5 s o golpe (clarão, tremor, rachaduras de lava que esfriam, pedras, fagulhas, poeira); aos 1,1, 1,55 e 2 s a torcida grita "GAU! DRON! GAUDRON!" com as tochas chamejando e panos vermelhos caindo. Some em ~3,6 s. Login em laranja (`.login.embers`) |
| `fx: 'blood'` | ritual de sangue (`BloodMagic.jsx`): ao ganhar `.hot`, um símbolo de ritual (anéis com runas, hexagrama com círculos nas pontas, gota central) aparece **de frente, cobrindo o painel inteiro**, se desenha (`stroke-dashoffset` com `pathLength=100`, em ondas), gira (anel e hexagrama em sentidos opostos), cresce junto com a expansão do painel, solta um pulso de luz no centro e **some sozinho** em ~2 s (`.bl-sigil`, `mix-blend-mode: screen`). Fora do `.fx`, então não depende do `--t`; sem hover fica invisível. O painel de login do personagem ganha borda e título em vermelho-sangue (`.login.blood`) |
| `fx: 'haunt'` | assombração (`Haunting.jsx`, CSS `.lg-*`, classe `.haunted` no painel): com `.hot`, a arte cambaleia de leve e ganha visão dupla vermelha (somem em ~3 s), com fumaça subindo enquanto durar o hover; aos 0,2 s uma **facada** diagonal parte o pôster em duas metades que se afastam sobre um vão escuro; o painel escurece e o **rosto da princesa** (recorte do `img`, ajustado à arte atual em `background-size/position`) surge e se desfaz em ~4 s, com três sussurros em sequência. Login com borda e título assombrados (`.login.haunt`) |
| `fx: 'oath'` | juramento do escudeiro (`ShieldOath.jsx`, CSS `.pt-*`, classe `.oath` no painel): com `.hot`, varredura e moldura de visor; uma bússola-radar procura o mestre (agulha que hesita, pulsos) enquanto um registro digita "BUSCANDO MESTRE…" e "SEM RESPOSTA"; aos 1,56 s a borda do escudo fica dourada, ele bate (onda de choque, clarão, tremor da arte) e se enche de hexágonos do centro para fora, com "JURAMENTO MANTIDO" e "SEGUINDO VIAGEM". Tudo some em 3,33 s e fica só a poeira soprada de lado. Login em azul (`.login.oath`) |
| `impact` | ondas de choque, explosão laranja e tremor da arte (`gd-slam`), sincronizados com a martelada do `embers` aos 0,5 s |
| `burst` | pulso radial vermelho ao entrar |

Estado atual: **Rudo** (vídeo + burst vermelho + magia de sangue) e **Gaudron** (vídeo + brasas + impacto), **Proto** (vídeo + juramento) e **Loge** (vídeo + assombração) têm arte real.

### Adicionar ou trocar a arte de um personagem
1. Coloque o arquivo em `src/assets/characters/` (JPG para a imagem; MP4 H.264 sem áudio para o vídeo).
2. Importe em `characters.js` e preencha `img` / `vid` / `pos` no item do personagem.
3. Para um efeito novo, crie o componente em `components/effects/`, renderize em `CharacterPanel.jsx` e adicione o CSS em `global.css`. Anime só `transform`/`scale`/`translate`/`opacity`: sobre o vídeo, `mix-blend-mode`, `filter` e `stroke-*` animado derrubam os quadros (foi o que travou a martelada do Gaudron).

### Imagem viva nas origens
`LivingArt.jsx` anima uma imagem em tempo real com WebGL, a cerca de 30 quadros/s; sai do ar fora da tela e fica parada com `prefers-reduced-motion` ou sem WebGL. A cena é um fragment shader em `data/scenes/`, com máscaras em fração da imagem para cada área que se mexe (na do Alistar: respiração, juba, correntes, poeira, olhos, areia, lascas, sangue). Hoje nenhuma origem usa: o Minotauro testou a imagem animada do Alistar e voltou ao vídeo (`minotauro.webp` e `scenes/minotauro.js` ficaram sem uso). Para usar numa origem, preencha `living` em `originArt.js`; `living` tem prioridade sobre `video`.

## Som

Tudo é **sintetizado na hora** com a Web Audio API (`src/audio/`), sem arquivos de áudio; só toca depois do primeiro clique/tecla (regra dos navegadores).
- `engine.js`: osciladores, ruído e reverberação de catedral. `play('nome', arg)` dispara um efeito (tabela `SFX`; ajuste a receita ali). Preferências (efeitos e volume) ficam no `localStorage` (`runarcana.sound.v2`).
- `uiSounds.js` (instalado em `main.jsx`): sons de interface **por delegação** (dentro de `.sheet`, ou seja, ficha e painel do mestre, usam sons suaves e arredondados: receitas `lol-*` em `engine.js`, com fallback para a comum), então tela nova já nasce com som: hover nos controles, clique escolhido por `clickSound` (aba = página virando, `.danger-btn`/`.danger` = golpe grave, `.btn`/submit = acorde de alaúde, `.master-btn` = portão, marcador = alavanca, resto = toque), digitação (pena nas `textarea`) e avisos que aparecem na tela (`role="alert"`/`.err` = erro, `.toast` = sino, `.lvl-ready` = chamado de subida de nível). `data-sfx="nome"` num controle troca o som; `data-sfx="none"` o silencia.
- Explícitos no código: assinatura de cada personagem no hover/escolha da seleção (forja, coração, magia, assombração), login/logout, dado (chacoalhar + queda, 20 natural e 1 natural têm som próprio), PV (cura/dano/temporários), conjuração, descansos, compra/venda/ouro, poção, subida de nível e criação concluída.
- `SoundToggle.jsx`: controle fixo no canto inferior esquerdo (efeitos e volume).

## Pendências / problemas conhecidos

- O som não foi calibrado por ouvido em vários aparelhos: se algum efeito estiver alto/agudo demais, ajuste `vol` na receita em `engine.js`.
- Vídeos pesados (entre 7,2 MB e 9,6 MB cada) estão versionados no Git; vale comprimir ou passar para Git LFS/CDN.
- Os itens usam ícones SVG genéricos por tipo; falta arte por item.
