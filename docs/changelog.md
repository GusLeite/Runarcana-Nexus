# Changelog

Entradas mais recentes no topo. Formato: `## AAAA-MM-DD — título (branch)`.
## 2026-11-03 — Barra de atalhos no canto direito e abas do cabeçalho que encolhem (`main`)
- A `.world-dock` agora vai por portal no `body` e fica no canto inferior direito (no painel do mestre o `backdrop-filter` do header a prendia no topo, sobre o logo). As abas do cabeçalho usam gap, fonte e espaçamento com `clamp()` e o modo compacto (`merchant.css`) vale até 2100px, para não serem cortadas ("MERCAD…").

## 2026-11-03 — Atalhos de lore, mapa e imprimir ficha numa barra flutuante (`main`)
- Saíram do cabeçalho e foram para a barra `.world-dock` no canto inferior esquerdo, recolhida por padrão (só o botão "Atalhos", para não cobrir a ficha); ao abrir mostra botões grandes, com rótulo, ouro (lore/mapa) e turquesa (imprimir ficha). Fecha ao escolher um. No celular, só ícones em coluna.

## 2026-11-03 — Modo "de onde vem" nos atributos, PV e ataques (`main`)
- Botão "i" na barra da ficha liga/desliga (lembrado no navegador): com ele ligado, passar o mouse (ou o foco) por um atributo, pelos PV ou por um ataque (e seus Estilos de Luta) mostra cada fonte do número.
- `GET /character/me/breakdown` refaz a conta pelo `build` guardado (`CreationService.breakdown`); o `Build` agora guarda a fonte de cada bônus de atributo (`bonusSources`) e de PV (`hpLabels`). O ataque se explica no front (`data/breakdown.js`).

## 2026-11-03 — Ficha física: Pulso Rúnico nas Runas (`main`)
- O Pulso Rúnico sai das passivas do verso e vai na linha "Pulso Rúnico" das Runas, com a pedra e o dado.
- No verso, a 1ª coluna fica com Habilidades, Passivas e Heranças; formas e magias com texto começam na 2ª.

## 2026-11-03 — Ficha física: habilidades, passivas e heranças só com o nome (`main`)
- No verso, Habilidades, Passivas e Heranças saem só com o título (usos e dano entre parênteses); formas e magias extras mantêm o texto.
- O texto que passa para a coluna seguinte quebra de novo na largura dela (antes encolhia a letra).

## 2026-11-03 — Ficha física em PDF (`main`)
- Botão da impressora na barra da ficha baixa a "Planilha Dupla 0.93" preenchida com os dados do personagem (`utils/printSheet.js`, `pdf-lib` carregado sob demanda).
- Fundo: as 2 páginas do PDF original em PNG 300 dpi (`public/ficha-fisica/`), porque o original vem cifrado. Texto que não cabe encolhe; magias além de 20 e os textos das habilidades vão para o verso.

## 2026-11-03 — Mapa: aviso quando faltam as texturas (`main`)
- No servidor real o mapa falhava com o aviso de WebGL: `public/map/` (fora do Git) não existia lá, e o Caddy devolvia `index.html` no lugar das texturas.
- `mapScene.js` marca a falha de textura (`code: 'textures'`) e o `MapScreen` mostra "O mapa ainda não foi instalado neste servidor"; o erro vai para o console.
- No servidor: `sh frontend/scripts/fetch-map-assets.sh` e depois `docker compose up -d --build`.

## 2026-11-03 — Arcanista prepara magias (`main`)
- O Arcanista passa a ter "Preparando Magias": prepara Inteligência + metade do nível de Arcanista (mínimo 1) entre as magias conhecidas, como o Xamã (`preparation` `KNOWN` no `criacao.json`). As conhecidas nascem não preparadas; fichas existentes são marcadas na próxima sincronização (`syncAbilities`).
- Limitação: o grimório (magias anotadas e não conhecidas) e a diferença descanso longo/pleno ainda não são modelados; a escolha é feita no descanso longo.

## 2026-11-03 — Itens: editar e anexar imagem (`feature/character-sheet`)
- O mestre edita o item de um jogador (nome, peso, preço, raridade, descrição, efeito) e anexa imagem por arquivo ou link, tanto num item existente quanto ao dar um item livre. Dar e tirar já existiam.
- Item do catálogo que outros também têm ganha uma cópia só da linha editada quando o texto muda; só a imagem vale para todos. `PUT /character/{id}/items/{entryId}`, `Item.image` (coluna nula), `ItemImageField.jsx`; o `ItemIcon` mostra a imagem.

## 2026-11-03 — Lore: imagem enviada no verbete (`feature/character-sheet`)
- No formulário do verbete o mestre envia uma imagem (arquivo) além de colar um link; prévia e **REMOVER**.
- Back: `LoreEntry.imageData` (coluna nova e nula) guarda a imagem enviada; link e imagem passam por `ImageRules`. Documentos do mestre continuam só com link.

## 2026-11-03 — Mapa: marcos 3D do original, lugares oficiais reais e desempenho (`feature/character-sheet`)
- Etapa 16: os 8 modelos 3D do mapa original (Disco Solar, Ixaocan, Monte Targon com o feixe de luz, Placídio, Vazio…) com texturas, posição e animação do original; `fetch-map-assets.sh` baixa para `public/map/landmarks/` (rode de novo no servidor).
- Catálogo oficial refeito com os dados reais do site: 99 lugares (Zirima, Disco Solar…), por tamanho (marcos/cidades/vilarejos aparecem conforme o zoom); lugares da versão anterior (inventada) saem sozinhos no próximo start.
- Desempenho: sem leitura de layout por pin a cada quadro, névoa que descarta cedo e resolução adaptativa quando cai abaixo de ~30 quadros por segundo.

## 2026-11-03 — Runa inicial junto do Pulso Rúnico (`feature/character-sheet`)
- Na etapa Escolhas, a Runa inicial aparece sempre logo abaixo do Pulso Rúnico (`orderChoices`), em vez de ficar separada por outras escolhas.

## 2026-11-03 — Escolhas que se roubam e especialidade das Heranças (`feature/character-sheet`)
- Escolher numa etapa uma perícia que outra escolha já tinha não trava mais a outra em "1 de 2": `dropStalePicks` tira o valor que saiu das opções e ela volta a ficar livre.
- Minucioso, Pés Cascudos, Alma da Caça, Instinto Assassino, Incentivo Celeste, Pastor da Montanha, Visão Lunar e Habilidade Símia ganharam `expertise`: a perícia que já tem continua na lista e vira especialidade.

## 2026-11-03 — Mapa: trajetórias dos jogadores (`feature/character-sheet`)
- Etapa 15 do plano: cada jogador desenha até 5 trajetórias no mapa (clica as paradas, nome opcional); linhas sólidas na cor do dono, privadas ao jogador e ao mestre, que vê as de todos e a prévia "Jogador".
- Novos: `MapRoute`, `MapRouteService`, `/map/routes`, `setRoutes` na cena 3D e `routeColors.js` (com testes).
- Com isso o pedido de ajustes do mapa (Etapas 12 a 15) está completo.

## 2026-11-03 — Mestre exclui ficha de personagem (`feature/character-sheet`)
- `DELETE /character/{id}` (só mestre) apaga a ficha com inventário, habilidades, perícias e regateios; a conta do jogador fica e ele recria o personagem pelo assistente.
- Aba Fichas do mestre: card **Excluir ficha** com confirmação no botão. Teste em `CharacterControllerTests`.

## 2026-11-03 — Humano completo e rótulos da criação sem texto cru (`feature/character-sheet`)
- Humano: +2/+1 em atributos e 3 pontos de Herança de Origem (antes só tinha os 2 de Região), como no livro.
- Construto: o painel explica que o Nebulon é a Herança de Origem Variante Nebulon.
- Criação: todos os tipos de concessão têm rótulo em português (sumiu o "EFFECT"); `visibleGrants` esconde efeitos mecânicos e o que depende de opção (a CA "Estilo de Luta: Defesa sem Armadura" do Combatente só vale escolhendo o estilo).
- `launch.json`: terceiro par de sandbox (8093/5178).

## 2026-11-03 — Mapa: lugares do mapa oficial com liga/desliga (`feature/character-sheet`)
- Etapa 14 do plano: catálogo de ~30 lugares oficiais (Disco Solar, Nashramae, Camavor, Icathia…) criado escondido no primeiro start; o mestre liga e desliga cada um, por região ou todos (`PATCH /map/pois/official/audience`), e move qualquer ponto com **MOVER**. Não se apagam.
- Posições são aproximadas; o catálogo está em `OfficialPlaces.java` para ampliar/corrigir.
- Novos: `OfficialPlaces`, `OfficialPlacesSeeder`, `OfficialPlacesPanel.jsx`; colunas `official_key` e `region_slug` em `map_poi` (nulas, o `ddl-auto` cria).

## 2026-11-03 — Mapa: informações e personagens por região (`feature/character-sheet`)
- Etapa 13 do plano: o painel da região mostra informações, conhecimentos liberados e os personagens e lugares ligados a ela (cada um abre o verbete). O mestre cria o verbete da região e personagens/lugares dela direto do mapa, com o formulário da lore já preenchido.
- Só front: reaproveita `LoreEntry.region` e `linked`.

## 2026-11-03 — Mapa: visual do Incognium e névoa mais escura (`feature/character-sheet`)
- Etapa 12 do plano: cabeçalho fixo com abas **Visão do mestre | Jogador** (o "Ver como" antigo), **+ Novo ponto** e **Compartilhar**; painel lateral escuro com rótulos em caixa alta e botões dourados; pontos e bandeira do grupo como anel de ouro.
- Névoa de guerra bem mais escura, opaca para o jogador. Plano ganhou as Etapas 13 a 15 (regiões com personagens, pontos oficiais com liga/desliga, trajetória dos jogadores).

## 2026-11-03 — Mapa: ver como jogador (`feature/character-sheet`)
- Etapa 11 do plano: seletor "Ver como" no mapa do mestre; mostra pontos, waypoints, névoa opaca e brasões "???" como aquele jogador vê, em modo só leitura com a faixa "Prévia de Nyx".
- Back: `GET /map/pois?as=` e `/map/waypoints?as=` (só mestre); a prévia não vaza notas secretas nem as anotações privadas do jogador.
- Com isso o plano do mapa (Etapas 7 a 11) está completo.

## 2026-11-03 — Mapa: links de locais (`feature/character-sheet`)
- Etapa 10 do plano: `?tela=mapa&ponto=12` (e `&regiao=demacia`) abre o mapa voando até o lugar, inclusive com o mapa já aberto; o foco sai da URL ao fechar.
- Botão **COPIAR LINK** nos painéis de ponto e de região; link colado em diário, comentários, documentos ou lore vira o botão "📍 Ver no mapa".
- Novos: `utils/mapLink.js` (com testes), `CopyLinkButton.jsx`, `MapLinkText.jsx`.

## 2026-11-03 — Mapa: o que aconteceu ali (`feature/character-sheet`)
- Etapa 9 do plano: entradas do diário podem apontar um local (`JournalEntry.poi`); o painel do ponto mostra "Aconteceu aqui" (entradas, eventos e paradas da trilha perto dele) e deixa escrever no diário dali mesmo.
- No diário, a entrada ligada tem o botão **📍 nome**, que abre o mapa voando até o ponto (`openMapAt`; a base do link `?tela=mapa&ponto=` já funciona, a Etapa 10 completa).
- Quem não vê o ponto não recebe nem o nome dele pelo diário. Rota nova: `GET /map/pois/{id}/history`.

## 2026-11-03 — Mapa: imagens e notas secretas no ponto (`feature/character-sheet`)
- Etapa 8 do plano: galeria de até 6 imagens por ponto (arquivo ou link), notas que só o mestre lê e **MOSTRAR À MESA**, que abre a imagem em tela cheia para os jogadores que veem o ponto.
- Seis tipos novos: posto avançado, esconderijo, ruína, acampamento, masmorra, porto (o `CHECK` do `kind` no PostgreSQL precisa do `ALTER TABLE` em `backend-api.md`).
- Novos: `ImageRules` (validação de imagem compartilhada com o mercador), `PoiGallery.jsx`, rotas `/map/pois/{id}/images` e `/spotlight`.


## 2026-11-03 — Mapa: revelar o ponto na hora certa (`feature/character-sheet`)
- Etapa 7 do plano: botões **REVELAR AO GRUPO**, **ESCONDER** e "Só a:" no painel do ponto (`PATCH /map/pois/{id}/audience`).
- O jogador vê o ponto brotar no mapa sem reabrir (consulta a cada 5 s) e recebe aviso na ficha (`GET /map/pois/visible`).
- Diário ganha o evento `PLACE` (nome só quando é para todos); contadores de pontos e revelados para o mestre.

## 2026-11-03 — Plano do mapa de campanha (`feature/character-sheet`)
- `plano-jogo.md` ganha as Etapas 7 a 11: o que o Incognium tem e o projeto não (revelar na hora, imagens e notas secretas no ponto, histórico do local, links de locais, ver como jogador). Transmissão, Wiki, Markdown e várias campanhas ficaram de fora por decisão.

## 2026-11-03 — O grupo no mapa: marcador, trilha e névoa (`feature/character-sheet`)
- Marcador do grupo que o mestre arrasta; todos veem em até 3 s, e ele anda até o lugar novo.
- Trilha da viagem: linha dourada tracejada sobre o relevo, com as paradas (`PartyTrailPoint`).
- Névoa de guerra por região: o mestre liga e revela cada uma; ao revelar, a névoa some com um brilho dourado.
- Novos: `MapPartyService`, `/map/party`, `/map/fog`, `partyLayers.js`.

## 2026-11-03 — Diário do grupo e resumo das sessões (`feature/character-sheet`)
- Aba **DIÁRIO** na ficha e no painel do mestre: crônica que todos escrevem (cada um edita a sua; o mestre, tudo).
- Eventos entram sozinhos: loot e ouro dados pelo mestre, queda a 0 PV, documento novo (sem o título se for secreto ou só para alguns) e subida de nível.
- "Resumo das sessões": um cartão por dia com quem jogou, itens, ouro, quedas e documentos.
- Novos: `JournalEntry`, `JournalService`, `/journal`.

## 2026-11-03 — Mercador com pechincha (`feature/character-sheet`)
- O jogador pechincha uma vez por abertura da loja, com Persuasão (segura) ou Enganação (rende mais, mas qualquer falha irrita); o back rola contra a CD do mercador (padrão 15, 0 = não pechincha).
- O resultado muda só os preços de compra dele (de −25% a +25%) até a loja fechar; o mestre vê as pechinchas no Movimento.
- Novos: `MerchantHaggle`, `Merchant.haggleDc` (coluna nula, o `ddl-auto` cria sozinho), `POST /merchants/active/haggle`, `GET /merchants/{id}/haggles`.

## 2026-11-03 — Abas na URL e cerimônia de subida de nível (`feature/character-sheet`)
- A aba da ficha e a do painel do mestre ficam na URL (`?aba=`), e o mapa/lore aberto em `?tela=`: recarregar volta ao mesmo lugar e o "voltar" do navegador funciona (hook `useUrlParam`, sem react-router).
- Ao subir de nível, uma cerimônia: o anel enche até o nível novo, o número vira, raios e faíscas, e o resumo do que foi ganho (`levelUpGains`).
- Quando o mestre libera um nível, a ficha avisa com som e mensagem.

## 2026-11-02 — Mapa: domos roxos dentro do globo vermelho (`feature/character-sheet`)
- Os seis domos de distorção ficam menores (raio de 14 a 26) e todos dentro do globo demoníaco; um teste garante isso.

