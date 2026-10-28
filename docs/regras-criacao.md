# Regras de criação de personagem

As regras do assistente de criação (o que cada origem, região, classe e passado concede) **não ficam no código**: ficam em
[`src/main/resources/rules/criacao.json`](../src/main/resources/rules/criacao.json) e, as Heranças, em [`rules/herancas.json`](../src/main/resources/rules/herancas.json). Mudou uma regra, muda só o arquivo.

- O back confere o arquivo ao subir (`RuleCatalogService`). Erro de digitação (chave errada, perícia inexistente, classe que não existe…) **impede o back de subir** com uma mensagem dizendo onde está o problema, por exemplo: `origens elfo, concessão 2 (SKILL): precisa de skill`.
- O teste `RuleCatalogValidationTests.oCatalogoRealSobeSemErros` roda a mesma conferência no `./mvnw test`.
- Os testes automatizados usam outro arquivo (`src/test/resources/rules/criacao-teste.json`), então trocar as regras reais não quebra os testes.
- Todo item com `"example": true` aparece no site com a etiqueta **EXEMPLO**: é conteúdo provisório, a trocar pelas regras reais do Runarcana.
- "Passado" é o nome do livro para o que o código chama de `backgrounds` (entidade `Background`).

## Estado atual

| Parte | Situação |
|---|---|
| Origens | **Humano**, **Minotauro** (Aelus, Alnuk, Auroque), **Construto** (Brutal, Emissário, Ligeiro), **Antroplantæ** (Arbóreo, Floral), **Chireano** (Nocti, Fulgor), **Meio-Dragão** (Glacial, Infernal, Montanha, Nuvens, Oceano), **Troll** (da Areia, do Gelo, da Selva), **Vastaya** (Oovi-Kat, Marai, Shimon, Fauhwoon, Ottrani, Kiilash, Lhotlan, Vesani) e **Yordle** (Aquáticos, Feérico, Felpudo) e **Runinata** (monta a origem com traços, ver **Traços da Runinata**). Nebulon é um tipo de Construto, não uma origem: é a Herança **Variante Nebulon** |
| Traços | **50** traços (Menores, Maiores e Superiores) e **19** desvantagens em `rules/tracos.json`, com os três modos (Controlado, Moderado, Forte) |
| Recursos de classe (Capítulo 5) | **315** em `rules/recursos.json`: 34 Iras, 120 Sutras, 19 Vel, 45 Técnicas de Combate, 38 Invocações Espirituais, 15 Grandes Espíritos e 44 Aspectos Ferais (23 terrestres, 14 aquáticos, 7 alados) |
| Aprimoramentos (Capítulo 5) | **96** da wiki + os 2 aumentos de atributo (+2 em um, +1 em dois) em `rules/aprimoramentos.json`, escolhidos no Aprimoramento das classes (níveis 4, 8, 12, 16 e 19; Combatente também no 14, Mercurial no 10) |
| Multiclasse | Pré-requisitos e Proficiências de Multiclasse das 9 classes (`multiclass` em cada classe do `criacao.json`) |
| Runas (Capítulo 5) | **82** no `rules/recursos.json` (kind `RUNA`): 34 Runas e 48 Runessências (16 árvores). Natureza Rúnica (Pulso + Runa inicial) em `runicNature` do `criacao.json` |
| Itens (Capítulo 6) | **359** em `rules/itens.json` (327 das tabelas + 32 itens citados só nos Passados, grupo `item-de-passado`): 113 armas (simples, marciais, impróprias e de fogo), 10 munições, 15 armaduras, 4 escudos, 85 itens de aventureiro, 12 focos e símbolos sagrados, 40 conjuntos de ofício, 12 instrumentos, 12 montarias, 6 veículos aquáticos, 11 arreios e veículos de tração e 7 conjuntos de equipamento. Equipamento inicial das 9 classes e riqueza inicial |
| Magias (Capítulo 10) | **558** em `rules/magias.json`, com Mistérios e as listas de classe e de origem. Truques e magias conhecidas do 1º nível escolhidos no assistente; as dos níveis seguintes, na subida de nível |
| Regiões | As 14 do enum |
| Idiomas | **Desligados** por enquanto (o Humano não escolhe idioma; a estrutura `LANGUAGE`/`LANGUAGE_CHOICE` continua disponível) |
| Ofícios | Os **22** (16 maiores, 6 menores), sem atributo base nem níveis ainda |
| Heranças | **204** em `rules/herancas.json`: 59 Gerais, 54 de Região e 91 de Origem (todas as origens, a Variante Nebulon e as 3 do Nebulon, que exigem a variante por `requires`) |
| Classes | As **9 classes** completas, do 1º ao 20º nível: Acólito (7 Ritos), Arcanista (10 Glifos), Atirador (5 Trilhas), Bodisatva (5 Doutrinas), Bruto (3 Animas), Caçador (3 Enclaves), Combatente (4 Honras; id `FIGHTER`), Mercurial (4 Cabalas) e Xamã (4 Caminhos) |
| Passados | Os **22** do Capítulo 4 (Andarilho, Apostador, Aristocrata, Artesão, Artista, Charlatão, Criação, Criminoso, Desconhecido, Estudioso, Exilado, Forasteiro, Gladiador, Herói Local, Inventor, Investigador, Marujo, Mercenário, Órfão, Pirata, Religioso, Soldado), com perícias, ofícios, proficiências, equipamento, ouro e a Característica |
| Métodos de atributos | Os três do livro (Criação de Personagem, Determinando Valor de Atributos), conferidos: compra de pontos (27, de 8 a 15, custos 0/1/2/3/4/5/7/9), valores fixos 15, 14, 13, 12, 10 e 8 e rolagem 4d6 descartando o menor (o "manual" do assistente). O livro diz que o mestre escolhe o método; hoje os três ficam liberados |

Escolhas sem opções cadastradas aparecem no assistente como aviso e **não bloqueiam** a criação.

## Formato

```jsonc
{
  "attributeMethods": {                 // métodos de atributos; um método ausente fica desligado
    "pointBuy": { "points": 27, "min": 8, "max": 15, "costs": { "8": 0, "9": 1, ... "15": 9 } },
    "standardArray": [15, 14, 13, 12, 10, 8],
    "manual": { "min": 3, "max": 18 }    // digitar ou rolar 4d6 (descarta o menor)
  },
  "baseSpeed": 30,                       // deslocamento padrão em PÉS quando a origem não diz
  "rounding": "DOWN",                    // arredondamento de "metade do bônus de proficiência": DOWN ou UP
  "crafts": [ { "id": "alquimista", "name": "Alquimista", "kind": "MAJOR" } ],   // ofícios: MAJOR (maior) ou MINOR (menor)
  "origins":     [ { "id", "name", "description", "example", "speed", "startingGold", "details", "grants": [...],
                     "levels": [ { "level": 2, "grants": [...] } ],   // ganhos do 2º nível em diante, opcional
                     "lineages": [ { "id", "name", "description", "grants": [...], "levels": [...] } ] } ],   // linhagens (tribos), opcional
  "regions":     [ { "id", "name", "languages": ["..."], "grants": [...] } ],
  "classes":     [ { "id", "name", "description", "example", "hitDie", "startingGold", "grants": [...],
                     "subclassLabel": "Glifo", "subclasses": [ { "id", "name", "description", "grants": [...], "levels": [...] } ],
                     "levels": [ { "level": 2, "grants": [...] }, ... ] } ],
  "backgrounds": [ { "id", "name", "description", "example", "startingGold", "grants": [...] } ]
}
```

