# Front-end

> Código em `frontend/`, já em `main`. React 18 + Vite 8, CSS puro, JavaScript (sem TypeScript).

## Tela atual: seleção de personagem + login

1. O topo mostra o logo **RUNARCANA** e uma dica ("Escolha seu personagem para entrar").
2. Cinco painéis verticais (Rudo, Gaudron, Proto, Titan, Loge), separados por divisórias douradas com losangos.
3. **Hover/foco** em um painel: ele se expande com uma mola, ganha zoom e brilho, mostra papel, nome, linha dourada e lore; os vizinhos encolhem e a divisória ao lado acende. Um feixe de luz cruza o painel.
4. **Clique, Enter ou Espaço**: o personagem ocupa a tela, os outros somem e aparece o formulário de login com o nome dele.
5. **Login** (`LoginForm.jsx`): o usuário já vem preenchido com o `id` do personagem; a senha é conferida no back-end (`POST /auth/login`). Se a conta que entrou não for a do personagem escolhido, o login é desfeito e aparece um erro.
6. **Senha inicial**: enquanto a conta tem `mustChangePassword`, o painel abre direto em "Crie sua senha" (`PasswordForm.jsx`), com a opção "Agora não" (volta a pedir no próximo login).
7. **Logado**: abre a **ficha do personagem** (ver abaixo), que ocupa a tela inteira no lugar da seleção.
8. "Trocar de personagem" (antes de logar) volta para a seleção; "Sair" (na ficha) faz logout e volta também. "Alterar senha" (na ficha) mostra o `PasswordForm` sobre a arte do personagem e, ao terminar, volta para a ficha.

A sessão (`{ token, username, mustChangePassword }`) fica no `localStorage` (`runarcana.session`). Ao recarregar, o app abre direto no personagem logado e confirma o token com `GET /auth/me`; se o servidor recusar (401), volta para a seleção. Servidor fora do ar não desloga.

Responsivo: abaixo de 760px os painéis empilham na vertical e a lore some. Com `prefers-reduced-motion` as animações e partículas são desligadas.

## Mestre: entrada e painel

