# Changelog

Entradas mais recentes no topo. Formato: `## AAAA-MM-DD — título (branch)`.

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