- `lineages` da origem: quando existem, escolher uma é **obrigatório** (aparece logo abaixo da origem no assistente). As concessões da linhagem entram com a fonte "Linhagem: …" e a chave de escolha `lineage:<id>:<índice>`. A ficha guarda o nome (`Character.lineage`) e mostra "Minotauro (Auroque)".
- `details`: textos do cartão, como `{ "name": "Idade", "text": "..." }` (Idade, Tamanho, observações).
- `id` das **classes** tem de ser um destes: `ACOLYTE, ARCANIST, MARKSMAN, BODHISATTVA, BRUTE, HUNTER, FIGHTER, MERCURIAL, SHAMAN`. Os das **regiões**, um valor do enum `Region` (`TARGON`, `NOXUS`…). Origens, passados e ofícios usam qualquer id (ex.: `"vastaya"`).
- A **região é obrigatória** quando há regiões no catálogo (tem etapa própria no assistente, logo depois da origem). `languages` da região alimenta o `LANGUAGE_CHOICE` com `fromRegion`.
- `hitDie` é o lado do dado de vida (6 = d6). PV no 1º nível = `hitDie` + mod. de CON + bônus de PV.
- `grants` da classe = o que ganha no **1º nível**. `levels` = o que ganha do 2º em diante (para a subida de nível, que vem depois).
- Origem e linhagem também podem ter `levels`, no mesmo formato (níveis de 2 a 20, cada um uma vez). Na criação (1º nível) eles **não entram** na ficha; o cartão do assistente mostra "Ao subir de nível" com o que vem em cada nível, e a subida de nível vai aplicá-los junto com os da classe. Hoje usado pelo **Meio-Dragão**: sopro da essência no 2º (usos = bônus de proficiência, dano = bônus×d6), Forma Dracônica no 8º (usos = metade do bônus) e Resistência Dracônica no 15º.
- Ouro inicial = soma dos `startingGold` da classe, do passado e da origem, mais concessões `GOLD`.
- Deslocamento sempre em **pés**, como no livro.

## Concessões (`grants`)

| `type` | Campos | O que faz |
|---|---|---|
| `ATTRIBUTE` | `attribute`, `amount` | +amount no atributo (pode ser negativo) |
| `ATTRIBUTE_CHOICE` | `count`, `amount`, `options`?, `label`? | Escolhe `count` atributos (de `options`; sem = qualquer um) para +amount. Duas escolhas da **mesma fonte** não repetem atributo ("+2 em um atributo e +1 em outro" = duas concessões) |
| `SKILL` | `skill`, `expertise`? | Proficiência fixa na perícia. Com `expertise: true` ("caso já tenha, especialidade"), se o personagem já tiver a perícia (de qualquer fonte), ganha **especialidade** |
| `SKILL_CHOICE` | `count`, `options`?, `label`?, `expertise`? | Escolhe `count` perícias (sem `options` = qualquer uma); as que ele já tem somem das opções. Com `expertise: true` elas continuam, e escolher uma que já tem dá especialidade (Técnicos do Nocti) |
| `EXPERTISE_CHOICE` | `count`, `options`?, `label`?, `value`? | **Especialidade** em `count` perícias que o personagem já tem (traço Especialista). Especialidade soma o bônus de proficiência duas vezes. Com `value: "WITH_CRAFTS"`, também ofícios que ele tem (opções `SKILL:...`/`CRAFT:...`; Especialização do Mercurial; ficha: `craftExpertise`) |
| `SAVING_THROW` | `attribute` | Proficiência no teste de resistência |
| `SAVING_THROW_CHOICE` | `count`, `options` (atributos), `label`? | Resistência à escolha (Arcanista: Sabedoria ou Carisma) |
| `ARMOR_PROFICIENCY` | `value` (`LIGHT`, `MEDIUM`, `HEAVY`, `SHIELD`) | Proficiência com armaduras (ficha: `armorProficiencies`) |
| `WEAPON_PROFICIENCY` | `value` (o nome: "Armas simples", "Rapieiras") | Proficiência com armas (ficha: `weaponProficiencies`) |
| `SIZE` | `value` (`TINY`/`SMALL`/`MEDIUM`/`LARGE`/`HUGE`) | Tamanho fixo |
| `SIZE_CHOICE` | `options`, `label`? | Escolhe o tamanho entre as opções |
| `CRAFT` | `value` (id de `crafts`) | Proficiência fixa num ofício |
| `CRAFT_CHOICE` | `count`, `options`?, `label`? | Escolhe ofícios (sem `options` = todos de `crafts`) |
| `LANGUAGE` | `value` (nome) | Idioma fixo |
| `LANGUAGE_CHOICE` | `count`, `options`? ou `fromRegion: true`, `label`? | Escolhe idiomas da lista ou da região escolhida |
| `RESOURCE_CHOICE` | `value` (tipo: `IRA`, `SUTRA`, `VEL`, `TECNICA`, `INVOCACAO`, `GRANDE_ESPIRITO`, `ASPECTO_TERRESTRE`, `ASPECTO_AQUATICO`, `ASPECTO_ALADO`), `count`, `options`? (grupos aceitos), `label`?; Vel usa `amount` (pontos ◆) | Escolha de recurso de classe (`rules/recursos.json`). Só aparecem os que cumprem o pré-requisito; o recurso escolhido vira uma fonte ("Sutra: Rocha") com a habilidade e as concessões dele, e pode trazer outra escolha. Vel é opcional e soma o custo ◆ |
| `HERITAGE_POINTS` | `amount`, `value`? (`REGION`/`ORIGIN`/`ANY`), `label`? | +pontos de Herança do tipo (ver **Heranças**; sem `value` = `ANY`) |
| `PROFICIENCY_CHOICE` | `count`, `options`? (`SKILL`/`CRAFT`/`MARTIAL_WEAPON`; sem = os três; ou opções literais `ARMOR:LIGHT` e `WEAPON:<nome>`), `label`? | Proficiência à escolha entre perícia, ofício e arma marcial (Funcional do Emissário), ou entre armaduras/armas específicas (Exilado: leves ou médias; Pirata: categoria de armas de fogo). Perícia, ofício, armadura e arma entram na ficha; "arma marcial" vira a passiva "Proficiência em arma marcial". Opções na chave: `SKILL:ARCANA`, `CRAFT:alquimista`, `ARMOR:LIGHT`, `WEAPON:Armas de fogo leves`, `MARTIAL_WEAPON` |
| `FEATURE` | `name`, `description`, `abilityType` (`PASSIVE`/`ABILITY`/`SPELL`), `spellLevel`, `damage` ("2d6+4"), `maxUses` **ou** `usesFormula`, `diceByProficiency`, `recharge` (`SHORT_REST`/`LONG_REST`/`NONE`), `castingTime`, `range`, `duration`, `components`, `options` (habilidade com escolha: o jogador escolhe 1 e ela vira "Resistente (Ígneo)"), `damageBonus` (somado ao dado: `PROFICIENCY`, `HALF_PROFICIENCY`, um atributo ou `STRENGTH_OR_DEXTERITY` = o maior entre Força e Destreza, para o "Força ou Destreza" do livro; ex.: `["PROFICIENCY", "STRENGTH"]` → Chifres 1d6+5 com Força 17) | Vira uma passiva, habilidade ou magia na aba **Magias** |
| `HP_BONUS` | `amount` **ou** `usesFormula`, `perLevel`?, `label`? | +PV (`perLevel` marca que se repete a cada nível). Com `usesFormula` (`HALF_PROFICIENCY`/`PROFICIENCY`) o valor sai do bônus de proficiência do nível: a Constituição Poderosa do Minotauro dá +1 no 1º nível e +12 até o 10º |
| `SPEED` | `feet`, `value`? (`WALK`, `SWIM`, `CLIMB`, `FLY`, `BURROW` ou `ALL`), `usesFormula`? (`PROFICIENCY`), `amount`? | +deslocamento em pés. Sem `value` = caminhada; `SWIM` natação, `CLIMB` escalada, `FLY` voo, `BURROW` escavação (ex.: Marai nada 50); `ALL` soma (ou tira) de todos os deslocamentos que o personagem tiver. `usesFormula: PROFICIENCY` multiplica `feet` pelo bônus de proficiência (Brisa de Impulso: 5 pés × bônus). `amount` (só `SWIM`/`CLIMB`/`FLY`/`BURROW`): aumento quando ele já tem esse deslocamento de outra fonte (Aptidão Marinha: natação 30, ou +15). Na ficha, clicar no deslocamento alterna entre os tipos |
| `GOLD` | `amount` | +ouro inicial |
| `ARMOR_CLASS` | `name`, `armor` { `base`, `dex` (padrão true), `dexMax`, `attribute`, `proficiency`, `reduction`, `blocksArmor`, `requiresArmor`, `feature`, `featureOption` }, `options`?, `label`? | Uma **opção de defesa** (CA alternativa): base + mod. de Destreza (limitado por `dexMax`) + mod. de `attribute` + proficiência, com RD = `reduction`. Com `options` (atributos), o jogador escolhe o atributo somado (Armadura Natural da Runinata). `blocksArmor`: as armaduras do inventário deixam de servir. `requiresArmor` (`MEDIUM`/`HEAVY`): a opção só aparece com essa proficiência (modos Médio e Pesado da Proteção Ajustável). `feature` + `featureOption`: a opção só aparece se o jogador escolheu essa opção nessa habilidade (Estilo de Luta "Defesa sem Armadura" do Combatente). Ex.: Pele de Árvore, modos da Proteção Ajustável |
| `AC_BONUS` | `name`, `amount` ou `usesFormula: PROFICIENCY`, `armor` { `unarmoredOnly`, `blocksArmor` }? | **Bônus de CA** somado à defesa em uso (Escorregadio + bônus de proficiência; Armadura Natural do Auroque +1 só sem armadura) |