- **Entrada**: botão **MESTRE** (coroa) no canto do cabeçalho da seleção, visível enquanto ninguém está logado. Abre o `MasterGate` (`components/master/MasterGate.jsx`): fundo escurecido com três anéis hextech girando e o `LoginForm` de sempre, usando um "personagem" `MASTER` (`id: 'mestre'`) definido no `App.jsx`. A troca da senha inicial do mestre aparece no mesmo portal (`PasswordForm`).
- **Sessão**: a resposta do login traz `master: true`; o `App` aceita sessão salva de mestre (não precisa estar em `CHARACTERS`) e, logado, mostra o `MasterPanel` no lugar da seleção. "Sair" volta para a seleção.
- **Painel** (`MasterPanel.jsx`): mesma moldura da ficha (barra do topo, cards, abas), com selo "MESTRE" e fundo dourado/turquesa sem arte. Abas:
  - **Documentos** (`MasterDocuments.jsx`): título, tipo (chips coloridos por tipo), destinatários ("Todos os jogadores" ou um ou mais, vindos de `GET /documents/recipients`; nomes de `CHARACTERS`), texto com a mesma formatação da leitura, link de imagem. "Escrever / Prévia": a prévia usa o `DocumentView` da ficha, então é exatamente o que o jogador vê. O botão diz para quem vai ("ENVIAR PARA RUDO"). À direita, os enviados com destinatários e "Apagar" com confirmação.
  - **Habilidades** (`MasterAbilities.jsx`): escolhe o personagem (cartões com a arte de `CHARACTERS` quando o nome bate), formulário (**ícone**, nome, tipo, círculo e escola/componentes só para magia, tempo, alcance, duração, dano validado com `parseDice`, usos — vazio = livre — e recarga, descrição), **prévia ao vivo** com o `AbilityDetail` da ficha e a lista do personagem com "Apagar". Depois de adicionar, o formulário limpa mas mantém o tipo e o círculo.
  - **Ícone** (`IconPicker.jsx`): "Enviar imagem" (ou arrastar e soltar no quadrado), "colar um link" ou "Remover". O arquivo (PNG/JPG/WebP/GIF até 8 MB) passa por `utils/iconImage.js` (`fileToIcon`): recorte quadrado central e redução para **128×128 WebP** num canvas, antes de ir para o back. GIF animado vira imagem parada. Na lista do personagem, clicar no ícone (`IconSwap`) troca a imagem de uma habilidade já cadastrada e o "×" tira (`PATCH .../icon`).
  - **Fichas** (`MasterSheets.jsx`): subida de nível. Escolhe o personagem (cartões com as classes e o nível) e monta o próximo nível: a classe (uma das que ele já tem, "Combatente 3 → 4", ou uma nova para multiclasse, com o pré-requisito no nome, e a subclasse dela), o **dado de vida** ("Rolar 1dX" ou digitar o que saiu na mesa), as escolhas do nível (o `ChoiceStep` e o `ResourceChoice` do assistente: Aprimoramento em cartões, aumento de atributo, Técnicas, magias...) e, nos níveis 5, 9, 13 e 17, as Heranças (`HeritageStep`). À direita, "O que muda": nível, PV máximo (e o ganho, que também entra no PV atual), proficiência, classes, atributos alterados, habilidades novas e o que falta; o botão aplica. Ficha sem `build` (criada sem o assistente) mostra o aviso. A prévia vem de `POST /character/{id}/level-up/preview` 220 ms depois de cada mudança. Helpers `levelChoices` (escolhas do nível, cada interna logo depois da que a criou), `keepChoices` e `HERITAGE_LEVELS` em `rules.js`.
  - **Inventário** (`MasterInventory.jsx`): escolhe o personagem; **Bolsa** com o ouro (salvar), a inspiração (liga/desliga) e os itens com +/− e Remover; **Dar item** busca no catálogo (`/creation/catalog`, até 40 resultados, com a quantidade) ou cria um item livre (nome, quantidade, peso, preço, raridade, descrição, efeito, consumível). Cada ação devolve o inventário salvo.
  - **Regras da mesa** (`MasterRules.jsx`): modo de traços da Runinata em cartões ("O jogador escolhe", Controlado, Moderado, Forte); clicar salva na hora (`PUT /creation/settings`) com aviso. Travado, a etapa Traços do jogador mostra só esse modo, desativado, com "O mestre definiu o modo da mesa".
- API em `api/master.js`; estilos em `styles/master.css` (usa também `sheet.css`).

## Criação de personagem (assistente)

Conta sem ficha: a ficha mostra "Ficha em branco" com **CRIAR PERSONAGEM**, que abre o `CreationWizard` (`components/creation/`) no lugar do conteúdo (o herói continua à esquerda). Ao criar, a ficha recarrega já pronta.