## 2026-11-02 — Mapa: domo demoníaco menor e menos corvos (`feature/character-sheet`)
- O domo fica com raio 140 e altura 83 (a metade do anterior, depois 50% maior), e os corvos caem para 12, em 3 bandos.

## 2026-11-02 — Mapa: domo redondo e corvos menores (`feature/character-sheet`)
- O globo demoníaco vira um círculo de raio 185, ainda só sobre o deserto.
- Os corvos ficam com menos da metade do tamanho.

## 2026-11-02 — Mapa: globo vira domo oval sobre o deserto (`feature/character-sheet`)
- O globo volta a ser um domo liso, oval e menor, só sobre o deserto de Shurima, cobrindo os domos de distorção.
- Ele não chega mais aos brasões vizinhos (Ixtal, Targon, Piltover e Zaun, Vazio).

## 2026-11-02 — Mapa: corvos detalhados (`feature/character-sheet`)
- Penas desenhadas em textura: rêmiges, "dedos" abertos na ponta da asa, coberteiras em escamas e cauda em cunha.
- Corpo mais encorpado, bico longo e olhos em brasa; pretos com brilho azul-violeta.
- Voo com asa que recolhe na subida, planeio, trajeto irregular e mergulhos.

## 2026-11-02 — Mapa: globo menor e corvos novos (`feature/character-sheet`)
- O globo passa a seguir a fronteira de Shurima, sem invadir as regiões vizinhas.
- Corvos remodelados, com corpo, bico, olhos em brasa, penas e asas articuladas, voando em 5 bandos.

## 2026-11-02 — Mapa: globo demoníaco sobre Shurima (`feature/character-sheet`)
- Cúpula vermelha sobre toda a região, com veias que pulsam e 42 corvos em órbita.
- Os domos de distorção perdem a rede e ficam lisos.

## 2026-11-02 — Mapa: domos de distorção temporal em Shurima (`feature/character-sheet`)
- Seis cúpulas 3D roxas no deserto, com relógio no chão e poeira presa no tempo.
- Cada domo tem o próprio ritmo de tempo, e um deles corre ao contrário.

## 2026-11-02 — Lore, pontos de interesse e waypoints (`feature/character-sheet`)
- Nova tela de lore, inspirada na página do Azir: o mestre escreve personagens, lugares e regiões e libera cada conhecimento por personagem.
- O mestre cria pontos de interesse clicando no mapa; os jogadores deixam anotações ou comentários neles e têm até 3 waypoints.
- Lore e mapa levam um ao outro. Rotas `/lore`, `/map/pois` e `/map/waypoints`, com tabelas novas criadas pelo `ddl-auto`.

## 2026-11-02 — Mapa: Bandópolis por rolagem de dado (`feature/character-sheet`)
- O mestre rola um d10 no mapa; o servidor sorteia, guarda e todos veem Bandópolis na mesma região.
- Rotas `GET /map/bandle` e `POST /map/bandle/roll`, sem tabela nova (usa `TableSetting`).
- Brasão dourado próprio, colorido no destaque, cartão e painel como as outras regiões.

## 2026-11-02 — Mapa: moldura nítida e brasão dourado do Vazio (`feature/character-sheet`)
- A moldura de Piltover e Zaun passa a ser desenhada por código em 2048 px, sem a imagem de 128 px do original.
- O brasão do Vazio em repouso ganha desenho próprio, no estilo dos brasões dourados das outras regiões.

## 2026-11-02 — Mapa: moldura em pé e Vazio como região (`feature/character-sheet`)
- A moldura de Piltover e Zaun fica de frente para a câmera, com os ícones no mesmo plano, e a inclinação passa ao valor do original (0,75).
- O Vazio ganha brasão, destaque roxo e painel, e aparece de longe e de perto.
- O cartão da região sobe para o alto da tela, e a vista inicial desce um pouco para o brasão do Vazio caber.

## 2026-11-02 — Mapa: Piltover, Zaun, Vazio e brasões originais (`feature/character-sheet`)
- De perto, Piltover e Zaun se separam dentro da moldura original, e aparecem O Vazio e o nome Icathia.
- Brasões dourados do original, que ficam coloridos no destaque; `fetch-map-assets.sh` baixa `crests/` e `pins/`.

## 2026-11-02 — Mapa: nomes em português (`feature/character-sheet`)
- Os blocos detalhados passam a ser a versão `pt_br` do original; `fetch-map-assets.sh` baixa essa versão.
- O brilho do mar deixa de formar quadradinhos de perto.

## 2026-11-02 — Mapa: nitidez de perto e cartão da região (`feature/character-sheet`)
- 27 blocos detalhados do original cobrem as terras ao aproximar, baixados conforme a vista.
- O cartão da região passa a ficar por cima dos brasões e nomes.

## 2026-11-02 — Mapa: regiões (`feature/character-sheet`)
- 10 brasões nas posições do original, com a arte que a criação já usa; aparecem com o mapa visto de longe.
- Passar o mouse acende a região no terreno; clicar voa até ela e abre um painel com vídeo e descrição.
- `fetch-map-assets.sh` baixa também os destaques das regiões.

## 2026-11-02 — Mapa: nuvens e mar como no original (`feature/character-sheet`)
- Nuvens e névoa passam a usar as texturas originais, mais fortes que lá; a ondulação do mar saiu e fica só o brilho ao aproximar.
- `fetch-map-assets.sh` baixa também `clouds`, `fog` e `fog-mask`.

## 2026-11-02 — Mapa: bordas, mar e nuvens (`feature/character-sheet`)
- Vinheta escura e terreno fundido ao fundo no lugar das barras azuis; o arraste horizontal não passa da borda do mapa.
- Água que ondula, nuvens que deslizam e névoa sobre o gelo, geradas por shader.

## 2026-11-02 — Mapa 3D de Runeterra (`feature/character-sheet`)
- Botão na ficha e no painel do mestre abre o mapa em tela cheia, com Three.js carregado só ao abrir.
- Relevo real, entrada animada, zoom com inclinação, arraste com inércia, foco de miniatura e brilho no mar, imitando o original.
- Texturas da Riot fora do Git: `frontend/scripts/fetch-map-assets.sh` precisa rodar no servidor antes do build.

## 2026-11-02 — APK aponta para o endereço real do site (`feature/character-sheet`)
- O app passa a abrir `https://runarcana-nexus.duckdns.org`; o endereço anterior não existia no DNS.

## 2026-11-02 — APK Android que abre o site (`feature/character-sheet`)
- Capacitor em `frontend/`: o app é uma janela para `https://runarcana.duckdns.org`, sem embutir o front, com tela própria sem conexão.
- `npm run apk` gera `frontend/dist-apk/Runarcana.apk` (cerca de 6 MB); ícone recortado da capa do livro.
- Ferramentas e chave de assinatura ficam em `E:\AndroidBuild`, fora do repositório.
- Não testado em aparelho, e o domínio ainda não existe no DNS.

## 2026-11-02 — Deploy passa da Oracle para VPS paga (`feature/character-sheet`)
- A Oracle ficou sem capacidade de Ampere A1 em São Paulo; hospedagem escolhida: Hetzner CAX11, com guia em `docs/deploy-vps.md`.
- `deploy/setup-oracle.sh` virou `deploy/setup-server.sh` e também funciona como root.
- Ainda não testado num servidor real.

## 2026-11-02 — Preparação do deploy na Oracle Cloud (`feature/character-sheet`)
- Hospedagem escolhida: Oracle Always Free com DuckDNS; passo a passo em `docs/deploy-oracle.md`.
- `deploy/setup-oracle.sh` prepara a VM (firewall, Docker, rclone) e `deploy/backup-offsite.sh` copia os dumps para fora do servidor.
- Ainda não testado num servidor real.

## 2026-11-02 — Funções e descrições dos personagens (`feature/character-sheet`)
- Gaudron passa a se chamar Galdren na tela (nome e grito da torcida); o id/usuário da conta continua gaudron.
- Tela de seleção: Rudo (Arcanista, mago hemomante), Galdren (Bruto, minotauro de Noxus), Proto (Combatente, construto de Piltover) e Loge (Mercurial, assassino louco e alcoólatra) com novas funções e descrições em `frontend/src/data/characters.js`.

## 2026-11-02 — Som em todo o site (`feature/character-sheet`)
- Ficha e painel do mestre usam sons de interface suaves e arredondados (pop de bolha, acorde macio), sem ruído agudo.
- Motor de áudio sintetizado (Web Audio, sem arquivos) em `src/audio/`: hover e clique em todos os controles, aba = página virando, apagar = golpe grave, erro/aviso, digitação com pena nas anotações.
- Cada personagem tem a sua assinatura na seleção (forja, coração, magia, assombração); dado chacoalha e cai, com sons próprios para 20 e 1 natural; PV, magias, descansos, moedas, poções, subida de nível e criação também soam.
- Controle de efeitos e volume no canto, guardado no navegador. (A música de fundo foi feita e depois removida a pedido.)

## 2026-11-02 — Anotações em forma de diário (`feature/character-sheet`)
- Aba Anotações redesenhada como diário medieval: capa de couro verde, índice à esquerda e folha pautada com margem vermelha à direita, selo de cera para fixadas e botão "Nova página". A lógica (salvamento automático, fixar, apagar) não mudou.

## 2026-11-02 — Inventário em forma de bolsa (`feature/character-sheet`)
- Aba Inventário redesenhada como bolsa de couro: aba com fivela e filtros, bolsos com brilho de raridade, cinto de carga e etiqueta de pergaminho para o item escolhido.
- Novos ícones SVG (`ItemIcon.jsx`, 16 desenhos escolhidos pelo nome do item), usados também na loja do mercador.

## 2026-11-02 — Grimório na aba Magias (`feature/character-sheet`)
- Saem as teclas Q/W/E/R/P (herança do LoL): a magia mostra o selo do círculo (T, 1, 2…) e o formato do ícone diz o tipo: **quadrado = habilidade, redondo = passiva, arco = magia**.
- Aba Magias vira um **grimório aberto**: índice com filtros à esquerda (busca, tipo, círculo, escola, tempo de conjuração, preparadas, causa dano, concentração, com usos) e a página da magia à direita, com virada de página, capitular e folio.
- Botão "Descanso longo · preparar magias" deixa claro onde se escolhem as magias preparadas.

## 2026-11-02 — Preparação para produção (`feature/character-sheet`)
- Segurança: credenciais do banco por variável de ambiente, senhas iniciais aleatórias (mestre por `RUNARCANA_MASTER_PASSWORD`), rotas antigas só para o mestre e limite de 10 senhas erradas por endereço.
- Mestre: aba **CONTAS** gera a senha provisória do jogador; a troca da senha provisória deixa de poder ser adiada.
- Deploy: perfil `prod`, Dockerfiles, `docker-compose.yml` (PostgreSQL, API, Caddy com HTTPS) e backup diário. Jar conferido no perfil `prod` em banco temporário; as imagens Docker ainda não foram construídas.

## 2026-11-02 — Mercadores (`feature/character-sheet`)
- Mestre: aba **MERCADORES** monta lojas (imagem, fala, itens, preço, estoque, % pago na venda), abre uma por vez e mostra o movimento.
- Jogador: com a loja aberta surge a aba **MERCADOR** (em até 5 s), para comprar com o ouro e vender da mochila; o que é vendido vai para a prateleira.
- Back: `/merchants`, tabelas novas (`merchant`, `merchant_item`, `merchant_trade`, criadas pelo `ddl-auto`). Testes: `MerchantControllerTests`; conferido no sandbox.

## 2026-11-02 — Jogador de teste do mestre e card de novo jogador (`feature/character-sheet`)
- Mestre: botão **TESTAR COMO JOGADOR** abre a ficha/criação da conta `teste` (sessão própria, volta ao painel pelo botão de sair). Seleção: card **+ NOVO JOGADOR** (pede a senha do mestre) cria contas novas, que aparecem como painéis com retrato gerado.
- Back: `POST /auth/test-player`, `GET|POST /auth/players`, coluna `account.custom`.

## 2026-11-02 — Brasões das regiões (`feature/character-sheet`)
- Etapa Região mostra o brasão de cada região na legenda (grande) e nas miniaturas (pequeno); arte em `assets/region-icons/`, ligada por `icon` em `regionArt.js`.

## 2026-11-02 — Heranças: limite de pontos por tipo (`feature/character-sheet`)
- Corrigido: dava para escolher Heranças além dos pontos (limite era o total, não o do tipo; cliques rápidos passavam da prévia). Agora conta por tipo e espera a prévia.

## 2026-11-02 — Repaginada das Heranças (`feature/character-sheet`)
- Linhas com medalhão e cor por tipo, cartões de pontos, faixa das escolhidas, filtros com contagem e interruptor; bloqueadas mostram só o motivo.

## 2026-11-02 — Escolhas: tamanho, gemas e cards (`feature/character-sheet`)
- Silhueta no tamanho, cor/símbolo por gema no Pulso Rúnico, Runa inicial filtrada pelo Pulso, cards com descrição de ofícios e magias ao passar o mouse.

## 2026-11-02 — Polimento visual da etapa Escolhas (`feature/character-sheet`)
- Cartões com medalhão e símbolo por tipo de escolha, gemas de progresso, opções em azulejos e resumo geral no topo; recursos de classe e equipamento inicial seguem o mesmo padrão.

## 2026-11-02 — Opção "Dados reais" nos atributos (`feature/character-sheet`)
- Novo método na tela: digitar os valores rolados na mesa, travados entre o mínimo e o máximo do catálogo.

## 2026-11-02 — Rolagem de atributos por pedras (`feature/character-sheet`)
- Manual/rolagem: cada rolagem dá 6 valores que o jogador arrasta para os atributos; campo livre removido (não dava para limitar). Máx. 3 rolagens.

## 2026-11-02 — Tela de atributos animada (`feature/character-sheet`)
- Arranjo padrão agora é arrastar os valores (pedras) até os atributos; manual rola 4d6 com dado 3D e no máximo 3 rolagens.
- Linhas com barra de progresso, animações de entrada/pop e destaque ao soltar. Não verificado visualmente no navegador (só testes e build).

## 2026-11-02 — Artes trocadas entre passados (`feature/character-sheet`)
- Marujo e Pirata trocaram de imagem; o Yasuo foi para o Exilado e o lutador pendurado na caverna para o Soldado.

## 2026-11-02 — Arte do Religioso e do Gladiador (`feature/character-sheet`)
- Chegaram as 2 imagens que faltavam: Diana com os monges da lua no Religioso e o guerreiro dourado no Gladiador. Agora os 22 passados têm ilustração.
- A imagem do brutamontes de cartola, que estava no Gladiador, ficou em `assets/backgrounds/_reserva/` (fora do `glob`, sem uso).

## 2026-11-02 — Ilustrações em 21 passados (`feature/character-sheet`)
- 21 imagens em `assets/backgrounds/<id>.webp` (≈3,6 MB), escolhidas pela cena de cada uma; `backgroundArt.js` lê a pasta com `import.meta.glob`, então um arquivo novo aparece sozinho. Só o Religioso ficou sem arte (continua com o símbolo). O Andarilho trocou o exemplo pela imagem do explorador; a da aldeia em chamas foi para o Órfão.
- Enquadramento conferido numa folha de contato com as 21; o card inteiro dentro do assistente não foi aberto (exige login).