**Habilidades que escalam** (`FEATURE`): `usesFormula` = `FIXED` (usa `maxUses`), `HALF_PROFICIENCY` (metade do bônus de proficiência, arredondada por `rounding`, mínimo 1), `PROFICIENCY`, `ATTRIBUTE_MODIFIER` (modificador do `attribute` da concessão, mínimo 1; ex.: Urro Triunfante = mod. de Constituição), `DOUBLE_PROFICIENCY` (dobro do bônus; Fúria Símia), `HALF_LEVEL` (metade do nível do personagem, mínimo 1; Autossacrifício) , `HALF_ATTRIBUTE_MODIFIER` (metade do mod. do `attribute`, mínimo 1) , `LEVEL_PLUS_ATTRIBUTE` (nível do personagem + mod. do `attribute`, mínimo 1; Bênção do Espírito do Acólito), `PROFICIENCY_PLUS_ATTRIBUTE` (bônus de proficiência + mod. do `attribute`; Receptáculo Etéreo) ou `TWO_ATTRIBUTES` (mod. do `attribute` + mod. do atributo em `value`, mínimo 1; Estratégia do Strategos). `usesPlus` soma um valor fixo à fórmula (Plumadagas: `PROFICIENCY` + 3). Habilidade com escolha (`options`) pode ter **usos por opção** em `optionUses`: `{ "Charme Sobrenatural": { "usesFormula": "HALF_ATTRIBUTE_MODIFIER", "attribute": "CHARISMA", "recharge": "LONG_REST" }, "Cedro": { "maxUses": 1 } }` (campos: `usesFormula`, `maxUses`, `attribute`, `usesPlus`, `recharge`); as opções sem entrada ficam sem contador. **Pelo nível do personagem**: `usesByLevel` (`{ "1": 4, "2": 6, ... }`, Mana do Arcanista; vence `usesFormula`), `valueByLevel` (em `ATTRIBUTE`, `AC_BONUS` e `SPEED`: o `amount` ou os pés pelo nível, ex.: Casca Grossa `{ "1": 1, "6": 2, ... }`; no `SPEED` com `amount`, o aumento "se já tiver" cresce junto) e `diceByLevel` (`{ "1": "1d6", "3": "2d6", ... }`, Ataque Furtivo; vence `damage`), valendo o maior nível atingido; valor `null` na tabela = **sem limite** a partir desse nível, sem contador (Fúria do Bruto, Forma Selvagem e Aura Etérea no 20º). Habilidade com escolha aceita `count` > 1 ("Metamagia: escolha duas"; o nome fica "Metamagia (A, B)"). `HP_BONUS` aceita `usesFormula` `ATTRIBUTE_MODIFIER`/`HALF_ATTRIBUTE_MODIFIER` com `attribute` (mínimo 0; Pacto Carmesim). "Descanso pleno" do livro é cadastrado como `LONG_REST` (decisão do usuário: pleno = longo). `diceByProficiency` = dado por bônus, valendo o maior bônus atingido, ex.: `{ "2": "1d4", "4": "1d6", "6": "1d8" }`. Na criação (nível 1, bônus +2) o Inspirado do Humano fica com 1 uso de 1d4; a subida de nível vai recalcular. O arredondamento é **para baixo**: os exemplos da Constituição Poderosa do Minotauro (+1 no 1º nível, +12 no 10º) só fecham assim.