- **Etapas** (barra no topo, com losango ✓ quando a etapa está completa; dá para pular entre elas): Origem → Traços (só na Runinata) → Região → Classe → Passado (Região e Passado somem se o catálogo não tiver) → Atributos → Escolhas → Heranças → Detalhes. Atributos só fica ✓ depois de gastar algum ponto; Escolhas, depois de origem e classe definidas. O botão final é **CRIAR PERSONAGEM**, ativo só quando a prévia não tem erros.
- **Origem/Região/Classe/Passado** (`OptionStep.jsx`): cartões com descrição, `details` do livro (Idade, Tamanho…), fatos (dado de vida, deslocamento em pés, ouro), a lista do que concede (`grantLabel` em `rules.js`, cor por tipo) e etiqueta **EXEMPLO** nos itens provisórios. Origem e linhagem com `levels` ganham o bloco **Ao subir de nível** ("2º nível. Habilidade: Sopro Gélido").
- **Atributos** (`AttributeStep.jsx`): só os métodos ligados no catálogo. Compra de pontos com − / + , custo e barra de orçamento; arranjo padrão com seleção (cada valor uma vez); manual com campo e "Rolar 4d6 (descarta o menor)". Ao lado de cada atributo: bônus que veio das escolhas + total + modificador.
- **Escolhas** (`ChoiceStep.jsx`): as escolhas que a prévia pede (atributos/perícias à escolha), com contador e o aviso da prévia (`note`, ex.: a troca de magia opcional na subida de nível); perícias já ganhas não aparecem. No topo, **Equipamento inicial**: o da classe ou a **riqueza inicial** (`startingEquipment: WEALTH`). Escolhas de magia mostram o nome que vem na prévia (`optionNames`). Escolhas de equipamento mostram o nome dos itens (`equipmentOptionName` em `rules.js`) e, com mais de 6 opções, ficam agrupadas pela categoria do catálogo.
- **Recursos de classe** (`ResourceChoice.jsx`, escolhas `RESOURCE_CHOICE`): cartões no estilo das Heranças, com pré-requisito, execução, componentes, custo ◆ (Vel) e o texto ("Ver mais"), busca quando há mais de 6, e o aviso de quantas opções estão bloqueadas por pré-requisito. Com uma vaga, escolher outro troca; Vel conta pontos e é opcional. Um escolhido que deixou de valer aparece apagado, para remover. Os dados vêm de `catalog.resources`.
- **Escolhas** sem opções cadastradas aparecem tracejadas, só com o aviso, e não bloqueiam. A proficiência mista (`PROFICIENCY_CHOICE`) aparece em grupos: Perícias, Ofícios e Armas.
- **Subclasse**: quando a classe tem `subclasses` (Glifo do Arcanista, Cabala do Mercurial), os cartões aparecem logo abaixo da classe ("Escolha: Glifo (Arcanista)"), com os ganhos por nível; trocar de classe limpa a subclasse e a etapa só fica ✓ com as duas. A ficha em construção mostra a subclasse no título, armaduras, armas e ofícios com "(especialidade)"; as escolhas de especialidade em perícia ou ofício aparecem em grupos.
- **Linhagem**: quando a origem escolhida tem `lineages` (ex.: Minotauro), os cartões das tribos aparecem logo abaixo, na mesma etapa (`.lineage-step`); trocar de origem limpa a linhagem e a etapa só fica ✓ com as duas escolhidas.
- **Heranças** (`HeritageStep.jsx`, só aparece se o catálogo tiver Heranças): losangos com os pontos de cada tipo (gastos/total), filtro por tipo (Gerais, De Região, De Origem), busca e "Só as que posso escolher" (ligado por padrão). Cada cartão mostra tipo, pré-requisito, o texto (4 linhas, "Ler tudo" abre), o motivo quando não dá para escolher (vem do back), opção à escolha (ex.: tribo) e "Escolher de novo" quando `maxTimes` > 1. As escolhidas ficam no topo. Helpers `addHeritage`, `removeHeritage`, `setHeritageOption`, `heritageTimes` em `rules.js`.
- **Traços** (`TraitStep.jsx`, só quando a origem tem `usesTraits`): cartões dos modos (Controlado, Moderado, Forte, "combine com o mestre"), losangos de Traços Menores e Maiores (usados/vagas), pontos de Origem (sobra de total, com meio ponto) e o aviso quando o back converteu um traço do modo em pontos. Abas Menores, Maiores, Superiores e Desvantagens, busca e "Só os que posso escolher". Cada cartão mostra nível (ou pontos da desvantagem), pré-requisito, "Libera: a escolha de um Passado", o texto e, depois de escolhido, um campo por escolha quando o traço pede resposta (`detail`). A etapa Passado, sem o traço Antecedente, só avisa que a Runinata não tem Passado (e fica ✓). A ficha em construção mostra "Traços: N escolhidos · pontos de Origem". Helpers `addTrait`, `removeTrait`, `setTraitDetail`, `traitTimes`, `formatPoints` e `TRAIT_TIERS` em `rules.js`.
- **Detalhes** (`DetailsStep.jsx`): nome, jogador (vem com o usuário), idade, altura (aceita vírgula) e alinhamento.
- **Ficha em construção** (`BuildSummary.jsx`, à direita): atributos com bônus, PV (com o dado), deslocamento, ouro, tamanho, pontos de Herança (gastos de total), idiomas (só se houver), ofícios, resistências, perícias, passivas (com usos e dado já calculados) e o equipamento (ou a riqueza inicial) — cada uma com a fonte ("Origem: …", "Classe: …") — e a lista do que falta. Vem de `POST /creation/preview`, chamado 220 ms depois de cada mudança: **as contas são do back**, o front só mostra.
- `api/creation.js` (catálogo, prévia, criar); estilos em `styles/creation.css`.

