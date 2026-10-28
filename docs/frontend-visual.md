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

`usePanelSprings` roda um loop de `requestAnimationFrame` que, para cada painel, simula três molas (rigidez `w = 4`, amortecimento crítico):
- `g`: `flex-grow` (1 normal, 3.4 em hover, 0.65 nos vizinhos, 10 no selecionado, 0 nos que somem)
- `t`: progresso visual 0→1, exposto como a variável CSS `--t`
- `o`: opacidade

Os valores são escritos **direto no DOM** (`style.flexGrow`, `--t`, `opacity`) para não re-renderizar o React a cada frame. No CSS, zoom, saturação, brilho, legenda, linha e lore são `calc()` em cima de `--t`, por isso tudo anda no mesmo compasso. O hover tem um atraso de 90 ms (`App.jsx`) para o mouse poder atravessar a fileira sem acender todos os painéis.

## Personagens e efeitos

Definidos em `src/data/characters.js`:

| Campo | Uso |
|---|---|
| `id, name, role, lore` | textos |
| `hue` | cor do brilho do painel (`--h`); com `variant` (0–4), gera o placeholder |
| `img` | arte real importada de `assets/`; se não existir, usa `placeholderArt(hue, variant)` |
| `vid` | MP4 mudo em loop sobre a imagem (`img` vira o poster) |
| `pos` | enquadramento da arte (`background-position`/`object-position`) |
| `fx: 'embers'` | brasas subindo e calor no chão (`Embers.jsx`) |
| `fx: 'blood'` | ritual de sangue (`BloodMagic.jsx`): ao ganhar `.hot`, um símbolo de ritual (anéis com runas, hexagrama com círculos nas pontas, gota central) aparece **de frente, cobrindo o painel inteiro**, se desenha (`stroke-dashoffset` com `pathLength=100`, em ondas), gira (anel e hexagrama em sentidos opostos), cresce junto com a expansão do painel, solta um pulso de luz no centro e **some sozinho** em ~2 s (`.bl-sigil`, `mix-blend-mode: screen`). Fora do `.fx`, então não depende do `--t`; sem hover fica invisível. O painel de login do personagem ganha borda e título em vermelho-sangue (`.login.blood`) |
| `impact` | ondas de choque, explosão laranja e tremor da arte ao entrar |
| `burst` | pulso radial vermelho ao entrar |

Estado atual: **Rudo** (vídeo + burst vermelho + magia de sangue) e **Gaudron** (vídeo + brasas + impacto) têm arte real; **Proto, Titan e Loge** usam placeholders.

### Adicionar ou trocar a arte de um personagem
1. Coloque o arquivo em `src/assets/characters/` (JPG para a imagem; MP4 H.264 sem áudio para o vídeo).
2. Importe em `characters.js` e preencha `img` / `vid` / `pos` no item do personagem.
3. Para um efeito novo, crie o componente em `components/effects/`, renderize em `CharacterPanel.jsx` e adicione o CSS em `global.css`.


## Pendências / problemas conhecidos

- Artes reais para Proto, Titan e Loge.
- Vídeos pesados (cerca de 8,5 MB e 7,2 MB) estão versionados no Git; vale comprimir ou passar para Git LFS/CDN.
- Os itens usam ícones SVG genéricos por tipo; falta arte por item.