Atributos: `STRENGTH, DEXTERITY, CONSTITUTION, INTELLIGENCE, WISDOM, CHARISMA`.
Perícias: `ATHLETICS, ACROBATICS, SLEIGHT_OF_HAND, STEALTH, ARCANA, HISTORY, INVESTIGATION, NATURE, RELIGION, TECHNOLOGY, INSIGHT, ANIMAL_HANDLING, MEDICINE, PERCEPTION, SURVIVAL, DECEPTION, INTIMIDATION, PERFORMANCE, PERSUASION`.

O Humano no `criacao.json` é o exemplo real de uma origem completa.

## Heranças (`rules/herancas.json`)

Arquivo à parte (são muitas e com texto longo), no formato `{ "heritages": [ ... ] }`, conferido junto com o resto ao subir.

```jsonc
{
  "id": "abastado",                 // único
  "name": "Abastado",
  "category": "REGION",             // GENERAL (Geral), ORIGIN (de Origem) ou REGION (de Região)
  "origins": ["humano"],            // ORIGIN: de quais origens é (obrigatório). Em outra categoria = pré-requisito de origem
  "regions": ["PILTOVER"],          // REGION: de quais regiões é (obrigatório; ids do enum Region)
  "lineages": ["auroque"],          // pré-requisito de linhagem (ids das lineages das origens)
  "classes": ["ACOLYTE"],           // pré-requisito de classe
  "minAttributes": { "STRENGTH": 16 },  // pré-requisito de atributo (total, com os bônus da criação)
  "initial": true,                  // "Inicial": só na criação
  "excludes": ["operario"],         // não pode junto com essas Heranças
  "requires": ["variante-nebulon"], // precisa ter escolhido pelo menos uma destas Heranças
  "anyOf": [                        // caminhos alternativos (basta um; substitui origins/lineages na conferência).
    { "lineages": ["shimon", "oovi-kat"] },                                       // cada caminho: todos os campos
    { "heritage": "variante-meio-vastaya", "heritageOptions": ["Shimon", "Oovi-Kat"] },  // preenchidos precisam bater
    { "lineages": ["floral"], "feature": "Florescência", "featureOptions": ["Flor Gélida"] }  // opção de habilidade com escolha
  ],
  "prerequisite": "Piltovense, não ter as Heranças Operário ou Privilegiado",  // o texto do livro, sempre mostrado
  "maxTimes": 2,                    // quantas vezes pode ser escolhida (padrão 1)
  "options": ["Marai", "Shimon"],   // sub-escolha obrigatória (tribo do Meio-Vastaya, fonte da Progressão Tecnológica...)
  "description": "Texto completo do livro (vira a habilidade na aba Magias)."
}
```

Como os pontos funcionam no assistente:
- Cada Herança custa **1 ponto**. O tipo do ponto vem da concessão `HERITAGE_POINTS` da origem: `REGION` compra Heranças **de Região** (da região escolhida) e **Gerais**; `ORIGIN` compra **de Origem** e **Gerais**; `GENERAL` só compra **Gerais** (traço Herança da Runinata); `ANY` compra qualquer uma. O Humano tem 2 pontos `REGION` ("Receba 2 pontos de Herança de Região").
- Os pré-requisitos de origem, linhagem, região, classe, atributo mínimo, `requires` e `excludes` são conferidos sozinhos. O resto do texto (ex.: "Conjuração", "proficiência com arma de fogo") **só é mostrado**: confira com o mestre.
- Ponto sobrando com alguma Herança disponível impede a criação.
- O efeito de cada Herança é o **texto**: ela vira uma habilidade do tipo Herança na ficha. Nenhum bônus é aplicado sozinho ainda.
- Níveis 5, 9, 13 e 17 (Heranças de Origem e Gerais, sem as de Região nem as "Inicial") entram com a subida de nível.

As Variantes do Humano levam o texto completo do capítulo "Heranças Variantes": Anfíbio, Colosso, Progressão Tecnológica e Ressurgido podem ser escolhidas 2 vezes; Meio-Vastaya, Progressão Tecnológica e Ressurgido pedem a opção. A Glacinata usa o texto da Natividade Elemental.

## Magia (`rules/magias.json`)

Capítulo 10, carregado e conferido ao subir (`runarcana.rules.magic`; os testes do Spring usam `rules/magias-teste.json`). Tem a **lista de magias** completa (558), ligada às classes pelas concessões de magia (ver **Magias na criação**).

```
{ "manaCost": { "0": 0, "1": 2, "2": 3, "3": 5, "4": 6, "5": 7, "6": 9, "7": 12, "8": 16, "9": 21 },
  "elements": [ { "id": "veneno", "name", "tier": "TRANSITION", "damage": "Venenoso", "material": "Jade", "description",
                  "access": [ ["agua", "fogo"], ["agua", "sombrio"] ] } ],   // caminhos alternativos; cada um exige tudo
  "mysteries": [ { "id": "hemomancia", "name", "source": "SPIRITUAL", "description", "optionalAccess": ["veneno", "metal"] },
                 { "id": "agua", "source": "ELEMENTAL", "element": "agua" } ],
  "damageEffects": [ { "damage": "Gélido", "effect": "..." } ],
  "rituals": [ { "id", "name", "level": 1-6, "skills": ["ARCANA", "NATURE", "RELIGION"], "prerequisite": "Rito Espiritual",
                 "subclasses": ["espiritual"], "backlashAt": 3, "backlash", "language", "duration", "components", "description" } ],
  "tables": [ { "id": "magia-purpura", "name", "description", "columns": ["d100", "Efeito"], "rows": [["01", "..."]] } ],
  "spells": [ { "id", "name", "level": 0-9, "mysteries": ["agua"], "classes": ["ACOLYTE"], "origins": ["yordle", "fauhwoon"],
                "castingTime", "range", "components", "material", "duration", "concentration", "ritual",
                "description", "higherLevels" } ] }
```

- **Elementos** (18): primários (Água, Fogo, Terra, Vento: acesso livre), secundários (Flora, Gelo, Magma, Tempestade: um dos dois primários ligados), de transição (Deserto, Inferno, Som, Veneno: o primário + o oposto, ou o primário + Sombrio), primordiais (Luz: Herança Manifestação Primordial ou os quatro primários; Sombrio: a Herança ou dois primários opostos) e terciários (Cristal, Metal, Nevasca, Ártico: os dois secundários). Exigência de Herança no caminho: `"heritage:<id>"`. O acesso é calculado pelos elementos **manifestos** (`MagicRules.accessibleElements`).
- **Mistérios** (33): 4 Celestiais, 19 Elementais (um por elemento + Elemental Geral) e 10 Espirituais. `optionalAccess` é a regra opcional "Acesso aos Elementos": quem tem algum Mistério Elemental ganha acesso aos elementos ligados aos seus Mistérios Espirituais.
- **Mana**: `MagicRules.manaCost(nível)`. O Ártico ainda está sem tipo de dano e componente (não estão na tabela do livro).
- **Magias** (558: 52 truques, 74 de 1º, 82 de 2º, 69 de 3º, 51 de 4º, 51 de 5º, 51 de 6º, 40 de 7º, 38 de 8º e 50 de 9º; 44 rituais), extraídas da Lista de Magias da wiki. `mysteries` vem da classificação ("Elemental (água ou cristal) ou Espiritual (transmutação)" → `agua`, `cristal`, `transmutacao`). `classes` são as listas "Feitiços de …" (Acólito, Atirador, Bruto, Caçador, Combatente, Mercurial, Xamã; o Arcanista e o Bodisatva não têm lista própria) e `origins` as de origem/linhagem (Yordle, Fauhwoon, Ottrani). As 14 "Especiais" (as do 20º nível dos Glifos, Rajada Mística, Pulso de Statikk, Manifestar Efígie) não têm Mistério; o texto diz quem as recebe. `material` é o que vem entre parênteses no componente M.
- **Magias disponíveis**: `MagicRules.availableSpells(magia, Mistérios, classe, origens, nível máximo)`, basta uma das três fontes. A lista sai em `GET /creation/spells` (fora do `/creation/catalog`).