A ficha também passou a mostrar **Origem**, **Deslocamento** (pés; com mais de um tipo, `SpeedToggle.jsx` vira um botão: clicar alterna entre caminhada, natação, escalada, voo e escavação, com o nome do tipo e "1/2". Também na ficha em construção), **Tamanho**, **Idiomas**, **Ofícios**, **Heranças** e **Pontos de Herança** a gastar no herói (os cinco últimos só quando existem); na aba **Magias**, as Heranças formam o grupo **Heranças** (tipo `HERITAGE`), "Passado" no lugar de "Antecedente" e o card **Resistências** (`SavingThrows.jsx`: mod. do atributo + proficiência da classe, clicável para rolar).

## Tela pós-login: ficha do personagem

`components/sheet/CharacterSheet.jsx` busca `GET /character/me`, `GET /documents/me` e `GET /notes` (`api/character.js`, `api/documents.js`, `api/notes.js`) e monta a ficha no estilo do cliente do League of Legends. Documentos e anotações não travam a ficha: se falharem, as abas ficam vazias.

- **Abas**: **FICHA**, **MAGIAS**, **INVENTÁRIO**, **DOCUMENTOS**, **ANOTAÇÕES** e **LIVRO**, com contador ao lado (em documentos, o contador é de **não lidos**, em vermelho pulsando). A aba fica em estado do `CharacterSheet` (não há roteamento). O herói aparece em todas no desktop; no celular só na Ficha.
- **Barra do topo**: logo e botão **ROLAR D20** (formato do "JOGAR" do cliente, mostra V/D quando há vantagem/desvantagem) à esquerda, abas no meio (rolam na horizontal se faltar espaço), ouro, nome e botões de alterar senha e sair à direita. No celular as abas vão para a segunda linha e o "Rolar d20" vira um botão hexagonal flutuante no canto (a barra perde o `backdrop-filter` ali, porque ele prenderia o `position: fixed`).
- **Fundo**: a arte do personagem desfocada e escurecida, brilho na cor `hue` dele, trama hextech dourada em losangos e partículas turquesa subindo.
- **Herói** (`SheetHero.jsx`): splash do personagem (vídeo, se houver) com cantos dourados, anel de nível (preenche até o 20, como a borda de ícone do invocador), classe com a subclasse ("Mercurial · Cabala do Ás Rúnico"), nome, região, barra de PV com uma marca a cada 10 PV (vermelha abaixo de 35%) e os **PV temporários** em azul depois dela ("8/11 +3"); **Alterar PV** (`HitPoints.jsx`) abre um campo com **Dano** (Enter; gasta os temporários primeiro), **Cura** (até o máximo) e **PV temp.** (troca pelo valor), salvos em `PATCH /character/me/hp` com atualização otimista e volta atrás se falhar (conta em `applyHp`, `rules.js`), a **Classe de Armadura** (`ArmorClass.jsx`: escudo com o valor, RD e a defesa em uso; clicar abre a lista de opções — sem armadura, CAs alternativas da origem, armaduras do inventário — e escolher uma chama `PATCH /character/me/defense`; com escudo no inventário, a parte **Escudo** ("Sem escudo" ou cada escudo com o bônus) chama `PATCH /character/me/shield`, e o rótulo mostra "Cota de Malha + Escudo Leve"; mostra os bônus somados e quando uma regra impede armaduras) e dados de identidade (inclusive Armaduras, Armas e ofícios com "(especialidade)"). A ficha em construção mostra a CA nos fatos.
- **Atributos** (`AttributeGrid.jsx`): seis hexágonos com o modificador em destaque e o valor embaixo.
- **Estatísticas**: proficiência, iniciativa (mod. de DES, clicável), percepção e intuição passivas, **dados de vida** (`nível`d`hitDie`; clicar rola 1 dado + CON) e inspiração (◆ acesa; clicar gasta).
- **Ouro** (`Purse.jsx`, na barra do topo): clicar abre **Gastar ouro** (de 1 até o que tem; fecha ao clicar fora ou com Esc). Só o mestre dá ouro.
- **Coluna direita da Ficha** (`OverviewTab.jsx`): Rolagens (com o seletor **Desvantagem / Normal / Vantagem**, que vale para todo teste de d20), **Habilidades** (barra rápida com até 5 ativas; clicar rola o dano ou abre a aba), **Documentos** (os 3 mais recentes, com selo NOVO) e **Anotação fixada** (ou a última editada).
- **Magias** (`AbilitiesTab.jsx`): habilidades, passivas e magias por círculo (truques primeiro). Ícone quadrado (`AbilityIcon.jsx`, o mesmo na aba, na barra rápida da Ficha e no painel do mestre) com a imagem enviada pelo mestre — ou a inicial, se não houver ou se o link quebrar — e borda na cor do tipo (dourado = habilidade, turquesa = passiva, roxo = magia); como no LoL, as 4 primeiras habilidades ativas ganham as teclas **Q/W/E/R** e as passivas **P** (a barra rápida da Ficha usa a mesma regra, `keysFor`). Usos em losangos: clicar num aceso gasta 1, num apagado recupera 1 (`PATCH`, com atualização otimista e volta atrás se falhar). Botões de **Descanso curto/longo** (também quando a ficha prepara magias, mesmo sem usos). Quem prepara (Acólito, Xamã; `GET /character/me/preparation`): o **Descanso longo** abre o `PrepareSpells.jsx`, com as opções de cada classe por círculo, o contador "1/1", busca quando há muitas e as atuais já marcadas; **Descansar** manda `prepared` junto com o descanso. Na lista, as magias que se preparam têm a marca "preparada" ou "não preparada" (estas ficam apagadas). Dano com botão para rolar a expressão ("2d8+4"). Dica ao lado com tempo, alcance, duração, componentes, escola, descrição e usos.
- **Documentos** (`DocumentsTab.jsx`): lista com selo na cor do tipo (carta, pista, mapa, lore, segredo, recompensa) e "NOVO"; filtro "Todos / Não lidos". Leitura num "pergaminho" com selo de cera, imagem (se houver) e texto com `## título`, `**negrito**` e `*itálico*` (`RichText`, sem HTML). Segredos ganham o carimbo CONFIDENCIAL. O documento mostrado é marcado como lido (uma chamada por documento, mesmo no StrictMode).
- **Livro** (`BookTab.jsx`, `api/book.js`): consulta do livro com busca pelo nome. Partes: **Magias** (558, filtro por nível; tempo, alcance, componentes, duração, texto e níveis superiores), **Rituais**, **Tabelas** e **Compêndio** (Familiares, Tecmaturgia, Aparatos). Lista à esquerda (até 80 por vez) e leitura à direita, no formato dos documentos; os dados vêm uma vez por abertura da aba (`/creation/spells`, `/compendium/rituals`, `/compendium`).
- **Anotações** (`NotesTab.jsx`): lista (fixadas primeiro) e editor com **salvamento automático** 700 ms depois de parar de digitar (e ao sair do campo ou trocar de nota), "Fixar" (vai para o topo e para o card da Ficha) e "Apagar" com confirmação.
- **Perícias** (`SkillList.jsx`): as 19 agrupadas pelo atributo; losango turquesa = proficiente, losango dourado duplo = especialidade (bônus de proficiência em dobro, já somado no valor); a ficha em construção marca "especialidade" na perícia; o maior bônus brilha; filtro "Todas / Proficientes".
- **Inventário** (`Inventory.jsx`, aba própria): casas quadradas como a loja do LoL, com a borda na cor da raridade (Comum cinza → Proibido vermelho), quantidade no canto, ícone SVG por tipo; filtro por tipo (Armas, Armaduras, Consumíveis, Objetos; os vazios ficam desativados). O item escolhido aparece ao lado, num painel no formato da dica de item (atributos, descrição, efeito, peso, preço); se o filtro esconder o escolhido, vale o primeiro visível. Embaixo: barra de carga = peso total / (FOR × 7,5 kg), laranja acima de 80%, e o valor estimado (soma de preço × quantidade). Com a coluna abaixo de 720px, o detalhe desce para baixo da grade e as casas vazias param em 12. O consumível escolhido mostra **USAR** (gasta 1; o back devolve a ficha).
- **Rolagens** (`DiceRoll.jsx`): clicar num atributo, perícia ou iniciativa rola d20 + bônus; com vantagem/desvantagem rola 2d20 e mostra o descartado riscado. Dano e dados de vida rolam a expressão e mostram cada dado. O dado gira e para no resultado; 20 natural acende em dourado ("CRÍTICO!"), 1 natural treme em vermelho ("FALHA CRÍTICA"). Atalhos: **R** rola um d20 puro, **Esc** fecha. As últimas 8 rolagens ficam no card "Rolagens" (só no navegador).
- **Estados**: carregando (hexágono girando), ficha inexistente (404, mensagem da API), erro com "Tentar de novo"; 401 desloga.