## 2026-11-02 — Arte de exemplo no Andarilho (`feature/character-sheet`)
- `backgroundArt.js`: `BACKGROUND_IMAGES` (por id) e `backgroundImage()`; o `BackgroundPicker` mostra a ilustração como faixa no topo do card quando o passado tem uma. Só o Andarilho tem, como exemplo (`assets/backgrounds/andarilho.webp`); os outros seguem só com o símbolo.

## 2026-11-02 — Card do Passado maior (`feature/character-sheet`)
- `background.css`: o painel de detalhe ganha mais largura (grade 1 : 1,35), mais altura e a história passa a 16px com entrelinha 1,65, para ler melhor.

## 2026-11-02 — Detalhe do Passado sem rolar até os ganhos (`feature/character-sheet`)
- `BackgroundPicker`: o painel tem altura fixa; medalhão ao lado do nome, bloco **O que concede** (ouro e ganhos) logo abaixo e a **História** numa área própria que rola sozinha. Antes o texto longo empurrava os ganhos para o fim.

## 2026-11-02 — Passado com símbolos (`feature/character-sheet`)
- Nova `BackgroundPicker`: grade com um símbolo SVG por passado (22, em `backgroundArt.js`) e painel de detalhe com medalhão, descrição, `details`, ouro e concessões; passar o mouse mostra, clicar escolhe. Em tela estreita o detalhe desce para baixo da grade.
- `OptionStep` removido (só servia ao Passado). Teste garante um símbolo por passado do catálogo. Conferido numa página de teste com o catálogo real; a etapa dentro do assistente não foi aberta (exige login) e o recuo para uma coluna não foi testado visualmente.

## 2026-11-02 — Símbolo da Honra do Belator (`feature/character-sheet`)
- `subclassArt.js`: o sigilo do Belator vira um estandarte de guerra (o anterior, um elmo liso, parecia outra coisa).

## 2026-11-02 — Subclasses cabem na tela sem rolar (`feature/character-sheet`)
- A aba de subclasses não rola mais: a grade fica compacta (símbolo ao lado do nome, sem título) e o detalhe ocupa o resto da altura, rolando por dentro se for longo. Sem nada sob o mouse nem escolhido, mostra a primeira opção.
- Corrigido "Glifo Glifo Escarlate" / "Rito Rito das Estrelas" no destaque e no título dos ganhos: agora só o nome da subclasse.

## 2026-11-02 — Escolha de subclasse com símbolos (`feature/character-sheet`)
- Nova `SubclassPicker`: grade de símbolos (45 sigilos, um por rito/glifo/trilha/…, em `subclassArt.js`) e detalhe da opção embaixo, com descrição, ganhos e níveis; passar o mouse mostra, clicar escolhe. Substitui os cartões longos do `OptionStep` nessa aba.
- Teste garante um sigilo por subclasse do catálogo. Conferido numa página de teste com os dados reais; o destaque da classe em si não foi aberto (exige login).

## 2026-11-02 — Rosto de cada classe no centro do painel (`feature/character-sheet`)
- `classArt.js`: o `focus` passa a mirar o rosto, não o corpo, no quadro que fica parado antes da expansão (o primeiro do vídeo). Conferido simulando a faixa de 208×650 do painel com a mesma conta do `FocusVideo`.
- Arcanista (0,84) e Atirador (0,745): o rosto está bem à direita no quadro (a primeira conta tinha mirado o tronco); com isso os dois aparecem no centro, sem precisar de `start`.

## 2026-11-02 — Símbolos e animações do Bruto e do Mercurial (`feature/character-sheet`)
- Bruto: o sigilo vira um machado grande e a animação troca as garras por um machado que desce, racha o chão (onda, clarão, estilhaços) e faz a tela tremer.
- Mercurial: o sigilo vira um capuz de ladino; a animação mostra o capuz saindo da fumaça, os olhos acendendo, dois cortes em X e ele sumindo no escuro (sem as adagas voando).
- Conferido quadro a quadro numa página de teste; o salão em si não foi aberto (exige login).

## 2026-11-02 — Classes centralizadas e sem zoom (`feature/character-sheet`)
- `classArt.js`: tiramos `show` e `focusNarrow` (mesmo fix das origens: o vídeo não encolhe para depois crescer) e reajustamos o `focus` de cada classe a partir de quadros dos vídeos; o do Arcanista estava em 0,4 e o personagem fica perto de 0,66.
- Conferido por quadros dos vídeos e testes; a tela não foi aberta, pois exige login.

## 2026-11-02 — Região renomeada para Bandópolis (`feature/character-sheet`)
- "Cidade de Bandle" vira "Bandópolis" em `rules.js` e `criacao.json`; o id `BANDLE_CITY` não muda.

## 2026-11-02 — Seleção e salões mais leves (`feature/character-sheet`)
- Fim do loop de molas (`usePanelSprings`): os painéis da seleção animam só por CSS, e os vídeos dos painéis apagados pausam com outro aceso.
- Gaudron: arena de tamanho fixo, menos partículas e gradientes em 1/4 do tamanho. Nos salões, só o vídeo do painel aceso toca; sem `backdrop-filter` no destaque.
- Medido no painel do Claude: de 5 para cerca de 100 fps na martelada. Resta 1 s de atraso no primeiro quadro (ver pendências).

## 2026-11-02 — Origens só expandem ao passar o mouse (`feature/character-sheet`)
- `originArt.js`: todas seguem o padrão do Humano, sem `show` e sem `focusNarrow`; o vídeo mantém o tamanho e o personagem não sai do lugar.

## 2026-11-02 — Vídeos da seleção em 720p (`feature/character-sheet`)
- `assets/characters/`: de ~34 MB para ~15 MB nos quatro vídeos, de 1080p para 720p, sem mudar duração nem fps.

## 2026-11-02 — Animação de hover por classe (`feature/character-sheet`)
- `ClassFx.jsx` e `classfx.css`: Acólito (luz e halo), Arcanista (círculo e nova), Atirador (mira e tiro), Bodisatva (lótus e Ki), Brutamontes (garras), Caçador (pegadas e flecha), Combatente (espadas), Mercurial (adagas e fumaça) e Xamã (chama e espíritos).

## 2026-11-02 — Etapa Classe vira salão com vídeos (`feature/character-sheet`)
- `ClassStep.jsx` e `ClassStage.jsx`: o salão de painéis da Origem agora é usado nas 9 classes, com um vídeo por classe (`assets/classes/`, `data/classArt.js`), efeito de hover igual ao das origens e destaque com abas (ganhos, habilidades, níveis, subclasse, sobre).
- A subclasse passou para dentro do destaque; `OptionStep` ficou só para o Passado. `OriginArt` aceita `art.sigil`.

## 2026-11-02 — Setas do destaque não repetem a abertura (`feature/character-sheet`)
- `OriginStage.jsx`: a animação de entrada roda só ao abrir o destaque. Antes, cada seta mudava o `startId` e o painel voltava a crescer a partir do cartão.

## 2026-11-02 — Linhagens ganham vitrine com a imagem em destaque (`feature/character-sheet`)
- `OriginStage.jsx`: `LineageShowcase` troca os cartões por imagem grande e inteira, miniaturas e detalhes logo abaixo. O mouse ou o foco mostram a linhagem; o clique escolhe.
- `origin.css`: estilos `olineage-*` refeitos; a aba Linhagens encosta nas bordas (`.ostage-body.flush`).
- `lineageArt.js`: sai `LINEAGE_CONTAIN`, porque toda imagem em destaque já aparece inteira; `LINEAGE_POS` agora só ajusta a miniatura.

## 2026-10-30 — Etapa Região vira carrossel em tela cheia (`feature/character-sheet`)
- `RegionStep.jsx` e `styles/region.css`: região em tamanho grande, com setas, teclado, toque e miniaturas; a escolha é confirmada num botão.
- `assets/regions/`: 12 vídeos comprimidos de 112 MB para ~23 MB (loops de até 10 s, sem áudio) e imagens de Nazumah e do Vazio. `data/regionArt.js` traz as descrições breves, provisórias.
- `useHallTop.js` sai do `OriginStep` para os dois salões usarem.

## 2026-10-30 — Imagens do Yordle: as 29 linhagens ilustradas (`feature/character-sheet`)
- `assets/lineages/`: aquatico, feerico e felpudo (.webp, 90 a 225 KB), no enquadramento padrão. Com elas, todas as linhagens têm imagem (~4,4 MB no total).

## 2026-10-30 — Imagens da Vastaya (`feature/character-sheet`)
- `assets/lineages/`: oovi-kat, marai, shimon, fauhwoon, ottrani, kiilash, lhotlan e vesani (.webp, 100 a 235 KB cada), no enquadramento padrão. Conferidas com as descrições de cada linhagem (Neeko, Nami, Wukong, Lillia, Rengar, Xayah e Rakan, Ahri).

## 2026-10-30 — Imagens dos Trolls (`feature/character-sheet`)
- `assets/lineages/`: troll-areia.webp, troll-gelo.webp e troll-selva.webp (190 a 300 KB), no enquadramento padrão.

## 2026-10-30 — Nova imagem do dragão da Montanha (`feature/character-sheet`)
- `assets/lineages/montanha.jpeg` (1100×550, 126 KB) no lugar da faixa baixa de 737×192; continua em `LINEAGE_CONTAIN`, então o dragão aparece inteiro.

## 2026-10-30 — Montanha: imagem inteira, sem cortar (`feature/character-sheet`)
- `LINEAGE_CONTAIN` em `data/lineageArt.js`: a imagem da Montanha (faixa 737×192) aparece inteira no cartão, com o espaço que sobra preenchido por uma versão desfocada dela; o `LINEAGE_POS` dela saiu.

## 2026-10-30 — Imagens dos Meios-Dragões (`feature/character-sheet`)
- `assets/lineages/`: glacial.webp, infernal.webp, montanha.png, nuvens.webp e oceano.webp (45 a 215 KB). A da Montanha é uma faixa de 737×192, provisória: `LINEAGE_POS` (40% 50%) mostra o trecho do dragão; falta trocar por uma imagem melhor.

## 2026-10-30 — Imagens dos Chireanos (`feature/character-sheet`)
- `assets/lineages/`: nocti.webp e fulgor.png (180 e 240 KB). A do Fulgor é vertical e pequena (507×594): `LINEAGE_POS` sobe o recorte (50% 6%) para o rosto aparecer.

## 2026-10-30 — Imagens do Antroplantæ (`feature/character-sheet`)
- `assets/lineages/`: arboreo.webp e floral.webp (90 e 115 KB), no enquadramento padrão.

## 2026-10-30 — Imagens dos Construtos (`feature/character-sheet`)
- `assets/lineages/`: brutal.webp, emissario.webp e ligeiro.webp (100 a 180 KB cada), no enquadramento padrão.

## 2026-10-30 — Imagens dos Minotauros (`feature/character-sheet`)
- `assets/lineages/`: aelus.webp, alnuk.jpg e auroque.webp (100 a 440 KB cada). A do Alnuk é quadrada e usa `LINEAGE_POS` (50% 12%) para não cortar os chifres.

## 2026-10-30 — Faixa de ilustração nas linhagens (`feature/character-sheet`)
- Os cartões da aba Linhagens ganharam uma faixa 16:9 no topo com o nome da linhagem por cima; a imagem é lida de `assets/lineages/<id>.webp` (`data/lineageArt.js`, automático) e, enquanto não existe, aparece o símbolo da origem com "Arte provisória".

## 2026-10-30 — Vídeos das origens cortados em loops de até 10 s (`feature/character-sheet`)
- Os 10 vídeos passaram de ~178 MB para ~12 MB: cada um virou um loop de 3 a 10 s, sem áudio, até 1080p/30 fps, com o trecho escolhido pelo melhor encaixe entre fim e começo e o último segundo fundido com o começo.
- `start`/`end` saíram das entradas (os cortes estão nos arquivos) e o `<video>` usa o `loop` nativo; as opções continuam suportadas.

## 2026-10-30 — Vídeo da Briar na Runinata: as 10 origens têm vídeo (`feature/character-sheet`)
- `assets/origins/runinata.mp4` (1080p, 91 MB, 203 s): preto até ~1 s (`start: 1.5`); foco 0,5 (0,53 nos painéis estreitos), `show: 0.5`, medido no recorte de um painel de 342×1140 px em três instantes.
- Pendência de peso dos vídeos registrada em frontend.md.

## 2026-10-30 — Vídeo do Gnar no Yordle (`feature/character-sheet`)
- `assets/origins/yordle.mp4` (1080p, 3,5 MB, 17 s): o Gnar é pequeno e fica à direita do quadro; foco 0,74 (0,75 nos painéis estreitos), `show: 0.45`. O Gnar se mexe: o rosto vai e volta pelo quadro, então o foco foi medido em três instantes, no recorte exato de um painel de 342×1150 px, com uma linha no centro.

## 2026-10-30 — Sett centralizado no painel estreito (`feature/character-sheet`)
- O foco do Sett estava em 0,57 e o painel estreito mostrava o ombro, sem o rosto; medido num recorte igual ao do painel, rosto e esterno ficam em 0,49-0,5.

## 2026-10-30 — Vídeo do Sett na Vastaya (`feature/character-sheet`)
- `assets/origins/vastaya.mp4` (1080p, 8 MB, 52 s): começa com ~1,5 s de preto e escurece no fim, então toca de 2 s a 47 s (`start`/`end`). Foco 0,5 (0,49 nos painéis estreitos), `show: 0.55`.

## 2026-10-30 — Vídeo do Trundle no Troll (`feature/character-sheet`)
- `assets/origins/troll.mp4` (720p, 13 MB, 65 s; login animado feito por fã): a interface de login do jogo aparece por cima a partir de ~15,5 s, então o novo `end: 14.8` faz o vídeo voltar ao início antes disso. Foco 0,65 (0,6 no rosto), `show: 0.62`.

## 2026-10-30 — Vídeo da Shyvana no Meio-Dragão (`feature/character-sheet`)
- `assets/origins/meio-dragao.mp4` (1280×576, 19 MB, 215 s da mesma cena): ela fica no centro (0,58), `show: 0.5` porque o quadro é ultra-largo.

## 2026-10-30 — Vídeo do Chireano (`feature/character-sheet`)
- `assets/origins/chireano.mp4` (1080p, 9,6 MB, 8 s): personagem à esquerda do quadro, foco 0,4 no conjunto e 0,37 no rosto nos painéis estreitos, `show: 0.62`.

## 2026-10-30 — Vídeo do Ivern no Antroplantæ (`feature/character-sheet`)
- `assets/origins/antroplantae.mp4` (Ivern animado, 1080p, 1,5 MB, 10 s): foco 0,6 no conjunto (com a Daisy) e 0,56 no rosto nos painéis estreitos, `show: 0.62`.

## 2026-10-30 — Construto: rosto da Orianna no painel em repouso (`feature/character-sheet`)
- `focusNarrow` no vídeo: nos painéis estreitos o foco vai para o rosto (0,86), e conforme o painel se alarga volta para o conjunto (0,66). Antes a faixa caía entre a bola e a Orianna.

## 2026-10-30 — Vídeo da Orianna no Construto; `show` corrigido (`feature/character-sheet`)
- `assets/origins/construto.mp4` (Orianna Winterwonder, 720p, 1,5 MB, 5 s) com foco em 0,66 e `show: 0.62`.
- Correção do `FocusVideo`: o `show` escolhia o maior tamanho em vez do menor e nunca valia; agora limita a largura e só age nos painéis largos, com transição gradual (antes encolhia o vídeo numa faixa no topo dos painéis estreitos). Isso também corrige o Alistar, que ainda aparecia em close.