## Magias na criação

- `MYSTERY` (`value`: id do Mistério): Mistérios fixos dos Ritos (Espiritual → Adivinhação, Estrelas → Étermancia, Forja → Transmutação, Marés → Água, Natureza → Flora, Sepultura → Necromancia, Tempestade → Tempestade) e dos Glifos (Cinzas, Efígie, Escarlate, Ígneo, Púrpura, Tecelã, Zhonya).
- FEATURE com `value: "MYSTERY"`: as opções são nomes de Mistérios ("Água (Elemental)", "Infernal" = Inferno); a escolhida vira Mistério. Usado em Lista de Magias e Mistério do Despertar do Arcanista, Domar Elementos (Elementalista) e Truque Adicional (Magus).
- `SPELL` (`value`: id da magia): magia conhecida que não conta nos limites (Poupar os Moribundos da Sepultura, Disparo Arcano do Magus, Manifestar Efígie, Mãos Mágicas do Espião).
- `SPELL_CHOICE` (`count`, `spellLevel`: 0 = truques, N = do 1º ao Nº nível; `value`: `CLASS` = lista da classe, `MYSTERIES` = Mistérios do personagem, `CLASS_OR_MYSTERIES` = as duas; padrão). Quem tem algum Mistério Elemental também tem o Elemental Geral. Uma magia escolhida não aparece em outra escolha. Sem opções (Arcanista sem Mistério), a escolha mostra um aviso e não bloqueia.
- Ligado: Acólito (3 truques), Arcanista (3 truques e 4 magias de 1º nível dos Mistérios), Xamã (2 truques), Ravasz, Cicatrizes Rúnicas, Arqueiro Rúnico e Espião (2 truques da lista da classe) e a Técnica Combatente Arcano (2 truques de Combatente).
- **Nos níveis seguintes**: as tabelas de truques e magias conhecidas viraram `SPELL_CHOICE` nos `levels` da classe/subclasse, com a diferença de um nível para o anterior e `spellLevel` = o nível máximo de magia daquele nível de classe (Arcanista, Xamã, Ravasz, Cicatrizes Rúnicas, Arqueiro Rúnico e Espião; Acólito só os truques do 4º e do 10º, porque prepara as magias). Numa multiclasse, a escolha usa a lista da classe de onde veio. A troca de uma magia conhecida ao subir de nível é uma escolha opcional do nível (ver Subida de nível e multiclasse).

## Equipamento (`rules/itens.json`)

Capítulo 6, carregado e conferido ao subir (`runarcana.rules.items`; testes: `rules/itens-teste.json`). Gerado a partir das tabelas da wiki (Armas, Armaduras e Escudos, Equipamento de Aventureiro, Montarias e Estilo de Vida, Equipamento e Riqueza).

```
{ "startingWealth": { "ACOLYTE": "5d4 x 10", "BODHISATTVA": "5d4", ... },          // em PO
  "items": [ { "id": "espada-longa", "name", "kind": "WEAPON", "category": "Marciais Corpo a Corpo",
               "groups": ["arma-marcial", "arma-marcial-corpo-a-corpo"], "price": "15 PO", "priceCp": 1500, "weight": 1.5,
               "damage": "1d8 r/ 1d6 p", "critical": "x2", "mastery": "Tontear", "properties": "Versátil (1d10 r/ 1d8 p)" },
             { "id": "armadura-placas", "kind": "ARMOR", "armorWeight": "HEAVY", "armorClass": 18, "dexterity": "NONE",
               "damageReduction": "3", "strength": 15, "stealthDisadvantage": true },
             { "id": "conjunto-de-sacerdote", "kind": "PACK", "contents": [ { "item": "mochila", "quantity": 1 }, { "name": "Caixa de esmolas" } ] } ] }
```

- **kind**: `WEAPON`, `ARMOR`, `SHIELD`, `AMMUNITION`, `GEAR`, `FOCUS`, `TOOLS`, `INSTRUMENT`, `MOUNT`, `VEHICLE`, `TACK`, `PACK`. Armas de fogo têm também `tier`, `misfire` (Erro) e `range`; montarias e veículos, `speed` e `capacity`.
- **groups** usados nas escolhas: `arma-simples`, `arma-simples-corpo-a-corpo`, `arma-simples-distancia`, `arma-marcial` (com as mesmas divisões), `arma-impropria`, `arma-de-corrente`, `arma-bodisatva` (a lista do Bodisatva + as simples corpo a corpo sem duas mãos nem pesada), `arma-de-fogo`, `arma-de-fogo-tier-1` a `6`, `municao-de-fogo`, `armadura-leve`/`media`/`pesada`/`especial`, `escudo`, `foco-arcano`, `simbolo-sagrado`, `conjunto-de-oficio`, `instrumento-musical`, `montaria`, `conjunto-de-equipamento`.
- **Concessões**: `EQUIPMENT` (`value`: a opção) e `EQUIPMENT_CHOICE` (`options`, `count`, `label`). Opção = partes separadas por `+`; parte = `id`, `id*quantidade` ou `group:grupo` (com `<=PO` de preço máximo e `*quantidade`); no máximo um grupo por opção, que vira uma opção por item. Ex.: Combatente `group:arma-marcial<=50+escudo-leve` ou `group:arma-marcial<=50*2`.
- **Riqueza inicial**: o jogador pode trocar todo o equipamento pela riqueza da classe; os dados são rolados ao criar.
- Aproximações: "duas armas simples/marciais" vira duas iguais; "cota de malha (se proficiente)" e "armadura leve (se proficiente)" não conferem a proficiência; as "30 munições da arma inicial" do Atirador viram um pacote de munição à escolha (o pacote do catálogo tem outra quantidade); o livro de preces do Acólito é o item Livro. Ficam fora do catálogo: modificações de armas de fogo, estilo de vida, comida e hospedagem e a armadura de montaria (o preço é um multiplicador). Escudo entra no inventário, mas ainda não soma na CA.