Os números que contam (bônus de perícia, proficiência, passivas) vêm prontos do back-end. `data/rules.js` (+ `.test.js`) só traduz os enums para PT (perícias, classes, regiões, alinhamentos, raridades, propriedades), formata (`+3`, `−1`, `67,5 kg`, datas) e calcula o que sai direto dos atributos ou dos dados (modificador, carga, d20 com vantagem/desvantagem em `rollCheck`, expressões "2d6+4" em `parseDice`/`rollDice`, agrupamento de habilidades).

Layout: 3 colunas acima de 1240px; 2 colunas (herói + conteúdo, rolagens embaixo) até 860px; 1 coluna no celular. Atributos e estatísticas usam **container queries** na coluna (`.sheet-col` é `container-type: inline-size`): com a coluna abaixo de 640px os hexágonos passam de 6 para 3 por linha (e as estatísticas de 6 para 3 abaixo de 680px), e o texto dos hexágonos escala em `cqi`, para a sigla não ser cortada pelas pontas. O CSS fica em `styles/sheet.css`, importado pelo `CharacterSheet`.

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
    ├── data/characters.js     lista de personagens + imports das artes
    ├── data/rules.js (+ .test.js)  rótulos em PT, formatação e regras derivadas dos atributos
    ├── components/
    │   ├── CharacterPanel.jsx painel de um personagem (imagem/vídeo, sombra, legenda, efeitos)
    │   ├── Separator.jsx      divisória dourada entre painéis
    │   ├── LoginForm.jsx      formulário de login do personagem escolhido
    │   ├── PasswordForm.jsx   troca de senha (senha atual, nova, confirmação)
    │   ├── effects/Embers.jsx brasas e calor (Gaudron)
    │   ├── effects/BloodMagic.jsx magia de sangue (Rudo)
    │   └── sheet/             ficha pós-login: CharacterSheet (abas e estado), SheetHero, OverviewTab, AttributeGrid,
    │                          SkillList, AbilitiesTab, AbilityIcon, Inventory, DocumentsTab, NotesTab, DiceRoll,
    │                          TabBar (abas com sublinhado deslizante), Num (número que conta), icons
    │   └── master/            MasterGate (portal de login), MasterPanel, MasterDocuments, MasterAbilities, MasterSheets, MasterRules
    ├── hooks/usePanelSprings.js  animação por mola (requestAnimationFrame)
    ├── hooks/useCountUp.js (+ .test.js)  número que conta até o valor; prefersReducedMotion
    ├── utils/motion.js        replay (reinicia animação de classe) e afterLeave (espera a saída)
    ├── utils/placeholderArt.js   gera um retrato SVG para quem ainda não tem arte
    ├── utils/iconImage.js (+ .test.js)  valida e reduz a imagem do ícone de habilidade para 128x128
    ├── styles/global.css      visual da seleção e do login (tokens em :root)
    ├── styles/sheet.css       visual da ficha
    ├── styles/master.css      botão, portal e painel do mestre
    ├── styles/motion.css      animações de polimento (importado por último no main.jsx)
    ├── api/master.js          rotas do mestre (personagens, habilidades, documentos, destinatários, subida de nível)
    ├── validation.js (+ .test.js)
    └── assets/characters/     rudo.jpg/.mp4, gaudron.jpg/.mp4