## 2026-10-30 — Alistar: volta ao vídeo, com enquadramento corrigido (`feature/character-sheet`)
- O Minotauro voltou ao vídeo do Alistar (saiu a chave `living` da entrada) com `show: 0.62`: o painel mostra a cabeça inteira em vez de um close do rosto.

## 2026-10-30 — Arte do Alistar animada na origem Minotauro (`feature/character-sheet`)
- `LivingArt.jsx` e `data/scenes/minotauro.js`: a imagem ganha vida com um shader WebGL (respiração, juba, correntes, poeira, olhos, areia, lascas, sangue).
- `living` tem prioridade sobre `video` em `originArt.js`; o vídeo do Alistar continua lá, sem aparecer.
- `FocusVideo` aceita `show`, a fração mínima da largura do quadro que deve aparecer.

## 2026-10-30 — Martelada do Gaudron mais leve (`feature/character-sheet`)
- Saíram `mix-blend-mode`, os `drop-shadow` e o redesenho das rachaduras a cada quadro; agora elas crescem por `scale` e somem por `opacity`. Menos pedras, fagulhas e panos.
- No preview: de ~21 para 65–74 quadros/s. A medição antiga pode ter sido afetada pelo painel oculto.

## 2026-10-30 — Efeito do Gaudron: martelada na arena (`feature/character-sheet`)
- `effects/Embers.jsx` ganhou a sequência: carga, golpe aos 0,5 s (rachaduras de lava, pedras, fagulhas, poeira) e torcida gritando "GAU! DRON! GAUDRON!" com tochas e panos vermelhos. Some em ~3,6 s; ficam as brasas.
- Tremor, explosão e ondas de choque sincronizados com o golpe; login em laranja (`.login.embers`). Conferido no preview, pausando em cada etapa, no computador e no celular.

## 2026-10-30 — Vídeo do Alistar no Minotauro (`feature/character-sheet`)
- `assets/origins/minotauro.mp4` (Alistar, 1080p, 6 MB) como fundo da origem, com foco em 0,68 do quadro.

## 2026-10-30 — Um vídeo por origem, com os símbolos por cima (`feature/character-sheet`)
- Saiu a alternância de personagens: cada origem tem um `video` de fundo, levemente escurecido; o Humano usa o Yasuo velho (1440p). Os clipes do Garen, Caitlyn e do outro Yasuo foram removidos.
- O sigilo da origem voltou a aparecer sempre; com vídeo, desce para acima do texto para não cobrir o rosto.

## 2026-10-30 — Humano: troca a cada 5 s e personagens mais centrados (`feature/character-sheet`)
- `hold` de 5 s em cada vídeo; `start` pula a abertura preta do Yasuo; focos remedidos nos quadros (Yasuo .785, Garen .74, Caitlyn .46); vídeo não ganha mais zoom no hover.

## 2026-10-30 — Vídeos do Humano na origem (`feature/character-sheet`)
- Yasuo, Garen e Caitlyn se alternam com fusão no painel e no destaque do Humano (`CycleVideo`/`FocusVideo` em `OriginArt.jsx`), com o personagem sempre centralizado, qualquer que seja o formato do painel.

## 2026-10-30 — Painéis de origem mais altos (`feature/character-sheet`)
- Altura mínima de 700px por painel; em janela baixa o salão rola, com a barra fixa e o texto/sigilo na primeira tela.

## 2026-10-30 — Galeria e destaque na escolha de origem (`feature/character-sheet`)
- A etapa Origem virou um salão em tela cheia (`OriginStep.jsx`), com um painel vertical por origem que se expande no hover, como a seleção de personagem; os detalhes só aparecem ao clicar.
- O painel cresce até quase a tela toda (`OriginStage.jsx`), com abas Ganhos, Habilidades, Linhagens e Sobre, setas entre origens e selo ao confirmar.
- Sigilos e partículas provisórios por origem; a arte real entra em `data/originArt.js`.
- `grantLabel` agora nomeia resistências, imunidades, vulnerabilidades, sentidos, situacionais e formas, que apareciam como o tipo cru.

## 2026-10-30 — Criação de personagem em tela própria (`feature/character-sheet`)
- Conta sem ficha abre direto `creation/CreationScreen.jsx`, sem o herói, as abas e as rolagens da ficha; saiu o aviso "Ficha em branco".

## 2026-10-30 — Juramento do Proto 1,35x mais rápido (`feature/character-sheet`)
- A sequência caiu de 4,5 s para 3,33 s, com todos os tempos na mesma proporção; a poeira não mudou.

## 2026-10-30 — Efeito exclusivo do Proto: juramento do escudeiro (`feature/character-sheet`)
- `effects/ShieldOath.jsx` (`fx: 'oath'`): visor de máquina, bússola-radar que procura o mestre sem resposta, escudo que bate e se enche de hexágonos, registro digitado no topo. Some em 4,5 s; fica só a poeira.
- Login em azul (`.login.oath`). Conferido no preview, pausando a animação em cada etapa.

## 2026-10-30 — Proto ganha vídeo na tela inicial (`feature/character-sheet`)
- `assets/characters/proto.mp4` (H.264 1080p sem áudio, 9,6 MB, 10,75 s) e `proto.jpg` (poster), ligados em `data/characters.js`.
- Vídeo editado: respiração em câmera lenta no início e transição de 1,1 s de volta ao 1º quadro para o loop. Nenhum personagem usa mais placeholder.

## 2026-10-30 — Assombração do Loge sem os olhos vermelhos (`feature/character-sheet`)
- Removida a camada `.lg-eyes`, que brilhava sobre o rosto da princesa; ficam só os olhos da própria arte.

## 2026-10-30 — Assombração do Loge mais contida (`feature/character-sheet`)
- Bebedeira com metade da amplitude ou menos e só ~3 s (antes contínua); os olhos somem junto com o rosto e o escurecimento quase sai no fim.

## 2026-10-30 — Efeito exclusivo do Loge: assombração (`feature/character-sheet`)
- `effects/Haunting.jsx` (`fx: 'haunt'`): visão dupla e cambaleio de bêbado, facada que parte a arte, escuridão, rosto da princesa com sussurros e olhos que ficam acesos.
- Brilho do painel de verde para vermelho (`hue: 348`) e login no mesmo tom (`.login.haunt`). Conferido no preview.

## 2026-10-30 — Loge ganha vídeo na tela inicial (`feature/character-sheet`)
- `assets/characters/loge.mp4` (H.264 1080p sem áudio, comprimido de 22,8 MB para 8,2 MB) e `loge.jpg` (poster, 1600×900), ligados em `data/characters.js`.
- Só o Proto segue com placeholder.

## 2026-10-30 — Titan sai da tela inicial (`feature/character-sheet`)
- O jogador não joga mais: painel removido de `data/characters.js`; a seleção fica com Rudo, Gaudron, Proto e Loge.
- A conta `titan` continua no seed do back-end (nada foi apagado do banco).

## 2026-10-30 — Subida de nível: o mestre libera, o jogador escolhe (`feature/character-sheet`)
- `Character.pendingLevels` + `PATCH /character/{id}/pending-levels` (mestre); as rotas de subida viram `/character/me/level-up[/preview]` (jogador, só nos níveis liberados). `LevelUpService` desconta ao aplicar, na mesma transação.
- Front: o formulário saiu do `MasterSheets` para `creation/LevelUp.jsx`, aberto pelo botão **SUBIR DE NÍVEL** no topo da ficha; o mestre só tem o card "Subida de nível" (liberar/cancelar). A ficha confere a cada 10 s.
- Testes: `LevelUpControllerTests` liberam pelo mestre e sobem pelo dono. Conferido no sandbox (Rudo 1 → 2).

## 2026-10-29 — Mapeamento: aproximações corrigidas (`feature/character-sheet`)
- Armas regionais pela região do personagem ("regional (...)" no catálogo de itens, como na wiki): Estudioso de Armas e Ferromante (só marciais).
- "Mistério a que você tenha acesso" só com os acessíveis (`MYSTERY` `value: ACCESS`, `MagicRules.accessibleElements`).
- Magia Inata: 2º e 3º nível exatos (`+EXACT`); Acólito Arcanista pelo nível de conjuração do Acólito (`+CASTER:ACOLYTE`). Conferido no sandbox.

## 2026-10-29 — Mapeamento: Sinergia das Runas, Bônus de Totem e Dançarino (`feature/character-sheet`)
- Sinergia só com o Pulso da Runa (Elegia, Bênção do Vigia, Fôlego de Guerra); Bônus de Totem dos 15 Grandes Espíritos como efeito ativo; Dançarino com proficiência na perícia escolhida.
- Efeitos ativos ganham RD e iniciativa (`reduction`/`initiative`). Teste: o efeito de teste soma RD e iniciativa.

## 2026-10-29 — Mapeamento M: efeitos ativos (`feature/character-sheet`)
- Concessão `EFFECT`: efeitos temporários com números do nível (CA, resistências, imunidades, deslocamento, dano) que o jogador liga e desliga na ficha (`PATCH /character/me/effect`, `activeEffects`).
- ~35 efeitos: Fúria do Bruto (Dano de Fúria pelo nível), Iras, Técnicas, Sutras, Vel, Caçador, Combatente, Bodisatva, Acólito das Marés, Heranças, Runinata e runas.
- Front: Efeitos ativos no cartão de Formas. Teste: efeito ligado/desligado (CA, resistência, deslocamento e dano). Conferido no navegador com a Fúria.

## 2026-10-29 — Mapeamento M: crítico e bônus contra alvo (`feature/character-sheet`)
- Concessão `CRIT_BONUS` (nota `CRIT:<alvo>`, aplicada na margem e no multiplicador dos ataques): Fúria de Warmog e Brutalizador.
- `DAMAGE_BONUS` com `description` vira nota no ataque com o número (Inimigo Favorito, presa, Atacante Brutal, Feridas Abertas); com `diceByLevel` (Rocha Bruta).
- Notas para os críticos e alvos sem número. Teste: crítico e nota de alvo no desarmado do Nyx.

## 2026-10-29 — Mapeamento M: notas gerais (`feature/character-sheet`)
- Notas situacionais com alvo `GENERAL` (terreno, clima, queda, salto, carga) e `SPELL` (efeitos nas magias), mostradas no herói da ficha.
- Cerca de 30 notas em Heranças, Aprimoramentos, linhagens, Caçador e traços.

## 2026-10-29 — Mapeamento M: produção de ofício (`feature/character-sheet`)
- Concessões `CRAFT_INCOME` (PO/dia a mais) e `CRAFT_MASTERWORK` (margem de Obra-Prima); a ficha guarda e o cartão de Ofícios mostra.
- Artífice, Operário, Coletivo Forte, Mestre Artesão, Hospitaleiro e o Forjador do Acólito da Forja.

## 2026-10-29 — Mapeamento C6: Magia Inata e magias por nível (`feature/character-sheet`)
- Escolhas com `minLevel` (só aparecem a partir do nível); `SPELL_CHOICE` `ORIGIN` (lista da origem) e `MYSTERY:CHOSEN` (Mistério escolhido na mesma fonte).
- Magia Inata (truque; 1º no 5º; 2º no 11º; 3º no 17º) e Acólito Arcanista (uma magia do Mistério a cada novo nível de magia).
- Subida de nível mostra as escolhas de Herança pendentes (`pendingChoices`). Testes: escolha com `minLevel` e `pendingChoices`.

## 2026-10-29 — Mapeamento C5: formas temporárias (`feature/character-sheet`)
- Concessão `FORM`; a ficha guarda as formas (`character_forms`) e a ativa (`activeForm`): atributos somados, maior deslocamento e tamanho mudam enquanto ela está ligada. `PATCH /character/me/form`.
- 18 formas de Sho'Ma (efeitos lidos do texto de cada uma) e a Forma Dracônica das 5 linhagens do Meio-Dragão.
- Front: cartão Formas na aba principal. Testes: forma ligada/desligada pelo endpoint e `formEffects`.

## 2026-10-29 — Mapeamento C4: troca de atributo (`feature/character-sheet`)
- Concessão `ATTRIBUTE_SWAP` (vale o maior): perícias (Comandante, Mente Intuitiva), PV e CA (Resiliência Adaptativa), conjuração (Acordes de Poder) e Força nos ataques (Detectar/Perceber Fraquezas, 2ª opção).
- A perícia mostra o atributo que está valendo. Teste: Atletismo do Nyx pela INT.

## 2026-10-29 — Mapeamento C3: níveis de ofício (`feature/character-sheet`)
- Concessões `CRAFT_LEVEL` (+níveis ou nível mínimo) e `CRAFT_FORMULAS`; a ficha guarda por ofício e soma no nível e no limite de fórmulas.
- Minucioso, Operário e Privilegiado (+1 nível), Hábil (opção de nível), Maestria (6º nível, especialidade e fórmulas), Praticante Dedicado (ofício ou +1 nível, 5 fórmulas), Atirador 3º (Armeiro pelo nível da classe).
- Teste: Ferraria do Nyx com +1 nível e 3 fórmulas a mais.

## 2026-10-29 — Mapeamento C2: bônus no dano dos ataques (`feature/character-sheet`)
- Concessão `DAMAGE_BONUS`, guardada como nota `DAMAGE:<alvo>` e somada no dano dos ataques da ficha (com a nota da fonte).
- Disciplina é Força (+proficiência na arma escolhida), Fúria de Warmog (duas mãos), Briguento (+1d4 desarmado), Detectar/Perceber Fraquezas (metade do atributo, pela escolha), Colosso e Mãos de Ferro (+1).
- Testes: `somaBonusNoDano` e o desarmado do Nyx com +1d4+2.

## 2026-10-29 — Mapeamento C1: sentidos (`feature/character-sheet`)
- Concessão `SENSE` (visão no escuro, visão às cegas, sentido sísmico, telepatia), com "ou +N se já tiver", lugar ("debaixo d'água") e alcance pelo nível; ficha com `senses` (`character_senses`) em chips.
- ~45 fontes: Yordle, Chireano/Nocti, Troll da Selva, Marai, Kiilash, Heranças (Visão Treinada/Lunar, Perceptivo, Anfíbio, Meio-Vastaya, Força Predatória, Vantagem Tecnológica), Púrpura, Tecelã, Atirador, Bodisatva, Assassino, Sutras, Vel, Invocações, runas e traços da Runinata.

## 2026-10-29 — Mapeamento B8: Ki extra (`feature/character-sheet`)
- Concessão `EXTRA_USES`: Cultivo de Ki (+1, ou 2 pontos sem Ki), Conjurador Natural (+proficiência), Alianças Espirituais (+metade); a tabela de usos passa a somar `usesPlus`.
- Conferido no sandbox (Bodisatva 2 → 3; Combatente ganha Ki 2; Colosso Médio → Grande).

## 2026-10-29 — Mapeamento B7: RD contra um tipo de dano (`feature/character-sheet`)
- Concessão `DAMAGE_REDUCTION`; ficha com `typedReductions` (`character_typed_reductions`) em chips "RD N: tipo".
- Variante Glacinata (gélido = proficiência), Adaptação Selvagem (ácido e ígneo), Ascensão Feérica (sombrio 2).

## 2026-10-29 — Mapeamento B6: tamanho da Variante Colosso (`feature/character-sheet`)
- `SIZE` `UP` (uma categoria acima, no fim) e `repeatGrants` com chave `"*"` para Herança sem opção; a 2ª escolha do Colosso aumenta o tamanho.
- Teste: `segundaEscolhaSemOpcaoAumentaOTamanho`.