- **Rituais** (18, do 1º ao 6º nível): perícias, pré-requisito (os Ritos do Acólito viram `subclasses`), rebote (`backlashAt` = sucessos ou menos para o rebote), língua, duração e componentes. CD, sucessos, custo, tempo e intervalo de jogada vêm da tabela `rituais`.
- **Tabelas** (7): Conjuração Ritual e Trespassando (regra opcional), Rituais, Magia Púrpura e Magia Descontrolada Yordle (d100) e as duas de Transferindo Essências (Essência e Golem), cada uma com o resumo da regra em `description`.

## Compêndio (`rules/compendio.json`)

Páginas de consulta que não mudam a criação, extraídas da wiki na ordem do livro: **Familiares e Companheiros Animais** e **A Tecmaturgia** com os 5 **Aparatos** (Armamento Aprimorado, Disparadores, Servo, Projétil, Mecha). `{ "pages": [ { "id", "title", "chapter", "sections": [ { "title", "depth": 1-5, "text", "tables": [ { "name", "columns", "rows" } ] } ] } ] }`; a seção sem título é a introdução. Texto em parágrafos separados por linha em branco e itens de lista com "- ".

## Runas e Natureza Rúnica

Na criação todo personagem escolhe a **Natureza Rúnica**: um **Pulso Rúnico** e uma **Runa** inicial. As concessões ficam em `runicNature` no `criacao.json` (fonte "Natureza Rúnica" no assistente, chaves `runic-nature:0` e `runic-nature:1`):

- `FEATURE` "Pulso Rúnico" com as opções Esmeralda, Rubi, Diamante, Ametista e Safira (a habilidade vira "Pulso Rúnico (Rubi)"), com o Dado de Pulso por proficiência e o texto dos cinco pulsos, da CD/ataque de Runas e da progressão (Maestrias no 3º, 5º, 10º, 12º, 17º e 19º; nova Runa no 8º e no 15º).
- `RESOURCE_CHOICE` de `RUNA`, sem filtro de grupo: qualquer Runa pode ser escolhida (a Sinergia só vale com o Pulso dela, e está no texto).

As Runas ficam no `recursos.json` com `kind: RUNA` e o campo `uses` (metade do bônus de proficiência por descanso longo). `groups`: o Pulso ("Rubi"; "Esmeralda" e "Diamante" no Escudo) e, nas Runessências, também "Runessência" e a árvore ("Aquavitista"). A descrição traz Pulso, Sinergia, Uso, o texto e as duas Maestrias. `requires.level` 8/15 bloqueia no 1º nível. Runessências: pré-requisito "Runessência (com o aval do mestre)", `requires` com Herança, atributo e a Runa anterior da árvore (`resources`). As opções internas (Patrono Ínfero/Feérico do Pacto Místico, os três Reatores do Núcleo Reator) estão no texto da Runa de origem.

## Recursos de classe (`rules/recursos.json`)

Iras (Bruto), Sutras e Vel (Bodisatva e Combatente Monástico), Técnicas de Combate (Combatente), Invocações Espirituais e Grandes Espíritos (Xamã) e Aspectos Ferais (Forma Selvagem do Metamorfo). Arquivo à parte (`runarcana.rules.resources`; testes: `rules/recursos-teste.json`), conferido ao subir.

```
{ "resources": [ {
    "id": "rocha", "kind": "SUTRA", "name": "Rocha", "groups": ["Bodisatva"],
    "prerequisite": "Bodisatva, nível 1",            // texto do livro
    "execution": "Ação bônus", "components": "S, R", "cost": 2 (só Vel: pontos ◆), "ki": 1 (só Vel: Ki inativado),
    "description": "...",
    "requires": { "level", "attributes": {"WISDOM": 15}, "anyAttributes": {"STRENGTH": 13, "DEXTERITY": 13},
                  "classes", "subclasses", "regions", "skills", "heritages", "resources",
                  "feature": "Escola", "featureOptions": ["Escola Umbral"],
                  "weapons": ["Armas simples", "Armas marciais"], "armor": ["SHIELD"] },
    "grants": [ { "type": "ARMOR_CLASS", ... } ]
} ] }
```

- **requires**: tudo que estiver preenchido precisa valer. `attributes`: todos os mínimos; `anyAttributes`: basta um ("Força ou Destreza 13"); listas de classes, subclasses, regiões, heranças, `origins` e `lineages`: basta uma; `skills` e `resources` (outros recursos já escolhidos): todos; `feature`/`featureOptions`: uma opção escolhida numa habilidade (a Escola do Shinobi, a postura de Aliados Espirituais). `level` é o nível do personagem; `classLevel` (com `classes`) é o nível mínimo numa delas ("Caçador 8"). Classes e subclasses valem para qualquer classe do personagem (multiclasse).
- O bônus de atributo do próprio recurso não conta para o pré-requisito dele (Potência do Búfalo: Força 15 sem os +2).
- `weapons`: proficiência com uma dessas armas ("uma arma de haste" ou "contundente" = armas simples ou marciais); `armor`: todas essas proficiências de armadura ("escudos" = `SHIELD`).
- **Ki inativado** (`ki`, só Vel): o Vel só aparece se o personagem tiver esse Ki, e os pontos saem da habilidade **Ki** (da tabela inteira, em todos os níveis), com a nota no texto. Escolher Vel que somem mais Ki do que ele tem é erro.
- Escalas por nível dentro do recurso usam `valueByLevel` (Casca Grossa +1 → +5; deslocamentos dos Aspectos Ferais) e `diceByLevel` (Arma Natural 1d4 → 1d12).
- Um recurso escolhido numa escolha não aparece em outra, a não ser com `repeatable: true` (o aumento de atributo, "Mais Inimigos"...): aí cada escolha vira uma fonte própria, com a chave da escolha (`resource:<id>@<chave>`). Recursos escolhidos num nível ganho também levam a chave do nível, para as escolhas internas serem do nível. A escolha interna é a concessão 1 do recurso em diante (a 0 é a habilidade com o texto).
- **grants** seguem o fluxo normal: CA (Vento: 10 + DES + SAB; Rocha: 10 + FOR + SAB, com `secondAttribute`), deslocamentos (Aspecto Feral: Natação 30, ou +15), +2 de atributo (Búfalo, Escamas do Dragão), proficiências (Armadura, Combate Obscuro) e outras escolhas (Combatente Monástico traz Ki, um Sutra de Bodisatva, Vel e uma arma Bodisatva; Combatente Arcano traz a Mana).
- Grupos de Sutra: `Geral` (aprendidos na campanha, fora das escolhas de classe), `Bodisatva`, `Wuju`, `Dança das Lâminas`, `Shojin`, `Hakensai`, `Shinobi`, e as escolas `Escola Espiritual`, `Escola da Proteção`, `Escola Crepuscular`, `Escolas Sombrias` (exigem o Vel Yanlei), `Escola Obscura`, `Escola Umbral` e `Escola Noctígena`.
- Onde cada classe escolhe: Combatente (Técnica no 1º e nos níveis 4, 6, 9, 12 e 16), Bodisatva (Sutra de Classe no 1º e nos níveis pares, dois nos de Aprimoramento; Vel opcional de 1 ◆ no 1º e +1 nos ímpares; Shinpus 5 → 17), Shojin (Sutra Shojin nos níveis 3, 6, 15 e 17), Shinobi (Sutra da Escola no 3º, Shinobi ou da Escola nos níveis 6, 11, 17 e 20), Bruto (Ira nos níveis 3, 8, 12, 15 e 17), Xamã (Grande Espírito do Totem no 1º, Invocação nos níveis 2, 5, 9, 14 e 20), Metamorfo (Aspectos: terrestre no 1º; terrestre e aquático no 5º; aquático e alado no 9º; alado no 13º; um de cada no 17º).

