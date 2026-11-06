# Front-end

> Código em `frontend/`, já em `main`. React 18 + Vite 8, CSS puro, JavaScript (sem TypeScript).

## Onde está cada assunto

Leia este arquivo e **só** o subdocumento da área da tarefa:

| Documento | Conteúdo |
|---|---|
| [frontend-telas.md](frontend-telas.md) | Login e seleção, painel do mestre, assistente de criação, ficha do personagem |
| [frontend-visual.md](frontend-visual.md) | Animações, efeitos, artes dos personagens e como trocar/adicionar |

## Estrutura

```
frontend/
├── index.html                 carrega as fontes Cinzel/Spectral (Google Fonts) e src/main.jsx
├── vite.config.js             plugin React + proxy /runarcana → http://localhost:8080
└── src/
    ├── main.jsx               monta <App/> e importa o CSS global
    ├── App.jsx                estado (hovered, selected, sessão), cabeçalho, painéis e qual formulário mostrar
    ├── api/auth.js (+ .test.js)  chamadas /auth (login, me, logout, senha), sessão no localStorage e o `request` compartilhado
    ├── api/character.js       ficha do logado, usos de habilidade e descanso
    ├── api/documents.js       documentos do mestre (listar, marcar lido)
    ├── api/notes.js           anotações (listar, criar, salvar, apagar)
    ├── api/journal.js         diário do grupo (listar, escrever, editar, apagar)
    ├── data/journal.js (+ .test.js)  resumo das sessões do diário (um por dia)
    ├── api/map.js             Bandópolis, pontos de interesse, comentários e waypoints
    ├── api/live.js (+ .test.js) canal ao vivo (SSE): uma conexão por aba, `useLive(token, tópicos)`
    ├── components/dice3d/     dados 3D com física (ver frontend-visual.md)
    ├── api/rolls.js (+ .test.js) rolagens pelo servidor (`serverRoll`; sem servidor, sorteia aqui como "não registrada"); histórico em `hooks/useTableRolls.js`
    ├── api/lore.js            verbetes da lore
    ├── api/merchants.js       mercadores (mestre monta e abre; jogador compra e vende)
    ├── api/combat.js          combate (bestiário, confrontos, iniciativa, turnos; o confronto ativo e a iniciativa do jogador)
    ├── hooks/useActiveCombat.js  confronto ativo pelo canal ao vivo (tópicos combat e table; busca ao voltar à aba)
    ├── data/combat.js (+ .test.js)  retrato (com placeholder por baixo se o link quebrar), dano/cura, próximo da ordem, ataques do texto
    ├── components/combat/     CombatArena (trilha de iniciativa, mestre e jogador), CombatIntro (abertura), TurnBanner (faixa de turno)
    ├── data/characters.js     lista de personagens + imports das artes
    ├── data/rules.js (+ .test.js)  rótulos em PT, formatação e regras derivadas dos atributos
    ├── components/
    │   ├── CharacterPanel.jsx painel de um personagem (imagem/vídeo, sombra, legenda, efeitos)
    │   ├── Separator.jsx      divisória dourada entre painéis
    │   ├── LoginForm.jsx      formulário de login do personagem escolhido
    │   ├── PasswordForm.jsx   troca de senha (senha atual, nova, confirmação)
    │   ├── effects/Embers.jsx brasas e calor (Galdren)
    │   ├── effects/BloodMagic.jsx magia de sangue (Rudo)
    │   └── sheet/             ficha pós-login: CharacterSheet (abas e estado), SheetHero, OverviewTab, AttributeGrid,
    │                          SkillList, AbilitiesTab, AbilityIcon, Inventory, MerchantTab, DocumentsTab, NotesTab, DiceRoll, LevelUpCeremony, GroupJournal,
    │                          TabBar (abas com sublinhado deslizante), Num (número que conta), icons
    │   └── master/            MasterGate (portal de login), MasterPanel, MasterDocuments, MasterAbilities, MasterSheets, MasterMerchants, MasterRules, MasterCombat
    │   └── map/               mapa 3D de Runeterra (Three.js): WorldButtons, MapScreen, RegionPanel, MapPointPanels, poiKinds, regions, twinFrame, temporalDomes, demonGlobe, ravens, ravenModel, mapScene, mapMath (+ .test.js)
    │   └── lore/              lore da mesa: LoreScreen, LoreEntryView, LoreForm, AudiencePicker
    ├── audio/                 engine.js (sons sintetizados), uiSounds.js (+ .test.js, sons de interface por delegação), SoundToggle.jsx — ver frontend-visual.md
    ├── hooks/useCountUp.js (+ .test.js)  número que conta até o valor; prefersReducedMotion
    ├── hooks/useUrlParam.js (+ .test.js)  estado guardado na query da URL (aba, tela) com o "voltar" do navegador
    ├── data/levelGains.js (+ .test.js)  o que mudou na subida de nível (resumo da cerimônia)
    ├── utils/motion.js        replay (reinicia animação de classe) e afterLeave (espera a saída)
    ├── utils/placeholderArt.js   gera um retrato SVG para quem ainda não tem arte
    ├── utils/iconImage.js (+ .test.js)  valida e reduz a imagem do ícone de habilidade para 128x128
    ├── styles/global.css      visual da seleção e do login (tokens em :root)
    ├── styles/sheet.css       visual da ficha
    ├── styles/master.css      botão, portal e painel do mestre
    ├── styles/map.css, lore.css  mapa e lore
    ├── styles/merchant.css    loja do mercador (ficha) e aba do mestre
    ├── styles/combat.css      combate (trilha, abertura, faixa de turno, aba do mestre)
    ├── styles/motion.css      animações de polimento (importado por último no main.jsx)
    ├── styles/sound.css       controle de som do canto da tela
    ├── api/master.js          rotas do mestre (personagens, habilidades, documentos, destinatários, liberar a subida de nível)
    ├── validation.js (+ .test.js)
    └── assets/characters/     rudo.jpg/.mp4, gaudron.jpg/.mp4
```

