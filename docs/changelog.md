# Changelog

Entradas mais recentes no topo. Formato: `## AAAA-MM-DD — título (branch)`.

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