## Aprimoramentos (`rules/aprimoramentos.json`)

Arquivo à parte (`runarcana.rules.feats`; testes: `rules/aprimoramentos-teste.json`), no formato do `recursos.json` (`kind: APRIMORAMENTO`), juntado aos recursos ao subir. Gerado da página Aprimoramento da wiki (nome, pré-requisito e o texto completo; o "Ágil" estava dentro do texto do Vigilante por um erro de formatação da wiki).

- O Aprimoramento das classes é uma `RESOURCE_CHOICE` de `APRIMORAMENTO`. As duas primeiras opções são o aumento de atributo do livro: **Aumento de Atributo (+2)** e **(+1 e +1)** (dois atributos diferentes), repetíveis. Atributo acima de 20 é erro na prévia.
- Efeitos aplicados: aumentos de atributo (fixos e à escolha; `value` no `ATTRIBUTE_CHOICE` = novo limite, Conjurador Eficiente e Invocador Intenso até 22), proficiências de armadura (Revestido, Encouraçado, Blindado, Escudeiro), Manoplas de guerra (Mãos de Ferro), Armas de corrente (Perito em Armas de Corrente), Pontos de Sorte (Afortunado: 2 + metade da proficiência), metade do dado de vida em PV (Robusto: `HP_BONUS` com `value: HALF_HIT_DIE`), um Estilo de Luta do Combatente (Mestre do Combate) e o elemento (Controlador de Elementos), salvaguarda do atributo escolhido (Resistente, Mente Única: duas escolhas com as mesmas opções, a de atributo e a de salvaguarda), ofício (Artesão Vitriólico, Perito em Armas de Fogo) e deslocamento (Atleta +5, Ágil +10). O resto fica no texto da habilidade.
- Pré-requisitos conferidos: atributos, classe e nível de classe, nível do personagem, subclasse (Assassino), origem (Construto, Meio-Dragão), linhagem (Lhotlan), região (Sentinense = Bilgewater), perícia (Medicina), armadura, Herança e outro Aprimoramento. Ficam só no texto: "habilidade de conjuração", "possuir uma Liturgia", "Ofício 5", proficiência com tipos de arma e as Heranças que não existem no `herancas.json` (Neófito Shugenja, Fluidez de Ki).
- Repetíveis (`repeatable`): Adaptação Tecnológica, Controlador de Elementos, Empunhadura Primata, Hábil, Maestria, Mais Inimigos, Mestre do Combate, Praticante Dedicado e Princípio Arquimago.

## Subida de nível e multiclasse

- Os níveis ganhos ficam no `build` da ficha (`CreationRequest.levels`: classe, subclasse da classe nova, dado de vida rolado, escolhas e Heranças do nível). A prévia refaz tudo do 1º ao nível atual.
- Cada nível aplica os `levels` da classe e da subclasse **pelo nível na classe**, e os da origem e da linhagem pelo nível do personagem. As tabelas (`usesByLevel`, `diceByLevel`, `valueByLevel`) das fontes de classe usam o nível na classe; as outras, o do personagem. Bônus de proficiência pelo nível do personagem.
- PV: o 1º nível com o dado cheio; os outros com o dado rolado + mod. de CON (mínimo 1 por nível); `HP_BONUS` com `perLevel` soma em cada nível.
- Herança: 1 ponto (de Origem ou Geral) nos níveis 5, 9, 13 e 17. Heranças de Região e as `initial` só na criação.
- **Recursos com níveis** (`levels` no recurso, como nas classes): os ganhos entram pelo nível na classe que escolheu o recurso; escolhido depois do nível, entram junto com a escolha. Usado na Técnica Combatente Arcano e no Aprimorado.
- **Mana na multiclasse**: uma habilidade "Pontos de Mana" só, com a soma da de cada classe (a descrição mostra a conta).
- **Troca de magia**: ao ganhar um nível numa classe que conhece magias, o mestre pode trocar uma magia conhecida dela (de 1º nível ou mais) por outra da mesma lista, até o maior nível que a classe já escolhe.
- **Multiclasse** (`multiclass` da classe): `prerequisite` (texto), `attributes` (todos), `anyAttributes` (basta um), `anotherAttribute` (Arcanista: além da Inteligência, outro atributo 13) e `grants` (a tabela Proficiências de Multiclasse). O pré-requisito vale para a classe nova e para as que o personagem já tem, com os atributos finais. A classe nova dá o 1º nível dela sem perícias, resistências, proficiências, ofícios, idiomas, equipamento e ouro, mais os `grants` de multiclasse.

## Traços da Runinata (`rules/tracos.json`)

A origem com `"usesTraits": true` (a Runinata) não tem traços fixos: ganha a etapa **Traços** no assistente, logo depois da Origem. Arquivo à parte (`runarcana.rules.traits`; testes: `rules/tracos-teste.json`), conferido ao subir.

```jsonc
{
  "budgets": [ { "id": "MODERATE", "name": "Moderado", "minor": 4, "major": 3, "description": "..." } ],  // modos
  "conversion": { "MINOR": 1, "MAJOR": 2 },        // pontos ao converter 1 traço do modo (no máximo 1 de cada tipo)
  "costs": { "MINOR": 1, "MAJOR": 3, "SUPERIOR": 6 },  // custo em pontos de Origem
  "traits": [ {
    "id": "garras", "name": "Garras", "tier": "MAJOR",  // MINOR, MAJOR ou SUPERIOR
    "description": "...",
    "maxTimes": 1,                    // quantas vezes (padrão 1)
    "requires": ["escalador"],        // precisa de pelo menos um destes traços
    "detail": "Qual tipo de dano?",   // pergunta de texto livre; a resposta entra no nome ("Resistência Natural (Ígneo)")
    "background": true,               // libera o Passado (Antecedente)
    "silent": true,                   // não vira passiva própria (quando as concessões bastam)
    "speedSteps": [15, 15, 10],       // pés das concessões SPEED em cada escolha (1ª, 2ª, 3ª em diante)
    "grants": [ ... ]                 // concessões normais, aplicadas a cada escolha
  } ],
  "drawbacks": [ { "id": "um-olho", "name": "Apenas 1 olho", "group": "Forma", "points": 1, "description": "...", "maxTimes": 1 } ]
}
```