```

## Conexão com a API

`src/api/auth.js` chama `VITE_API_URL` (padrão `/runarcana`). Em `npm run dev`, o Vite repassa `/runarcana` para o Spring em `localhost:8080`, então **o back-end precisa estar rodando** para o login funcionar. Os erros mostrados vêm do campo `message` da API; sem servidor, aparece "Não foi possível falar com o servidor". As regras de senha são repetidas em `validation.js` (`validatePasswordChange`) só para avisar antes de enviar; quem decide é o back-end.

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

## Identidade visual

Tokens em `:root` (`global.css`): fundo `--bg #050b14`, painel `--panel #0a1626`, dourado `--gold #c8a24a` / `--gold-hi #f0c75e`, turquesa `--teal #2fd3c0`, texto `--text #e8dfc8`, apagado `--muted #8d97a8`. Fontes: **Cinzel** (títulos, nomes, botões) e **Spectral** (texto).

## Origem

A tela foi prototipada num `index.html` único (React via CDN, imagens e vídeo em base64, cerca de 12 MB) numa sessão anterior do Claude e depois portada para este projeto Vite. Ficaram de fora do porte:
- um efeito de "sangue escorrendo" (`BloodFx`) para o Rudo que estava no protótipo, mas não era usado. Depois o Rudo ganhou um efeito novo, a magia de sangue (`BloodMagic.jsx`, `fx: 'blood'`);
- o fallback que convertia vídeo base64 em Blob (não é necessário com arquivos de verdade).

## Pendências / problemas conhecidos

- Artes reais para Proto, Titan e Loge.
- Vídeos pesados (cerca de 8,5 MB e 7,2 MB) estão versionados no Git; vale comprimir ou passar para Git LFS/CDN.
- Ainda não há roteamento (react-router): as abas da ficha são estado local e não mudam a URL (recarregar volta para "FICHA").
- O jogador só gasta consumíveis, ouro e inspiração (decisão da mesa); quem dá é o mestre, na aba Inventário do painel.
- O painel do mestre ainda não edita habilidades/documentos já criados (só cria e apaga), não mostra quem leu cada documento e não edita fichas além da subida de nível e do inventário (PV atual, condições).
- Documentos e anotações só atualizam ao abrir a ficha (não há aviso em tempo real quando o mestre envia algo).
- Os itens usam ícones SVG genéricos por tipo; falta arte por item.
- O histórico de rolagens não é compartilhado com o mestre nem salvo.
- O token fica no `localStorage` (simples, mas acessível a scripts da página); se o projeto crescer, considerar cookie `HttpOnly`.