## 2026-10-29 — Mapeamento B5: especialidade em salvaguarda (`feature/character-sheet`)
- `SAVING_THROW` com `expertise` (Graciosidade); ficha com `savingThrowExpertise` (`character_save_expertise`); a resistência soma a proficiência em dobro e fica marcada como especialista.

## 2026-10-29 — Mapeamento B3/B4: resistência por nível e "um avanço" (`feature/character-sheet`)
- `minLevel` em concessão fixa: Gases (versão mágica no 11º) e a cadeia da Runinata (Resistência Natural escolhida → Mágica 12º → Lendária 16º → Absorção 18º).
- "Um avanço na resistência" (Bênção do Urso e do Vorme); o degrau maior apaga os menores na ficha.

## 2026-10-29 — Mapeamento B2: imunidade a condições e doenças (`feature/character-sheet`)
- Concessão `CONDITION_IMMUNITY`; ficha com `conditionImmunities` (`character_condition_immunities`) em chips "Imune a ...".
- Ressurgido Espectral, Limiar Tecnológico, Construto, Trolls, Bodisatva 10º, Atirador 11º, Desperado e Guardião 20º, Ninhada Aranha, Essência Etílica, Experimento Zaunita, Glacinata, Feéricos, Construído.

## 2026-10-29 — Mapeamento: sobras do bloco A (`feature/character-sheet`)
- Princípio Elemental (Mistério terciário/de transição), Chamado Sagrado Estudioso e Obreiro (escolhas com `when`), traço Habilidoso (`SITUATIONAL` à escolha), Ninhada Aranha/Cobra (imunidade a venenoso), Mestre Tático (`anyClass`).
- Teste: escolha com `when` e nota à escolha no Inspira Teste. Conferido no sandbox.

## 2026-10-29 — Mapeamento A5–A7: notas, CA/RD e Chamado Sagrado (`feature/character-sheet`)
- 30 notas situacionais em origens, linhagens, classes (Bruto, Caçador, Zhonya, Púrpura, Atirador, Desperado, Forja, Explorador), Heranças e Aprimoramentos.
- CA do Guerreiro Primal, RD do Alnuk, +1 RD do Especialista em Armadura Pesada, natação da Constituição Anfíbia, voo da Ascensão Feérica, PV da Constituição Montanhosa; Chamado Sagrado Protetor com as proficiências.
- Teste: `especialistaEmPesadaSomaRd`. Conferido no sandbox pela prévia.

## 2026-10-29 — Mapeamento A4/B1: defesas contra dano (`feature/character-sheet`)
- Resistências, vulnerabilidades e imunidades de Heranças (Pele Rígida, Construção Primorosa), origens (Construto, Brutal pela opção, Meio-Dragão por linhagem e no 15º, Yordle Aquático, Troll da Selva), subclasses (Forja, Sepultura, Tempestade, Púrpura, Arqueiro Rúnico, Explorador, Hakensai), runas, Vel e traços da Runinata.
- Resistência à escolha com `expertise` (caso já tenha, imunidade).

## 2026-10-29 — Mapeamento A3: magias das Heranças (`feature/character-sheet`)
- 22 magias fixas de Heranças (`SPELL`) e 11 escolhas (Benefício Colateral, Musicista, Incentivo Celeste, Conjurador Natural, Vislumbre, Ritualista, Essência Elemental, Shugenja).
- `SPELL_CHOICE`: `MYSTERY:<ids>`, `ANY` e `+RITUAL`.

## 2026-10-29 — Mapeamento A2: proficiências, Mistérios e recursos (`feature/character-sheet`)
- Ofícios (Mestre Artesão, Nazumitas, Tecnomaníaco, Musicista, Hospitaleiro, Pastor, Forja), armas à escolha (Armas Avançadas, Enxofre, Ferromante, Disciplina é Força, Estudioso das Armas, Bélico, Ceifador, Explorador), perícias (Habilidoso, Nebulon, runas).
- 16 Mistérios à escolha/pela opção (Manifestação Primordial e Vislumbre Estelar ganharam opção); recursos à escolha (Mestre Tático, Fluência Espiritual, Desbravador do Ki, Modularidade, Mais Inimigos).
- `CRAFT`/`CRAFT_CHOICE` com `expertise` (caso já tenha, especialidade).

## 2026-10-29 — Mapeamento A1: erros nos dados (`feature/character-sheet`)
- Força Pneumática sem o texto/Sobrevivência da Força Predatória; perícias que faltavam (Inventor Renomado, Acólito Arcanista, Prestidigitador), Mistério do Fogo (Piromaníaco), passivas (Atento +1, Perspicaz +5), proficiências do Treinamento Demaciano, CON +2 (máx. 22) do Lendário Guardião.
- Concessões: `ATTRIBUTE.value` (limite), `MYSTERY` à escolha sem habilidade, `IMMUNITY`; grupo "Armas marciais corpo a corpo" nos ataques.

## 2026-10-29 — Mapeamento do que está só no texto (`feature/character-sheet`)
- `docs/mapeamento-regras.md`: todas as Heranças, Aprimoramentos, recursos, origens, classes, passados e traços comparados com as concessões.
- Blocos: A (só dados, inclui erros como a Força Pneumática com a Sobrevivência da Força Predatória), B (sistema pequeno), C (sistema novo: sentidos, dano, níveis de ofício...), M (mestre).

## 2026-10-29 — Absorção, imunidade, Essência Volátil e Experimentos (`feature/character-sheet`)
- `ABSORPTION`; resistência/vulnerabilidade/absorção à escolha (Essência Volátil, tipos diferentes); `RESISTANCE.expertise` = caso já tenha, imunidade (Meio-Azakana, Meio-Kanmei).
- Ficha: `immunities` e `absorptions` (tabelas novas) em chips.
- Experimentos Reconhecido, Bem-Sucedido e Zaunita: Vantagem Tecnológica com efeitos `when` (sem a Variante); Zaunita com perícia e ofício.

## 2026-10-29 — Progressão Tecnológica na subida de nível (`feature/character-sheet`)
- `HeritageStep` conta as escolhas da criação (pela prévia): "Aprimorar Fonte" aparece na 2ª escolha feita ao subir de nível.
- Subida de nível mostra a escolha da Fonte Dominante ainda não feita (`dominantChoices` em `rules.js`).
- Testes: `segundaFonteNaSubidaPedeADominante` e `dominantChoices`.

## 2026-10-29 — Vulnerabilidades, Fontes da Progressão Tecnológica e Adaptação Tecnológica (`feature/character-sheet`)
- Concessão `VULNERABILITY` (`amount: -1` tira): Ressurgido; a ficha guarda `vulnerabilities` (`character_vulnerabilities`) e mostra em chips vermelhos.
- Progressão Tecnológica: a mesma Fonte duas vezes dá as Vantagens de novo; "Aprimorar Fonte" (`repeatOptions`, só da 2ª escolha); escolha da **Fonte Dominante** (`threshold.dominant`) com as duas fontes.
- Adaptação Tecnológica (Estável/Instável): +1 em FOR/DES/CON, Vantagens, efeitos `when` e Limiar; pré-requisito Construto ou a Variante.
- Testes: vulnerabilidades na ficha, opção repetida, fonte dominante e `repeatOptions` em `CreationControllerTests`.

## 2026-10-29 — Usos de outra habilidade, deslocamento relativo, Carapaça, Limiar e 2ª escolha do Ressurgido (`feature/character-sheet`)
- Concessão `ABILITY_USES` (Inspirar Aliados, Adepto Espiritual, Controle de Plumadagas); `SPEED.walkFraction` (Vida Marinha, Pés Cascudos, Adaptações).
- `when`: concessão que só vale com a opção escolhida (Vantagens/Desvantagens Tecnológicas: CA, RD, deslocamento, notas); RD de metade da proficiência no `AC_BONUS` (Carapaça).
- Heranças: `repeatGrants` (2ª escolha do Ressurgido) e `threshold` (Limiar Tecnológico: Construto Vivo ou Mutante com 5 Vantagens).
- Teste: `herancaMudaOutraHabilidadeDeslocamentoERd`, limiar e 2ª escolha nos testes de Heranças.