- O jogador escolhe o **modo** (combinado com o mestre), os traços e as desvantagens. O mestre pode **travar o modo** na aba **Regras da mesa** do painel (`PUT /creation/settings`); travado, o assistente mostra só esse modo e o back ignora o que o jogador mandar. As desvantagens somam pontos de Origem (pode haver meio ponto).
- Traços Menores e Maiores ocupam primeiro as vagas do modo; o que passar custa pontos. Superiores só com pontos.
- **Conversão automática**: o back testa converter (ou não) 1 Traço Menor (+1 ponto) e 1 Maior (+2) e fica com a combinação que cobre as escolhas com menos sobra; a etapa mostra quando converteu. Faltar é erro ("passam do que o modo… permitem"); sobrar vaga ou ponto inteiro também ("Ainda sobram traços ou pontos de Origem").
- Cada escolha é uma fonte de concessões ("Traço: Garras"), então perícias, ofícios e habilidades com opção caem na etapa **Escolhas** com chave `trait:<id>:<n>:<índice>` (desvantagens: `drawback:...`). Sem `silent`, o traço vira uma passiva com o texto, a resposta no nome e "(2×)" quando repetido.
- **Passado**: sem traço com `background`, a Runinata não tem Passado (escolher um é erro); com Antecedente, ele volta a ser obrigatório.
- Tamanho fixo de uma concessão (`SIZE`, ex.: Chaveirinho → Miúdo) vence a escolha de tamanho (`SIZE_CHOICE`).
- Aquático, Escalador, Alado e Escavação dão o deslocamento de verdade, crescendo a cada escolha pelo `speedSteps` do traço (15, 15, 10…); Deslocamento reduzido tira 5 pés de todos (`SPEED` com `ALL`).
- O que só existe como texto: telepatia, idiomas (desligados), Oriundo (as regiões não dão proficiências no sistema), Resquício.

## O que falta definir (preencher com as regras do Runarcana)

Para cada item, basta mandar o texto do livro ou um resumo; eu converto para o JSON.

1. **Origens**: todas cadastradas, inclusive a **Variante Nebulon** completa. Confirmado pelo usuário: Chireano com pontos de Origem, Chicote de Espinhos soma Destreza, bando do Troll não obriga a região. Os traços do Meio-Dragão por nível usam `levels` (ver **Formato**). Os `levels` de origem e linhagem já entram na subida de nível; dá para usar o mesmo para outros ganhos (ex.: Mordida do Troll 1d8 no 6º).
2. **Métodos de atributos**: valores conferidos com o livro. Falta só, se a mesa quiser, o mestre travar o método na aba Regras da mesa (como o modo de traços da Runinata).
3. **Decisões da mesa** (2026-10-27): ao subir de nível, os PV usam o dado de vida da classe; quem sobe o nível é sempre o **mestre**; **multiclasse vale**; na ficha pronta, o jogador só altera os próprios **PV** (o resto fica com o mestre); idiomas continuam desligados. Depois (2026-10-27): o jogador escolhe as **magias preparadas**, só no descanso longo.
4. **Classes**: todas cadastradas, com os recursos do Capítulo 5. Ficam só no texto: o pré-requisito de truque conhecido (Rajada Etérea pede rajada mística), porque os pré-requisitos de recurso ainda não olham as magias escolhidas; escalas que não são número de usos, dado, CA, atributo ou deslocamento (visão no escuro e outros sentidos dos Aspectos, custo em PV da Adrenalina Rúnica, tipo de dano que muda no 10º nível).
   **Magias**: truques e magias conhecidas do 1º nível são escolhidos no assistente (ver **Magias na criação**). **Preparadas** (`preparation` na classe): `attribute`, `levels` (`FULL` = nível na classe, `HALF` = metade), `from` e `maxSpellLevel` (nível máximo de magia pelo nível na classe). Acólito: SAB + nível de Acólito, de `CLASS_OR_MYSTERIES` (lista do Acólito e Mistérios do personagem) até o nível máximo; Xamã: SAB + metade do nível de Xamã, entre os feitiços conhecidos (`KNOWN`). Mínimo 1. **Combatente Arcano**: a tabela Combatente Conjurador (wiki, Técnicas de Combate) pelo nível de Combatente: `levels` da Técnica com os truques (5º e 10º) e as magias conhecidas (3 no 3º, +1 no 4º, 7º, 8º, 10º e 11º; até 2º nível), Mana até o 11º; o **Aprimorado** dá a Mana até o 20º (17 → 30) e as magias de 3º e 4º nível (13º, 14º, 16º, 19º, 20º). **Multiclasse** (wiki, Multiclasse): Mana = soma da Mana de cada classe conjuradora; magias conhecidas e preparadas por classe. Falta: as listas de origem (Yordle, Fauhwoon, Ottrani) em concessões de origem, os Mistérios que dependem de opção no Vítreo (Charme, Oneiros, Pequeno Falsário, Vislumbre) e o "se já tiver Fogo, Magma ou Infernal" do Ígneo, a Herança Centelha Mágica e o pré-requisito "Truque - rajada mística" da Rajada Etérea (continua no texto).
   **Runas**: ficam só no texto as escolhas de dentro do Pulso (tipo de dano do Esmeralda/Rubi, Vida/Mana/Ki do Ametista) e da Runa (elemento, forma feral, patrono); a Variante Ignata (Fúria Imortal) não existe no `herancas.json`, então só a Constituição é conferida; o Ancestral Vastayês aceita a origem Vastaya ou uma Herança e não tem `requires`. As Runas do 8º/15º nível ficam liberadas pelo nível do personagem; as Maestrias continuam no texto.
5. **Passados** (Capítulo 4): os 22 cadastrados. Ficam no texto: idiomas (desligados), a disciplina do ofício menor ("Jogador de dois tipos de Jogos", "Artista: Maquiador"), as perícias especiais do Desconhecido, o equipamento opcional do Pirata e o "conjunto de um Ofício com o qual você é proficiente" do Inventor (a escolha mostra todos os conjuntos). A munição do Pirata vem no pacote do catálogo (o livro dá 20).
6. **Ofícios**: atributo base e conjunto de cada um (para os testes de ofício e os níveis).
7. **Equipamento inicial**: feito, de classes e passados (ver **Equipamento**). Com a riqueza inicial, o ouro da classe e do passado também fica de fora (faz parte do equipamento).
8. Idiomas: desligados a pedido; quando quiser, basta cadastrar os de cada região.
9. **Páginas do livro em `livro/`**: todas convertidas. Rituais, tabelas d100, Essências, Familiares e Tecmaturgia são **consulta** (aba LIVRO da ficha); nenhuma regra delas é aplicada automaticamente (ex.: Convocar Familiar não cria a ficha do familiar, Ritualista não é conferido, aparatos não entram como itens).