## Conexão com a API

`src/api/auth.js` chama `VITE_API_URL` (padrão `/runarcana`). Em `npm run dev`, o Vite repassa `/runarcana` para o Spring em `localhost:8080`, então **o back-end precisa estar rodando** para o login funcionar. Os erros mostrados vêm do campo `message` da API; sem servidor, aparece "Não foi possível falar com o servidor". **Canal ao vivo** (`api/live.js`, ver `backend.md`): cada tela que buscava novidades com `setInterval` usa `const live = useLive(token, ['map'])`, chama `live.listen(check)` (roda no aviso do tópico e ao reconectar, agrupado em 250 ms) e deixa o intervalo como reserva com `if (live.due()) check()`: sem canal, `due()` é sempre verdadeiro (polling normal); com canal, no máximo a cada 60 s. A conexão é única por aba e fecha 3 s depois do último assinante sair; caiu, pede outro ticket com espera crescente (até 30 s); 401 no ticket para de tentar. Assinam: mapa (pontos, grupo, trajetórias: `map`), ficha (mercador, locais revelados, nível liberado, documentos novos), Mesa do mestre (`table`), diário, trocas do mercador e o combate (`combat` + `table`, em `useActiveCombat`). As regras de senha são repetidas em `validation.js` (`validatePasswordChange`) só para avisar antes de enviar; quem decide é o back-end.

## App Android (APK)

O APK (Capacitor, `capacitor.config.json`) é só uma janela para `https://runarcana-nexus.duckdns.org`: o front não vai embutido, então atualizar o site atualiza o app, sem CORS nem `VITE_API_URL`. `android-shell/` tem apenas a página vazia exigida pelo Capacitor e `error.html`, mostrada quando o site não abre. Trocar o endereço, o ícone ou o nome exige gerar e reinstalar o APK.