## 2026-10-28 — Heranças ativas, Variantes por opção, Centelha Mágica e nível dos ofícios (`feature/character-sheet`)
- Heranças/Aprimoramentos com parte ativa: `execution`/`uses` (93 Heranças e 23 Aprimoramentos) ou `FEATURE` `ABILITY` por parte; a habilidade ganha tempo e usos.
- Variantes: `optionTexts`/`optionUses`/`optionExecution` (Meio-Vastaya, Ressurgido com resistências pela opção), `optionPerPick` (Forma de Sho'Ma, Progressão Tecnológica com Vantagens/Desvantagens e CA da Proteção Metálica); front com uma opção por escolha.
- Centelha Mágica (2 Mistérios + magia de 1º nível) e Vesani; ofícios guardam `learnedAt` (`character_craft_levels`) e o nível conta dali.
- Testes: `herancaAtivaGanhaTempoEUsos`, `variantesComUmaOpcaoPorEscolha`, `oficioGuardaONivelEmQueFoiAprendido`. Conferido no sandbox pela API (`SANDBOX_PORT` novo).

## 2026-10-28 — Efeitos situacionais, resistências, Ígneo, Rajada Etérea e listas de outra classe (`feature/character-sheet`)
- Concessões `SITUATIONAL`, `RESISTANCE` e `PASSIVE_BONUS`: 76 notas (perícia, salvaguarda, ataque por tipo de arma, CA, iniciativa), 6 resistências e 4 bônus de Percepção passiva em Heranças e Aprimoramentos (Arqueiro, Sagaz, Balestreiro...); `optionGrants` (Propulsão Natural).
- Ficha: ✦ com a nota em perícias e salvaguardas, notas nos ataques, resistências e notas de CA/iniciativa no herói.
- Ígneo: Magma ou Infernal se já tiver Fogo; Rajada Etérea pede rajada mística (`requires.spells`); Arcanista Iniciante e Grão-Conjurador escolhem da lista de outra classe (`LIST:`).
- Testes: efeitos da Herança de teste na ficha, `situationalFor`.

## 2026-10-28 — Fórmulas de Ofício (`feature/character-sheet`)
- `rules/formulas.json` extraído da wiki (76 gerais + 237 dos ofícios), `FormulaService`, `GET /crafts/formulas` e `PUT /character/{id}/formulas` (mestre).
- Ficha: fórmulas conhecidas no card Ofícios com o limite da regra (mod. de INT × nível do ofício); Livro ganhou **Fórmulas**; o mestre marca no `FormulaEditor` da aba Fichas.
- Testes: `FormulaServiceTests` e fórmulas no teste de criação. Conferido no sandbox.

## 2026-10-28 — Aprimoramentos, listas de origem, Vítreo e ofícios (`feature/character-sheet`)
- Aprimoramentos: Atento (concessão nova `INITIATIVE`, `initiative` na ficha), Hábil (3 proficiências entre perícia e ofício), Especialista em Armadura Média (sem limite de DES e +1 de RD na CA).
- Magia: listas Yordle/Fauhwoon/Ottrani valem como a da classe para quem é da origem; Janela da Mente e Persistência do Vítreo dão o Mistério ("Charme (Encantamento)").
- Ofícios: atributo base dos 22 no `criacao.json` (wiki); `crafts` na ficha com nível dos maiores e bônus do teste; card **Ofícios** na Ficha.
- Testes: `ArmorClassCalculatorTests`, ofício no teste de criação. Conferido no sandbox (Vítreo com Encantamento, Xamã Yordle com 9 truques a mais, ofício rolando).

## 2026-10-28 — Efeitos de Herança, Estilos de Luta, Exaustão e bônus de PV (`feature/character-sheet`)
- `RuleHeritage.grants`: 35 Heranças com perícia (especialidade se já tiver), salvaguarda, deslocamento, idioma ou ofício e 21 com Mistério; viram a fonte "Herança: X" e as escolhas aparecem na etapa Heranças (e na subida de nível).
- Ataques: `styles` com os Estilos de Luta que valem para a arma (Duelismo, Arquearia, Arremessar, Duas Mãos, Armas Grandes, Desarmado), já calculados.
- Combatente Arcano sem o Aprimorado para no 2º nível de magia; descanso longo tira Exaustão = mod. de CON; `maxHpBonus` do mestre (PV máx. +/− no painel).
- Testes: `herancaAplicaPericiaEEspecialidade`, `estilosDeLutaComOBonusJaSomado`, `combatenteArcanoSemOAprimoradoParaNoSegundoNivel`, `descansoLongoBaixaAExaustao` e bônus de PV.

## 2026-10-28 — Visão da mesa, Etapa 6 do plano (`feature/character-sheet`)
- `GET /character/table` (mestre): cada ficha com a CA em uso e a Mana; `GET /character` passa a exigir o mestre.
- Front: aba **Mesa** (primeira do painel, `MasterTable.jsx`): cartões com PV (dano/cura/temporários), CA, Mana, testes contra a morte, condições (editáveis) e inspiração; polling de 5 s.
- Testes: `criaOPersonagemResolvendoClasseAntecedenteEPericias` cobre 401/403 e a mesa. Conferido no sandbox (dano, inspiração, condição e a cura do jogador aparecendo sozinha).

## 2026-10-28 — Mestre edita o que criou, Etapa 5 do plano (`feature/character-sheet`)
- `PUT /character/{id}/abilities/{abilityId}` (mantém ícone e usos gastos), `PUT /documents/{id}` (mantém leituras) e `readBy` na lista do mestre; `PATCH /character/{id}/hp` para o mestre. `maxHpBonus` do plano ficou de fora (PV máximo continua pela subida de nível).
- Front: **Editar** em Habilidades e Documentos, "Leram: …" nos enviados e `HpEditor` (dano/cura/temporários) na aba Fichas.
- Testes: `mestreEditaHabilidadeSemPerderIconeNemUsos`, `mestreEditaDocumentoEVeQuemLeu`, `mestreAjustaPvDeQualquerFicha`. Conferido no sandbox.

## 2026-10-28 — Testes contra a morte e condições, Etapa 4 do plano (`feature/character-sheet`)
- `rules/condicoes.json` (Capítulo 14 da wiki: 22 condições resumidas + Exaustão até **10**, não 6), `ConditionService` e `GET /conditions`; `Character.conditions`/`exhaustion` só pelo mestre (`PATCH /character/{id}/conditions`).
- `deathSuccesses`/`deathFailures`: o jogador marca (`/character/me/death-saves`), o mestre ajusta; zeram ao ganhar PV e no descanso.
- Front: círculos dos testes com 0 PV (rolar: 10+, 1 = duas falhas, 20 = 1 PV), chips de condição no herói e `ConditionEditor` na aba Fichas do mestre.
- Testes: `testesContraAMorteZeramAoGanharPv`, `soOMestreMexeNasCondicoes`, `deathSaveResult`. Conferido no sandbox.

## 2026-10-28 — Conjurar gastando Mana, Etapa 3 do plano (`feature/character-sheet`)
- `SpellcastingRules`: atributo de conjuração e nível máximo de magia lidos do texto das habilidades de Conjuração (vale nas fichas antigas); `saveDc`/`spellAttack` nas magias e `spellcasting` na ficha (maior nível entre as classes, custo de Mana).
- `POST /character/me/abilities/{id}/cast`: truque grátis, usos próprios primeiro, senão a Mana do nível; 400 acima do nível máximo, sem Mana ou não preparada. Decisão: em vez de `castingAttribute` no `criacao.json`, o texto do livro já na ficha.
- Front: CD, ataque de magia (rola) e a caixa **Conjurar** com nível e custo na aba Magias.
- Testes: `conjurarGastaManaPeloNivel`, `SpellcastingRulesTests`. Conferido no sandbox: Arcanista CD 12, Bênção −2 Mana (4 → 2).

## 2026-10-28 — Ataques com arma, Etapa 2 do plano (`feature/character-sheet`)
- `AttackCalculator`: `attacks` na ficha, uma linha por arma do inventário + desarmado; acuidade (maior entre FOR e DES), à distância (DES), proficiência por categoria ou pelo nome, crítico do livro ("p 19 x3") e dano versátil.
- Front: card **Ataques** na Ficha (`Attacks.jsx`): bônus rola o d20 com a margem de crítico; dano, 2 mãos e Crítico (`critDice`) rolam o dano.
- Testes: `AttackCalculatorTests` (6) e `critDice`. Conferido no sandbox: Combatente com Cimitarra +4 (1d6+2, crítico 19–20 ×3), Besta Leve pela DES.

## 2026-10-28 — Docs divididos por assunto (`feature/character-sheet`)
- `backend.md` virou núcleo + `backend-api.md`, `backend-criacao.md` e `backend-ficha.md`; `frontend.md` virou núcleo + `frontend-telas.md` e `frontend-visual.md` (conteúdo movido sem mudança).
- CLAUDE.md e README: ler só o subdoc da tarefa, changelog curto e lido só no topo, um commit por entrega.

## 2026-10-28 — Inventário, ouro e inspiração, Etapa 1 do plano (`feature/character-sheet`)
- Mestre (`InventoryController`/`InventoryService`): dá itens do catálogo (conjunto aberto, soma na mesma linha) e itens livres, muda a quantidade, tira itens (a armadura/escudo em uso volta ao padrão), define o ouro e liga/desliga a inspiração.
- Jogador: usa 1 de um consumível, gasta ouro e gasta a inspiração (decisão da mesa: só gasta).
- Consumíveis: grupo `consumivel` no `itens.json` (poção, tocha, rações, óleo...) e toda munição; itens novos do catálogo nascem `Consumable`.
- Front: aba **Inventário** no painel do mestre (`MasterInventory.jsx`); na ficha, **Gastar** no ouro (`Purse.jsx`), **USAR** no consumível e a inspiração clicável.
- Testes: `InventoryControllerTests` (5). Conferido no sandbox: o mestre deu 3 poções, 50 PO e inspiração ao Rudo; o Rudo gastou 15 PO, a inspiração e 1 poção.

## 2026-10-27 — Plano do que falta para jogar (`feature/character-sheet`)
- Novo [plano-jogo.md](plano-jogo.md): 6 etapas na ordem (inventário/ouro/inspiração pelo mestre, ataques com arma, conjurar gastando Mana, testes contra a morte e condições, edição pelo mestre, visão da mesa), com as decisões da mesa: o jogador gasta consumíveis, ouro e inspiração (só o mestre dá), inspiração sim/não, testes contra a morte pelo jogador, condições pelo mestre. Segurança e polimento ficam para depois.

## 2026-10-27 — Combatente Arcano, Mana na multiclasse, troca de magia e Aprimoramentos (`feature/character-sheet`)
- Regras conferidas na wiki (Multiclasse; Técnicas de Combate → Combatente Conjurador).
- `RuleResource.levels`: ganhos do recurso pelo nível na classe que o escolheu. A Técnica Combatente Arcano segue a tabela Combatente Conjurador (truques, magias conhecidas, Mana até o 11º); o Aprimorado leva a Mana até 30 e libera magias de 3º e 4º nível. Recursos escolhidos por classe usam o nível nela nas tabelas.
- Mana na multiclasse: "Pontos de Mana" vira uma habilidade só, com a soma da de cada classe.
- Troca de uma magia conhecida ao subir de nível: escolhas opcionais `level:N:spell-swap:out`/`in`; o `ChoiceStep` passa a mostrar o `note` das escolhas.
- Aprimoramentos: Afortunado (Pontos de Sorte), Robusto (metade do dado de vida em PV), Perito em Armas de Corrente, Mestre do Combate, Controlador de Elementos; Conjurador Eficiente e Invocador Intenso até 22.
- Testes: `manaSomadaNaMulticlasse`, `trocaDeMagiaConhecidaAoSubir`, `recursoComGanhosPeloNivelDaClasse`.

## 2026-10-27 — Magias preparadas do Acólito e do Xamã (`feature/character-sheet`)
- Decisão da mesa: o jogador escolhe as preparadas, só no descanso longo.
- `preparation` nas classes (`criacao.json`): Acólito prepara SAB + nível de Acólito da lista dele e dos Mistérios, até o nível máximo de magia; Xamã prepara SAB + metade do nível de Xamã entre os feitiços conhecidos.
- `GET /character/me/preparation` e `prepared` no `POST /character/me/rest` (só no longo). `CharacterAbility.prepared`/`spellId`, `AbilityResponse.prepared`.
- Ficha: o Descanso longo abre a escolha das preparadas (`PrepareSpells.jsx`); marcas "preparada"/"não preparada" na aba Magias.
- Testes: `magiasPreparadasNoDescansoLongo`. Conferido no sandbox (Acólito prepara Bênção; Xamã de 2º nível prepara 1 dos 3 feitiços conhecidos; acima do limite, 400).

## 2026-10-27 — Escudo somando na CA (`feature/character-sheet`)
- Os escudos do inventário (achados pelo `catalogId` no `itens.json`: Escudo Leve +1, Pesado e de Torre +2) somam na CA de qualquer defesa. Sem escolha, vale o de maior bônus; `Character.shield` guarda a escolha e `PATCH /character/me/shield` troca (`NONE` = sem escudo). `ArmorClassResponse` ganhou `shield` e `shields`; sem proficiência com escudos, o bônus vem com o aviso.
- Ficha: parte **Escudo** no menu da Classe de Armadura.
- Testes: `escudoDoInventarioSomaNaCa` (escudo de teste no `itens-teste.json`). Conferido no sandbox (Combatente: Cota de Malha 16 + Escudo Leve = 17; sem escudo, 16).

## 2026-10-27 — Jogador altera os próprios PV (`feature/character-sheet`)
- `PATCH /character/me/hp` (`{ currentHp, tempHp? }`): PV atual de 0 ao máximo e PV temporários (`Character.tempHp`, também no `CharacterResponse`).
- Ficha: **Alterar PV** no herói (`HitPoints.jsx`) com Dano (gasta os temporários primeiro), Cura e PV temp.; os temporários aparecem em azul na barra. Atualização otimista, volta atrás se o back recusar.
- Testes: `jogadorAlteraOsPropriosPv` e `applyHp` no front. Conferido no sandbox (Rudo: 4 temporários + 7 de dano → 8/11).

## 2026-10-27 — Subida de nível, multiclasse e Aprimoramentos (`feature/character-sheet`)
- **Subida de nível pelo mestre**: `POST /character/{id}/level-up/preview` e `POST /character/{id}/level-up`. Os níveis ficam no `build`; o cálculo refaz o personagem no nível novo (proficiência, usos/dados/valores pelo nível da classe, PV com o dado rolado, ponto de Herança no 5º, 9º, 13º e 17º, atributos até 20). Aplicar soma a diferença de PV no PV atual e mantém usos gastos e as habilidades cadastradas pelo mestre (`CharacterAbility.source`). `Character.classLevels` e `CharacterResponse.canLevelUp`.
- **Multiclasse**: pré-requisitos e proficiências de multiclasse das 9 classes (`multiclass` no `criacao.json`, da página Multiclasse da wiki); a classe nova entra sem as proficiências iniciais.
- **Aprimoramentos**: `rules/aprimoramentos.json` com os 96 da wiki (texto completo) e os dois aumentos de atributo; o Aprimoramento das classes (47 níveis) virou escolha `RESOURCE_CHOICE` `APRIMORAMENTO`. Pré-requisitos novos em recursos: `classLevel`, `origins`, `lineages`; `repeatable`.
- **Magias por nível**: as tabelas de truques e magias conhecidas (Arcanista, Xamã, Ravasz, Cicatrizes Rúnicas, Arqueiro Rúnico, Espião; truques do Acólito) viraram `SPELL_CHOICE` nos níveis, com o nível máximo de magia de cada nível.
- Front: aba **FICHAS** no painel do mestre (`MasterSheets.jsx`).
- Testes: `LevelUpControllerTests` e helpers do front. Conferido no sandbox (Rudo Combatente do 1º ao 4º nível: PV 11 → 30, Aumento de Atributo +2 em Força, Técnica Apreender, Surto de Ação; prévia de multiclasse com Bruto).
- PostgreSQL existente: `ALTER TABLE "character" ALTER COLUMN build TYPE varchar(100000);` (ver backend.md).

## 2026-10-26 — Os 22 passados do Capítulo 4 (`feature/character-sheet`)
- `criacao.json`: os **22 passados** reais no lugar dos dois de exemplo, com texto e tabelas do livro, perícias (fixas e à escolha), ofícios, proficiências, equipamento (`EQUIPMENT`/`EQUIPMENT_CHOICE`), ouro e a Característica como passiva.
- `itens.json`: 32 itens citados só nos passados (grupo `item-de-passado`).
- `PROFICIENCY_CHOICE` aceita opções literais `ARMOR:<tipo>` e `WEAPON:<nome>` (Exilado, Pirata); front agrupa e nomeia essas opções.
- Com a riqueza inicial, o ouro da classe e do passado não entra (faz parte do equipamento trocado).
- Testes: `proficienciaDeArmaduraOuArmaAEscolha`, `passadosDoCapitulo4`. Conferido no sandbox (Combatente Pirata: Ahoy, Parceiro!, armas de fogo leves, cimitarra, arcabuz e munição, 10 PO).

## 2026-10-26 — Truques e magias conhecidas na criação (`feature/character-sheet`)
- Concessões `MYSTERY`, `SPELL` e `SPELL_CHOICE`, e FEATURE com `value: "MYSTERY"` (a opção escolhida vira Mistério). As escolhas de magia são montadas no fim da prévia com a lista da classe e os Mistérios do personagem; as magias viram habilidades `SPELL` da ficha.
- Ligado ao 1º nível: Acólito (3 truques), Arcanista (3 truques e 4 magias de 1º nível dos Mistérios), Xamã (2 truques), Ravasz, Cicatrizes Rúnicas, Arqueiro Rúnico, Espião e Combatente Arcano (2 truques); Mistérios fixos dos Ritos e Glifos; magias fixas (Poupar os Moribundos, Disparo Arcano, Manifestar Efígie, Mãos Mágicas).
- `ChoiceLine.optionNames`; front mostra o nome das magias e os rótulos das concessões novas nos cartões.
- Testes: `truquesDosMisteriosViramMagiasDaFicha` e rótulos no front. Conferido no sandbox (Arcanista Zhonya com Água e Fogo: 6 truques e 7 magias de 1º nível; Acólito da Sepultura: 15 truques e Poupar os Moribundos).

## 2026-10-26 — Rituais, tabelas, compêndio e a aba Livro (`feature/character-sheet`)
- `magias.json`: os **18 rituais** da Lista de Rituais (perícias, Rito exigido, rebote, língua, componentes) e **7 tabelas** (Conjuração Ritual, Trespassando, Rituais, Magia Púrpura, Magia Descontrolada Yordle, Essência e Golem). Conferidos ao subir.
- `rules/compendio.json` (`CompendiumService`): Familiares e Companheiros Animais, A Tecmaturgia e os 5 Aparatos, em seções e tabelas. Rotas `GET /compendium` e `GET /compendium/rituals`.
- Front: aba **LIVRO** na ficha (`BookTab.jsx`) com busca: magias (filtro por nível), rituais, tabelas e o compêndio.
- Com isso, todas as páginas da pasta `livro/` estão convertidas. As regras de consulta não são aplicadas na ficha (familiar, Ritualista, aparatos).
- Testes: `rituaisETabelasDoCapitulo`, `compendioDeConsulta`. Conferido no sandbox (aba Livro: 558 magias, 7 tabelas, 8 páginas do compêndio).

## 2026-10-26 — Catálogo de itens e equipamento inicial (`feature/character-sheet`)
- `rules/itens.json` com os **327 itens** do Capítulo 6 (armas simples, marciais, impróprias e de fogo, munições, armaduras, escudos, equipamento de aventureiro, focos, conjuntos de ofício, instrumentos, montarias, veículos, arreios e os 7 conjuntos de equipamento) e a riqueza inicial por classe. Conferido ao subir.
- Concessões `EQUIPMENT` e `EQUIPMENT_CHOICE` (opções com `+`, `*quantidade` e `group:` com preço máximo) e o equipamento inicial das 9 classes. Opção de trocar tudo pela **riqueza inicial** (`startingEquipment: WEALTH`, rolada ao criar).
- Na criação, o equipamento entra no **inventário** (`StartingEquipmentService`): armas e armaduras viram `Weapon`/`Armor` (a armadura já aparece como opção de defesa), conjuntos entram abertos. `Item.catalogId` novo; `item_description` e `effect` com 4000 caracteres (no PostgreSQL existente precisa de `ALTER TABLE`, ver backend.md).
- Front: troca equipamento/riqueza na etapa Escolhas, nomes dos itens nas opções (agrupadas por categoria) e o equipamento na ficha em construção.
- Testes: `equipamentoInicialVaiParaOInventario`, `riquezaInicialNoLugarDoEquipamento`, `EquipmentRulesTests` e helpers do front. Conferido no sandbox (Combatente: cota de malha CA 16 como defesa, alabarda, escudo leve, besta e o conjunto de aventureiro aberto no inventário).

## 2026-10-26 — Lista de magias e Natureza Rúnica (`feature/character-sheet`)
- `rules/magias.json`: as **558 magias** do Capítulo 10 (extraídas da Lista de Magias da wiki, a partir das páginas em `livro/`), com nível, Mistérios, listas de classe (`classes`) e de origem/linhagem (`origins`: Yordle, Fauhwoon, Ottrani), tempo, alcance, componentes/material, duração, concentração, ritual, texto e Em Níveis Superiores. Conferidas ao subir (Mistério, classe e origem existentes).
- `GET /creation/spells` devolve a lista; ela fica fora do `/creation/catalog` (`WRITE_ONLY`). `MagicRules.availableSpells` filtra por Mistério, classe e origem até um nível.
- **Runas**: 34 Runas e 48 Runessências no `recursos.json` (`kind: RUNA`, grupo = Pulso, `requires` de nível/Herança/atributo/Runa anterior), com usos de metade da proficiência (`RuleResource.uses`). **Natureza Rúnica** na criação (`runicNature` no `criacao.json`): escolha do Pulso Rúnico (Esmeralda, Rubi, Diamante, Ametista, Safira) e da Runa inicial.
- Testes: `naturezaRunicaComPulsoERuna`, `listaDeMagiasForaDoCatalogo`, `listaDeMagiasCompleta` e `magiasDisponiveisPorMisterioClasseEOrigem`. Conferido no sandbox (Yordle Acólito: Pulso Safira e Runa Cegar com 1 uso; 21 Runas liberadas no 1º nível, 61 bloqueadas por pré-requisito).
- Ainda não convertidas: Equipamento, Rituais, Familiares, tabelas de Magia Púrpura/Yordle, Transferindo Essências e Tecmaturgia.

## 2026-10-26 — Base do Capítulo 10: Mana, elementos e Mistérios (`feature/character-sheet`)
- `rules/magias.json`: tabela de Mana por nível de magia (0 a 21), 18 elementos com tipo de dano, componente e os caminhos de acesso, 33 Mistérios (Celestiais, Elementais e Espirituais, com a regra opcional de acesso) e os efeitos por tipo de dano. Lista de magias ainda vazia.
- `RuleMagic` no catálogo, conferido ao subir; `MagicRules` com o custo de Mana e o cálculo de elementos acessíveis.
- Testes: `MagicRulesTests` (com o arquivo real).

## 2026-10-26 — Pendências dos recursos de classe (`feature/character-sheet`)
- Escalas por nível: `Grant.valueByLevel` (amount do `AC_BONUS`/`ATTRIBUTE` e pés do `SPEED`), usado na Casca Grossa (+1 → +5) e nos deslocamentos dos Aspectos Ferais; a Arma Natural ganhou o ataque com dado 1d4 → 1d12.
- Ki inativado: os Vel com "N pontos de Ki" (`ki`) só aparecem com Ki suficiente e descontam os pontos da habilidade Ki.
- Pré-requisito de arma e armadura: `requires.weapons` e `requires.armor` (Arremesso de Escudo, Parede Protetora, Brincalhão e Trapaceiro, Choque Sísmico, Contusão Pulmonar, Movimento Circular).
- Fica pendente o truque conhecido da Rajada Etérea, que depende do catálogo de magias.
- Testes: `valorPeloNivelVenceOFixo` e o teste de recursos ampliado (Ki e arma). Conferido no sandbox (Presente da Serpente: Ki 2 → 1).

## 2026-10-26 — Recursos de classe do Capítulo 5 (`feature/character-sheet`)
- `rules/recursos.json` com **315** recursos: 34 Iras, 120 Sutras (gerais, de Bodisatva, das Doutrinas e das Escolas Shinobi), 19 Vel, 45 Técnicas de Combate, 38 Invocações Espirituais, 15 Grandes Espíritos e 44 Aspectos Ferais, com pré-requisitos conferidos pelo assistente.
- Concessão nova `RESOURCE_CHOICE`: o recurso escolhido vira uma fonte com a habilidade e as concessões dele (CA do Sutra do Vento e da Rocha, +2 da Potência do Búfalo, deslocamentos dos Aspectos Ferais, Ki, Sutra e Vel do Combatente Monástico...). Vel é opcional e conta pontos ◆. CA com dois atributos (`secondAttribute`).
- Ligado às classes: Técnicas (Combatente), Sutras, Vel e Shinpus (Bodisatva, Shojin, Shinobi), Iras (Bruto), Grande Espírito do Totem e Invocações (Xamã), Aspectos da Forma Selvagem (Metamorfo, com as três Formas Ferais na descrição).
- Front: `ResourceChoice.jsx`, cartões com pré-requisito e texto na etapa Escolhas.
- Testes: `recursosDeClasseComPreRequisitosVelEEscolhaInterna` e helpers do front. Conferido no sandbox (Bodisatva Shojin: 3 Sutras no 1º nível, Rocha dá CA 16 com FOR 14 e SAB 16).

## 2026-10-26 — Pendências mecânicas das classes (`feature/character-sheet`)
- O Estilo de Luta "Defesa sem Armadura" do Combatente vira uma opção de CA (10 + DES + CON) quando escolhido: `ArmorFormula.feature`/`featureOption`.
- Usos sem limite: valor `null` em `usesByLevel` (Fúria do Bruto, Forma Selvagem e Aura Etérea no 20º nível).
- Fórmulas novas: `PROFICIENCY_PLUS_ATTRIBUTE` (Receptáculo Etéreo) e `TWO_ATTRIBUTES` (Estratégia = INT + CAR).
- `SPEED` com `usesFormula: PROFICIENCY` (Brisa de Impulso: 5 pés × bônus) e `amount` como aumento se já tiver o deslocamento (Aptidão Marinha: Marai fica com natação 65).
- Testes em `CreationScalingTests`. Conferido no sandbox. Os recursos do Capítulo 5 (Sutras, Iras, Técnicas etc.) seguem aguardando as páginas.

## 2026-10-26 — As outras 7 classes (`feature/character-sheet`)
- **Acólito** (d8; Mana de conjurador pleno; Liturgia, Preservar a Vida, Chamado Sagrado, Intervenção Quintessencial) com os **7 Ritos**; **Atirador** (d8; armas de fogo, Armeiro, Astra, Bravura, Ardis) com as **5 Trilhas**; **Bodisatva** (d10; Ki, dado Marcial 1d6 → 1d12, Sutras, Estilos) com as **5 Doutrinas**; **Bruto** (d12; Fúria com usos e Dano de Fúria por nível, Defesa sem Armadura 10 + DES + CON, Iras) com as **3 Animas**; **Caçador** (d10; Inimigo Favorito, Explorador Natural, Consciência Primitiva, Trunfos) com os **3 Enclaves**; **Combatente** (d10; todas as armaduras, Estilos de Luta, Retomar o Fôlego, Surto de Ação, Indomável) com as **4 Honras**, no lugar do Lutador de exemplo; **Xamã** (d8; conjura com Ki, Totem, Aliados Espirituais/posturas, Canalização Espiritual) com os **4 Caminhos**. Do 1º ao 20º nível.
- Meia-conjuração (Ravasz, Cicatrizes Rúnicas, Arqueiro Rúnico) com Mana a partir do 3º nível; CAs alternativas da classe (Bruto, Duelista, Canalizador) como opções de defesa.
- Regra nova: `usesFormula` `LEVEL_PLUS_ATTRIBUTE`; a validação aceita `damageBonus` com `diceByLevel`. Front: Bruto e Combatente com os nomes do livro.
- Testes: fórmula nova em `CreationScalingTests`. Conferido no sandbox: as 45 combinações de classe e subclasse montam a prévia sem erro de regra (ex.: Bênção do Espírito 4 usos, Brisa de Impulso 40 pés, natação 30 do Rito das Marés, CA 14 do Bruto, Refinamento de Ki 1d6+2).

## 2026-10-26 — Classes Arcanista e Mercurial (`feature/character-sheet`)
- **Arcanista** (d6; INT + SAB ou CAR; Mana e Arcana por nível; Despertar Arcano, Mistérios, Metamagia, Assinatura Arcana, Magia de Assinatura, Sobrecarga, Força Arcana) com os **10 Glifos**, e **Mercurial** (d8; armaduras leves e suas armas; Chaveiro; Especialização em perícia ou ofício; Ataque Furtivo 1d6 → 10d6; Ação Ardilosa, Evasão, Essência Elusiva, Golpe de Sorte) com as **4 Cabalas**, do 1º ao 20º nível. O Arcanista de exemplo saiu; o Lutador continua de exemplo.
- Regras novas: subclasse (`subclasses`/`subclassLabel`, `subclassId`), `SAVING_THROW_CHOICE`, `ARMOR_PROFICIENCY`, `WEAPON_PROFICIENCY`, `EXPERTISE_CHOICE` com ofícios, `usesByLevel`/`diceByLevel`, escolha com `count` > 1, PV por atributo (`HALF_ATTRIBUTE_MODIFIER`), `requiresArmor` (Proteção Ajustável agora exige a proficiência).
- Decisões: sem catálogo de magias por enquanto; descanso pleno = longo; equipamento vai para um catálogo de itens (aguardando as tabelas).
- Front: Glifo/Cabala abaixo da classe no assistente; subclasse, armaduras, armas e especialidade em ofício na ficha.
- Testes: `classeComSubclasseProficienciasETabelasPorNivel`. Conferido no sandbox (Mercurial do Ás Rúnico: Munição Rúnica 1d6+2, Carga Rúnica 4 × 1d6, Ataque Furtivo 1d6).

## 2026-10-26 — Usos por opção, pré-requisitos alternativos e regras da mesa (`feature/character-sheet`)
- `optionUses` em habilidade com escolha e fórmula `HALF_ATTRIBUTE_MODIFIER`: Florescência (Charme Sobrenatural = metade do mod. de Carisma; Nictinastia, Sopro de Esporos e Sopro Polinizador = 1 por descanso) e Fibras (Cedro e Cerejeira = 1; Teixo = metade do bônus).
- Heranças com `anyOf` (caminhos alternativos: origem, linhagem, outra Herança com opção, opção de habilidade): Cauda Preênsil também para Meio-Vastaya Shimon/Oovi-Kat; Variante Glacinata só para Construto/Humano/Minotauro/Yordle, Troll do Gelo e Floral com Flor Gélida.
- Regras da mesa: tabela `table_setting`, `GET/PUT /creation/settings`; o mestre trava o modo de traços da Runinata na nova aba **Regras da mesa** e a etapa Traços respeita.
- Testes: `mestreTravaOModoDeTracos`, usos por opção e `anyOf` em `linhagemEObrigatoriaEValeComoPreRequisito`, validação do `anyOf`. Conferido no sandbox.

## 2026-10-26 — Força ou Destreza e especialidade (`feature/character-sheet`)
- `damageBonus` `STRENGTH_OR_DEXTERITY`: o dano usa o maior entre Força e Destreza. Aplicado nas Garras/Caudas do Meio-Dragão, Garras do Kiilash e Garras da Runinata.
- **Especialidade**: `CharacterSkill.expertise` (bônus de proficiência em dobro, inclusive nas passivas); `SkillResponse` e a prévia trazem `expertise`. Concessões: `SKILL`/`SKILL_CHOICE` com `expertise` ("caso já tenha, especialidade", decidido no fim, com todas as perícias) e `EXPERTISE_CHOICE` (especialidade em perícia que já tem). Técnicos do Nocti e traço Especialista da Runinata.
- Front: losango dourado duplo na perícia com especialidade; "especialidade" na ficha em construção.
- Testes: `especialidadeNasPericiasQueJaTem` e dano "Força ou Destreza" em `CreationScalingTests`. Conferido no sandbox (Garras do Kiilash 1d6+4 com Força 15; Runinata com Atletismo especialista +4).

## 2026-10-26 — Novas fórmulas de usos (`feature/character-sheet`)
- `usesFormula` ganha `DOUBLE_PROFICIENCY` e `HALF_LEVEL` (mínimo 1), e `usesPlus` soma um valor fixo à fórmula.
- Fúria Símia (dobro do bônus: 4 no 1º nível), Plumadagas (3 + bônus: 5) e Autossacrifício (metade do nível: 1) passam a ter contador na ficha.
- Testes em `CreationScalingTests`; conferido na prévia do sandbox.

## 2026-10-26 — Classe de Armadura e CAs alternativas (`feature/character-sheet`)
- Concessões `ARMOR_CLASS` (opção de defesa com fórmula) e `AC_BONUS` (bônus); a ficha guarda as regras (`character_armor_rules`) e a defesa em uso (`Character.defense`). `ArmorClassCalculator` junta sem armadura, CAs alternativas e armaduras do inventário (média até +2 de DES, pesada sem DES, RD).
- Catálogo: Pele de Árvore (10 + DES + CON, sem armadura), Proteção Ajustável do Construto (Nulo 11+DES, Leve 13+DES, Médio 16+DES máx. 2 RD 1, Pesado 19 RD 2 para Brutal/Emissário), Escorregadio (+ bônus de proficiência), Armadura Natural do Auroque (+1 sem armadura), Armadura Natural da Runinata (10 + DES + atributo à escolha).
- `GET /character/me` traz `armorClass`; `PATCH /character/me/defense` escolhe a defesa. Front: CA no herói (`ArmorClass.jsx`) com a lista de defesas, e na ficha em construção.
- Testes: CA na prévia e na ficha, troca de defesa, armadura média do inventário. Conferido no sandbox com um Construto Brutal (Pesado 19 RD 2 → Leve 15, salvo).

## 2026-10-26 — Tipos de deslocamento (`feature/character-sheet`)
- `SPEED` com `value` (`SWIM`, `CLIMB`, `FLY`, `BURROW`, `ALL`); a ficha guarda os outros deslocamentos em `character_speeds` (`MovementType`) e a ficha/prévia mandam `speeds`.
- Catálogo: Marai nada 50, Ottrani escala 20, Yordle Aquático nada 35, Feérico voa 30; traços Aquático, Escalador, Alado e Escavação da Runinata crescem 15, 15, 10… (`speedSteps`); Deslocamento reduzido tira de todos.
- Front: `SpeedToggle` no herói da ficha e na ficha em construção, clicar alterna o tipo exibido. Conferido no sandbox com um Marai (25 pés caminhada → 50 pés natação).

## 2026-10-26 — Variante Nebulon completa (`feature/character-sheet`)
- **Variante Nebulon** com o texto do livro (Memória Longeva, Essência não humanóide, Mente Centenária, Gasoso) e a perícia da Memória Longeva como opção da Herança. A Progressão Tecnológica já tinha o texto completo.

## 2026-10-26 — Ganhos por nível na origem e na linhagem (`feature/character-sheet`)
- `levels` em origem e linhagem (mesmo formato das classes, níveis 2 a 20), conferidos ao subir. Não entram na ficha de 1º nível; o cartão do assistente mostra "Ao subir de nível". Aplicação fica para a subida de nível.
- **Meio-Dragão**: sopro de cada essência no 2º (usos = bônus de proficiência, dano bônus×d6, área da essência), Forma Dracônica da essência no 8º (usos = metade do bônus, até 3 horas) e Resistência Dracônica no 15º (dano mágico da essência). Saíram as passivas de texto do 1º nível.
- Testes: validação de níveis em origem/linhagem e ganho de nível fora da prévia de 1º nível. Conferido no sandbox (cartão do Meio-Dragão).

## 2026-10-26 — Runinata com etapa de Traços e Variante Nebulon (`feature/character-sheet`)
- Origem **Runinata** (`usesTraits`): etapa **Traços** no assistente (`TraitStep.jsx`), com o modo combinado com o mestre (Controlado 3/2, Moderado 4/3, Forte 6/4), 50 traços (Menores, Maiores, Superiores) e 19 desvantagens em `rules/tracos.json`. O back confere vagas, pontos de Origem (desvantagens + conversão automática de até 1 traço de cada tipo), máximo, pré-requisito e resposta (`detail`); cada traço é uma fonte de concessões (perícias, ofícios e habilidades com opção vão para Escolhas). Sem Antecedente a Runinata não tem Passado. Herança Núcleo Dividido.
- Regras novas: pontos de Herança `GENERAL` (só Gerais), tamanho fixo vence `SIZE_CHOICE`, Herança com `requires` (outra Herança escolhida).
- **Variante Nebulon** como Herança de Origem do Construto; Gás Corrosivo, Ionizado e Termiônico passam a exigir a variante.
- Chicote de Espinhos do Floral soma Destreza; Chireano com pontos de Origem e região livre para o Troll confirmados.
- Testes: `runinataMontaAOrigemComTracos`, `conferenciaDosTracos`, `requires` de Herança e helpers de traços em `rules.test.js`. Conferido no sandbox: Runinata criada no navegador com traços, desvantagens e respostas.

## 2026-10-26 — Origens Antroplantæ, Chireano, Meio-Dragão, Troll, Vastaya e Yordle (`feature/character-sheet`)
- Seis origens novas no `criacao.json`, com as linhagens: **Antroplantæ** (Arbóreo com Fibras opcional, Floral com Florescência), **Chireano** (Nocti, Fulgor; tamanho pela colônia), **Meio-Dragão** (cinco essências, cada uma com resistência/fraqueza, três armas naturais, sopro e forma), **Troll** (da Areia, do Gelo, da Selva), **Vastaya** (oito tribos, deslocamento pela tribo) e **Yordle** (Aquáticos, Feérico, Felpudo com Mestres do Glamour).
- 66 Heranças de Origem novas no `herancas.json` (inclui as 3 do Nebulon, variante do Construto, que ficam invisíveis até a variante ser cadastrada); Variante Glacinata liberada para Antroplantæ e Troll.
- Leituras provisórias até o usuário confirmar: Chireano com pontos de Origem, Chicote de Espinhos sem Destreza, região livre para o Troll, traços do Meio-Dragão por nível em texto. Runinata fica para uma etapa própria.

## 2026-10-25 — Origem Construto (`feature/character-sheet`)
- Origem **Construto**: +2/+1 em atributos, tamanho Pequeno ou Médio, 2 pontos de Herança de Origem e 1 de Região, **Construto Vivo** e **Proteção Ajustável** (texto, com a tabela de modos), Peculiaridades e nomes no cartão.
- Modelos como linhagens: **Brutal** (Ultrapassar os Limites, Resistente com o tipo de dano à escolha), **Emissário** (Geolocalização, Funcional) e **Ligeiro** (Energia Cinética, Duelista).
- Regras novas: `FEATURE` com `options` (habilidade com escolha, ex.: "Resistente (Ígneo)") e `PROFICIENCY_CHOICE` (perícia, ofício ou arma marcial), com as opções em grupos no assistente.
- Heranças de Origem do Construto: Construção Primorosa (Brutal), Corpo Leve (Ligeiro), Eletrostático (Emissário), Essência Volátil, Força Pneumática, Modularidade, Puxão Biônico e Voltagem de Escape.

## 2026-10-25 — Linhagens do Minotauro (`feature/character-sheet`)
- **Linhagens** (tribos) como parte da origem: `lineages` no catálogo, `lineageId` na criação (obrigatório quando a origem tem), concessões com a fonte "Linhagem: …", `Character.lineage` e "Minotauro (Auroque)" na ficha.
- Minotauro: **Aelus** (Armadura da Percepção, Reativos ½PB/descanso), **Alnuk** (Armadura Muscular, Palavras de Conforto PB/descanso) e **Auroque** (Armadura Natural, Urro Triunfante com usos = mod. de CON).
- Nova fórmula de usos `ATTRIBUTE_MODIFIER`; Heranças com pré-requisito de linhagem conferido (Brutalizador, Hospitaleiro, Vislumbre Estelar).
- Front: tribos logo abaixo da origem no assistente. Testes: `linhagemEObrigatoriaEValeComoPreRequisito` e conferência de linhagem desconhecida.

## 2026-10-25 — Origem Minotauro (`feature/character-sheet`)
- Origem **Minotauro**: +2 em um atributo e +1 em outro, tamanho Pequeno ou Médio, 2 pontos de Herança de **Origem** e 1 de **Região**, **Chifres** (1d6 + proficiência + Força) e **Constituição Poderosa** (+½ do bônus de proficiência em PV por nível). Linhagens ficam para a próxima parte; idioma Minotáurico ignorado (idiomas desligados).
- Heranças de Origem do Minotauro: Brutalizador, Brutalidade de Combate, Espírito de Aço, Hospitaleiro, Selvagem e Vislumbre Estelar (as Variantes já existiam).
- Regras novas: escolhas de atributo da mesma fonte não repetem atributo; `HP_BONUS` com `usesFormula`; `damageBonus` em `FEATURE` (dano com os bônus somados, na prévia e na ficha).
- Arredondamento confirmado **para baixo** (os exemplos da Constituição Poderosa só fecham assim).
- Testes: `CreationScalingTests` (PV do livro, dano) e casos novos em `CreationControllerTests`.

## 2026-10-25 — Heranças, ofícios e idiomas desligados (`feature/character-sheet`)
- **Heranças** em `src/main/resources/rules/herancas.json` (122: 59 Gerais, 54 de Região e as 9 de Origem do Humano, com o texto completo do livro e das Variantes). Modelo `RuleHeritage` (tipo, origens, regiões, classes, atributo mínimo, "Inicial", exclusões, pré-requisito em texto, `maxTimes`, `options`), conferido ao subir.
- Assistente: etapa **Heranças** (`HeritageStep`) para gastar os pontos, com filtro por tipo, busca, motivo quando não dá para escolher, opção (tribo, fonte…) e repetição. O back confere tipo de ponto (`HERITAGE_POINTS.value`: REGION/ORIGIN/ANY), pré-requisitos, exclusões, `maxTimes`, opção e pontos sobrando.
- Ficha: Heranças pelo nome (`character_heritages`) no herói e como habilidades do novo tipo `HERITAGE` (grupo **Heranças** na aba Magias); `heritagePoints` passa a ser o que sobrou.
- **Ofícios**: os 22 (16 maiores, 6 menores, `kind` MAJOR/MINOR). O Humano escolhe um de verdade.
- **Idiomas desligados** a pedido: o Humano não escolhe idioma e a tela não mostra idiomas (a estrutura continua).
- Sandbox carrega as Heranças reais (`application-sandbox.properties`). Testes: casos de Heranças em `CreationControllerTests`, `RuleCatalogValidationTests` e `rules.test.js`.

## 2026-10-25 — Origem Humano e novos tipos de regra (`feature/character-sheet`)
- Primeira origem real: **Humano** (descrição, Idade/Tamanho/Passado/Região no cartão, tamanho Pequeno ou Médio, perícia e ofício à escolha, 2 pontos de Herança de Região, 1 idioma da região, habilidade **Inspirado**). As duas origens de exemplo saíram.
- Novas concessões: `SIZE`/`SIZE_CHOICE`, `CRAFT`/`CRAFT_CHOICE` (lista `crafts`), `LANGUAGE`/`LANGUAGE_CHOICE` (com `fromRegion`), `HERITAGE_POINTS`; habilidades que escalam com a proficiência (`usesFormula`, `diceByProficiency`, `rounding`).
- Região virou etapa própria e obrigatória do assistente, com idiomas por região. "Antecedente" passou a se chamar **Passado**, como no livro. Deslocamento em **pés**.
- Ficha: tamanho, idiomas, ofícios (pelo nome) e pontos de Herança de Região. Escolhas sem opções cadastradas viram aviso e não bloqueiam.
- Testes: `CreationScalingTests` e casos novos em `CreationControllerTests`/`RuleCatalogValidationTests`.

## 2026-10-25 — Estrutura da criação de personagem (`feature/character-sheet`)
- Regras de criação como dados: `src/main/resources/rules/criacao.json` (origens, classes com ganhos por nível, antecedentes, regiões, métodos de atributos), conferido ao subir (`RuleCatalogService`). Formato e lista do que falta em `docs/regras-criacao.md`. Conteúdo atual **de exemplo**.
- Concessões (`GrantType`): atributo fixo/à escolha, perícia fixa/à escolha, teste de resistência, passiva/habilidade/magia, PV, deslocamento e ouro.
- `GET /creation/catalog`, `POST /creation/preview` (ficha em construção) e `POST /creation` (cria no nível 1, ligada à conta). A prévia e a criação usam o mesmo cálculo.
- Ficha: `Character.account` (ligação real com a conta; fichas antigas seguem pelo nome), `origin`, `speed`, `savingThrows`, `build` (escolhas, para a subida de nível).
- Front: assistente de criação (Origem → Classe → Antecedente → Atributos → Escolhas → Detalhes) com a "Ficha em construção" ao vivo; ficha mostra origem, deslocamento e o card de resistências.
- Dev: `VITE_PROXY_TARGET` no Vite e back "sandbox" com H2 (`SandboxApplication`, configurações `backend-sandbox`/`frontend-sandbox`).
- Testes: `CreationControllerTests`, `RuleCatalogValidationTests` e rótulos das concessões no front.

## 2026-10-25 — Ritual de sangue no hover do Rudo (`feature/character-sheet`)
- Seleção de personagem: `effects/BloodMagic.jsx` (`fx: 'blood'`). Ao passar o mouse, um símbolo de ritual de sangue aparece de frente cobrindo o painel inteiro, se desenha, gira, cresce com a expansão do painel, pulsa e some em ~2 s.
- Substituiu a primeira versão (círculo deitado em perspectiva, gotas e filetes contínuos), que ficava estranha sobre a arte e atrapalhava a lore.
- Login do Rudo com borda e título em vermelho-sangue.

## 2026-10-25 — Animações em todo o site (`feature/character-sheet`)
- `styles/motion.css`: entradas em cascata, troca de conteúdo deslizando, pergaminho que se desenrola, selo e carimbo, brilhos periódicos (botão Rolar, barra de PV), zoom lento na arte, pulso no anel de nível e no selo NOVO, faíscas no 20 natural, losangos que reacendem em onda, toast com barra de tempo, flash dourado ao entrar.
- Números que contam até o valor (`useCountUp` + `Num`), sublinhado deslizante nas abas (`TabBar`, ficha e mestre), formulários que tremem no erro e itens apagados que encolhem antes de sair (`utils/motion.js`).
- Tudo desligado com `prefers-reduced-motion` (agora também nos `::before/::after`).

## 2026-10-25 — Imagens nos ícones das magias (`feature/character-sheet`)
- Back-end: `CharacterAbility.icon` (data URL de imagem ou link http(s), validado), aceito no cadastro e trocado/removido por `PATCH /character/{id}/abilities/{abilityId}/icon` (só mestre). Teste em `PlayerFeaturesTests`.
- Front-end: no painel do mestre, enviar/arrastar imagem, colar link ou remover; a imagem é recortada e reduzida para 128×128 WebP no navegador (`utils/iconImage.js`, com testes). Na lista, clicar no ícone troca a imagem de habilidades já existentes.
- Componente único `AbilityIcon` (aba Magias, barra rápida da Ficha, painel do mestre), com volta para a inicial se a imagem falhar.

## 2026-10-25 — Painel do mestre (`feature/character-sheet`)
- Front-end: botão **MESTRE** na tela inicial abre um portal de login (anéis hextech); o mestre logado vê o painel com as abas **Documentos** (escrever com prévia igual à do jogador, tipo, destinatários, enviados com apagar) e **Habilidades** (escolher personagem, cadastrar com prévia ao vivo, apagar).
- Back-end: `GET /character/{id}/abilities` e `GET /documents/recipients` (só mestre), com testes.
- Diagnóstico: o 404 ao criar anotação vinha de um back-end iniciado antes das rotas novas; registrado nas pendências.

## 2026-10-25 — Magias, documentos do mestre e anotações (`feature/character-sheet`)
- Back-end: papel de **mestre** (`Account.role`, conta `mestre` no seed, `AuthService.requireMaster` → 403).
- Magias e habilidades (`CharacterAbility`): o mestre cadastra/apaga; o jogador gasta usos e descansa (curto/longo). Vêm em `/character/me`.
- Documentos do mestre (`GameDocument` + `DocumentRead`): para todos ou para jogadores escolhidos, com marca de lido.
- Anotações do jogador (`PlayerNote`): CRUD isolado por conta.
- `CharacterResponse.hitDie` (dado de vida da classe). Testes em `PlayerFeaturesTests`.
- Front-end: abas **MAGIAS** (teclas Q/W/E/R/P, usos em losangos, descanso, rolagem de dano), **DOCUMENTOS** (pergaminho com selo, NOVO, carimbo de segredo) e **ANOTAÇÕES** (salvamento automático, fixar).
- Aba Ficha mais cheia: dados de vida, vantagem/desvantagem, barra rápida de habilidades, documentos recentes e anotação fixada. Barra do topo reorganizada para 5 abas; no celular o "Rolar d20" vira botão flutuante.

## 2026-10-25 — Inventário em aba própria (`feature/character-sheet`)
- A ficha ganhou as abas **FICHA** e **INVENTÁRIO** na barra do topo (também no celular).
- A aba de inventário tem grade maior, filtro por tipo, detalhe do item ao lado e valor estimado (`totalValue` em `rules.js`, com teste).

## 2026-10-25 — Correção: siglas dos atributos cortadas (`feature/character-sheet`)
- Em larguras médias os 6 hexágonos ficavam pequenos e o `clip-path` cortava a sigla (FOR, DES...). Agora atributos e estatísticas se ajustam à largura da coluna (container queries) e o texto escala com o hexágono.

## 2026-10-25 — Ficha do personagem pós-login (`feature/character-sheet`)
- Front-end: a tela pós-login provisória (`AccountPanel`) virou a **ficha do personagem** no estilo do cliente do LoL: splash com anel de nível e barra de PV, atributos em hexágonos, estatísticas, as 19 perícias com bônus, inventário em casas por raridade com dica de item, barra de carga e rolagem de d20 animada (crítico/falha crítica, atalho R).
- `data/rules.js` com os rótulos em PT e as regras derivadas dos atributos (+ testes).
- Back-end: `GET /character/me` (Bearer) devolve a ficha e o inventário do personagem da conta logada (ligação pelo nome).
- `CharacterResponse.skills` passou a trazer todas as perícias com `proficient` e `modifier`; as passivas agora somam o modificador do atributo.
- `Item`, `Weapon`, `Armor` e `PlayerItems` ganharam getters/setters (`Armor.getArmorWeight()` por causa do nome repetido).

## 2026-10-25 — Endpoint de criação de personagem (`main`)
- `POST /character` e `GET /character` expostos. Antes o JSON era ignorado (faltava `@RequestBody`) e o personagem chegava vazio na validação do Hibernate.
- Entrada pelo DTO `CreateCharacterRequest` (`@Valid`, mensagens em PT); o `CharacterService` resolve a classe pelo `CharacterClassType`, o antecedente pelo nome e cria os `CharacterSkill` proficientes.
- Saída pelo `CharacterResponse` (achatado, com bônus de proficiência e passivas).
- `Character` ganhou `@Getter @Setter` e `level` mínimo 1; `ApiExceptionHandler` trata JSON inválido/enum desconhecido.
- Testes `CharacterControllerTests` (H2).

## 2026-10-25 — Login real e troca de senha (`main`)
- Back-end: contas por personagem (`Account`) com senha BCrypt, tokens de sessão (`AuthToken`, guardados como SHA-256, 30 dias) e rotas `/auth/login`, `/auth/me`, `/auth/logout`, `/auth/password`.
- Seed das contas Rudo, Gaudron, Proto, Titan e Loge com senha inicial = nome do usuário e troca de senha sugerida no primeiro login.
- Front-end: `LoginForm` conectado à API, `PasswordForm` (troca de senha), `AccountPanel` (logado), sessão no `localStorage` e proxy do Vite para o Spring.
- Build: Lombok declarado como processador de anotações e atualizado para 1.18.48 (o back não compilava via Maven no JDK 27).
- Testes do back com H2 (`AuthControllerTests`) e do front para `api/auth.js` e validação de senha.
- Docs: branches atualizados (back e front já estão em `main`).

## 2026-10-25 — Tela de seleção de personagem em React + documentação (`feature/frontend-react-login`)
- Front-end migrado de JS puro para **React 18 + Vite** (`@vitejs/plugin-react`).
- Tela de seleção de personagem portada do protótipo HTML: painéis animados por mola, divisórias douradas, vídeos do Rudo e do Gaudron, efeitos de brasas, impacto e burst, e login por personagem.
- Imagens e vídeos extraídos do HTML (base64) para `frontend/src/assets/characters/`.
- Removida a tela de login antiga do Copilot (`main.js`, `style.css`); `validation.js` reescrito para usuário e senha.
- Criada a pasta `docs/` (visão geral, back-end, front-end, changelog) e o `CLAUDE.md`.

## 2026-10-23 — Seed do banco e perícias (`feature/inventory`)
- Entidades de personagem, antecedentes, itens e classes; enums de domínio; perícias (`SkillType`).