`npm run apk` (`scripts/build-apk.ps1`) gera `dist-apk/Runarcana.apk`. Ferramentas e chave ficam fora do repositório, em `ANDROID_BUILD_ROOT` (padrão `E:\AndroidBuild`): `jdk21`, `sdk`, `gradle`, `runarcana-release.jks` e `keystore.properties`. Sem essa chave, uma versão nova só instala depois de desinstalar a antiga. O ícone e a abertura foram recortados de `android/icon-source.png` (capa do livro, 488×779, com marcadores de captura fora do recorte).

## Identidade visual

Tokens em `:root` (`global.css`): fundo `--bg #050b14`, painel `--panel #0a1626`, dourado `--gold #c8a24a` / `--gold-hi #f0c75e`, turquesa `--teal #2fd3c0`, texto `--text #e8dfc8`, apagado `--muted #8d97a8`. Fontes: **Cinzel** (títulos, nomes, botões) e **Spectral** (texto).

## Origem

A tela foi prototipada num `index.html` único (React via CDN, imagens e vídeo em base64, cerca de 12 MB) numa sessão anterior do Claude e depois portada para este projeto Vite. Ficaram de fora do porte:
- um efeito de "sangue escorrendo" (`BloodFx`) para o Rudo que estava no protótipo, mas não era usado. Depois o Rudo ganhou um efeito novo, a magia de sangue (`BloodMagic.jsx`, `fx: 'blood'`);
- o fallback que convertia vídeo base64 em Blob (não é necessário com arquivos de verdade).

## Pendências / problemas conhecidos

- APK: a imagem do ícone é uma captura de baixa resolução; vale regerar a partir do arquivo original da capa.
- Martelada do Galdren: no painel do Claude, o primeiro quadro ainda atrasa 1 s (a thread principal fica livre; depois disso roda a mais de 90 fps). Falta confirmar num navegador comum se isso também acontece lá.
- Vídeos da seleção (`assets/characters/`, ~15 MB no total): os quatro tocam juntos em repouso, então ficam em 720p, sem áudio e no fps original (`ffmpeg -i orig.mp4 -an -vf "scale=-2:720:flags=lanczos" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart saida.mp4`).
- As 29 linhagens têm imagem. Vale trocar a do fulgor, que é pequena (507×594). Linhagem nova no catálogo: basta soltar `<id>.webp` em `src/assets/lineages/` (sem imagem, o cartão mostra o espaço provisório).
- Vídeos das origens (`assets/origins/`, ~12 MB no total): para trocar um, corte o original num loop de até 10 s e recomprima, por exemplo `ffmpeg -ss INICIO -t DURACAO -i orig.mp4 -ss FIM_DO_TRECHO -t 1 -i orig.mp4 -filter_complex "[0:v]scale=-2:'min(1080,ih)'[a];[1:v]scale=-2:'min(1080,ih)',format=yuva420p,fade=t=out:st=0:d=1:alpha=1[b];[a][b]overlay=0:0:eof_action=pass,format=yuv420p[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 24 -movflags +faststart saida.mp4` (o segundo `-ss` é INICIO+DURACAO: o último segundo é fundido com o começo para o loop emendar). O ffmpeg não está instalado na máquina; foi usado o pacote npm `ffmpeg-static` numa pasta temporária.
- Vídeos das classes (`assets/classes/`, ~20 MB no total): mesmo processo dos das origens; os originais (1080p, 14–19 Mbps) foram recomprimidos com `libx264 -crf 25`, 30 fps, sem áudio; o do Xamã (22,8 s) foi cortado em 10 s com o último segundo fundido ao começo.
- Artes das regiões (`assets/regions/`, ~23 MB no total): 12 loops de 7 a 10 s (mesma receita das origens, com `-crf 27`, 30 fps e sem áudio) com o primeiro quadro em `.webp`, mais as imagens de Nazumah e do Vazio. O vídeo de Zaun teve as faixas pretas cortadas. As `tagline` de `regionArt.js` são provisórias, até o catálogo ter a descrição das regiões.
- O token fica no `localStorage` (simples, mas acessível a scripts da página); se o projeto crescer, considerar cookie `HttpOnly`.
