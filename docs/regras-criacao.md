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
| Regiões | As 14 do enum |
| Idiomas | **Desligados** por enquanto (o Humano não escolhe idioma; a estrutura `LANGUAGE`/`LANGUAGE_CHOICE` continua disponível) |
| Ofícios | Os **22** (16 maiores, 6 menores), sem atributo base nem níveis ainda |
| Heranças | **204** em `rules/herancas.json`: 59 Gerais, 54 de Região e 91 de Origem (todas as origens, a Variante Nebulon e as 3 do Nebulon, que exigem a variante por `requires`) |
| Classes | Arcanista e Lutador **de exemplo** |
| Passados | Estudioso e Soldado **de exemplo** |
| Métodos de atributos | Compra de pontos (27), arranjo padrão e manual, **valores de 5e** a confirmar |

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
| `EXPERTISE_CHOICE` | `count`, `options`?, `label`? | **Especialidade** em `count` perícias que o personagem já tem (traço Especialista). Especialidade soma o bônus de proficiência duas vezes |
| `SAVING_THROW` | `attribute` | Proficiência no teste de resistência |
| `SIZE` | `value` (`TINY`/`SMALL`/`MEDIUM`/`LARGE`/`HUGE`) | Tamanho fixo |
| `SIZE_CHOICE` | `options`, `label`? | Escolhe o tamanho entre as opções |
| `CRAFT` | `value` (id de `crafts`) | Proficiência fixa num ofício |
| `CRAFT_CHOICE` | `count`, `options`?, `label`? | Escolhe ofícios (sem `options` = todos de `crafts`) |
| `LANGUAGE` | `value` (nome) | Idioma fixo |
| `LANGUAGE_CHOICE` | `count`, `options`? ou `fromRegion: true`, `label`? | Escolhe idiomas da lista ou da região escolhida |
| `HERITAGE_POINTS` | `amount`, `value`? (`REGION`/`ORIGIN`/`ANY`), `label`? | +pontos de Herança do tipo (ver **Heranças**; sem `value` = `ANY`) |
| `PROFICIENCY_CHOICE` | `count`, `options`? (`SKILL`/`CRAFT`/`MARTIAL_WEAPON`; sem = os três), `label`? | Proficiência à escolha entre perícia, ofício e arma marcial (Funcional do Emissário). Perícia e ofício entram na ficha; arma marcial vira a passiva "Proficiência em arma marcial" (a ficha ainda não tem lista de armas). Opções na chave: `SKILL:ARCANA`, `CRAFT:alquimista`, `MARTIAL_WEAPON` |
| `FEATURE` | `name`, `description`, `abilityType` (`PASSIVE`/`ABILITY`/`SPELL`), `spellLevel`, `damage` ("2d6+4"), `maxUses` **ou** `usesFormula`, `diceByProficiency`, `recharge` (`SHORT_REST`/`LONG_REST`/`NONE`), `castingTime`, `range`, `duration`, `components`, `options` (habilidade com escolha: o jogador escolhe 1 e ela vira "Resistente (Ígneo)"), `damageBonus` (somado ao dado: `PROFICIENCY`, `HALF_PROFICIENCY`, um atributo ou `STRENGTH_OR_DEXTERITY` = o maior entre Força e Destreza, para o "Força ou Destreza" do livro; ex.: `["PROFICIENCY", "STRENGTH"]` → Chifres 1d6+5 com Força 17) | Vira uma passiva, habilidade ou magia na aba **Magias** |
| `HP_BONUS` | `amount` **ou** `usesFormula`, `perLevel`?, `label`? | +PV (`perLevel` marca que se repete a cada nível). Com `usesFormula` (`HALF_PROFICIENCY`/`PROFICIENCY`) o valor sai do bônus de proficiência do nível: a Constituição Poderosa do Minotauro dá +1 no 1º nível e +12 até o 10º |
| `SPEED` | `feet`, `value`? (`WALK`, `SWIM`, `CLIMB`, `FLY`, `BURROW` ou `ALL`) | +deslocamento em pés. Sem `value` = caminhada; `SWIM` natação, `CLIMB` escalada, `FLY` voo, `BURROW` escavação (ex.: Marai nada 50); `ALL` soma (ou tira) de todos os deslocamentos que o personagem tiver. Na ficha, clicar no deslocamento alterna entre os tipos |
| `GOLD` | `amount` | +ouro inicial |
| `ARMOR_CLASS` | `name`, `armor` { `base`, `dex` (padrão true), `dexMax`, `attribute`, `proficiency`, `reduction`, `blocksArmor` }, `options`?, `label`? | Uma **opção de defesa** (CA alternativa): base + mod. de Destreza (limitado por `dexMax`) + mod. de `attribute` + proficiência, com RD = `reduction`. Com `options` (atributos), o jogador escolhe o atributo somado (Armadura Natural da Runinata). `blocksArmor`: as armaduras do inventário deixam de servir. Ex.: Pele de Árvore, modos da Proteção Ajustável |
| `AC_BONUS` | `name`, `amount` ou `usesFormula: PROFICIENCY`, `armor` { `unarmoredOnly`, `blocksArmor` }? | **Bônus de CA** somado à defesa em uso (Escorregadio + bônus de proficiência; Armadura Natural do Auroque +1 só sem armadura) |

**Habilidades que escalam** (`FEATURE`): `usesFormula` = `FIXED` (usa `maxUses`), `HALF_PROFICIENCY` (metade do bônus de proficiência, arredondada por `rounding`, mínimo 1), `PROFICIENCY`, `ATTRIBUTE_MODIFIER` (modificador do `attribute` da concessão, mínimo 1; ex.: Urro Triunfante = mod. de Constituição), `DOUBLE_PROFICIENCY` (dobro do bônus; Fúria Símia) ou `HALF_LEVEL` (metade do nível do personagem, mínimo 1; Autossacrifício). `usesPlus` soma um valor fixo à fórmula (Plumadagas: `PROFICIENCY` + 3). "Descanso pleno" do livro é cadastrado como `LONG_REST`. `diceByProficiency` = dado por bônus, valendo o maior bônus atingido, ex.: `{ "2": "1d4", "4": "1d6", "6": "1d8" }`. Na criação (nível 1, bônus +2) o Inspirado do Humano fica com 1 uso de 1d4; a subida de nível vai recalcular. O arredondamento é **para baixo**: os exemplos da Constituição Poderosa do Minotauro (+1 no 1º nível, +12 no 10º) só fecham assim.

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

- O jogador escolhe o **modo** (combinado com o mestre), os traços e as desvantagens. As desvantagens somam pontos de Origem (pode haver meio ponto).
- Traços Menores e Maiores ocupam primeiro as vagas do modo; o que passar custa pontos. Superiores só com pontos.
- **Conversão automática**: o back testa converter (ou não) 1 Traço Menor (+1 ponto) e 1 Maior (+2) e fica com a combinação que cobre as escolhas com menos sobra; a etapa mostra quando converteu. Faltar é erro ("passam do que o modo… permitem"); sobrar vaga ou ponto inteiro também ("Ainda sobram traços ou pontos de Origem").
- Cada escolha é uma fonte de concessões ("Traço: Garras"), então perícias, ofícios e habilidades com opção caem na etapa **Escolhas** com chave `trait:<id>:<n>:<índice>` (desvantagens: `drawback:...`). Sem `silent`, o traço vira uma passiva com o texto, a resposta no nome e "(2×)" quando repetido.
- **Passado**: sem traço com `background`, a Runinata não tem Passado (escolher um é erro); com Antecedente, ele volta a ser obrigatório.
- Tamanho fixo de uma concessão (`SIZE`, ex.: Chaveirinho → Miúdo) vence a escolha de tamanho (`SIZE_CHOICE`).
- Aquático, Escalador, Alado e Escavação dão o deslocamento de verdade, crescendo a cada escolha pelo `speedSteps` do traço (15, 15, 10…); Deslocamento reduzido tira 5 pés de todos (`SPEED` com `ALL`).
- O que só existe como texto: telepatia, idiomas (desligados), Oriundo (as regiões não dão proficiências no sistema), Resquício.

## O que falta definir (preencher com as regras do Runarcana)

Para cada item, basta mandar o texto do livro ou um resumo; eu converto para o JSON.

1. **Origens**: todas cadastradas, inclusive a **Variante Nebulon** completa. Confirmado pelo usuário: Chireano com pontos de Origem, Chicote de Espinhos soma Destreza, bando do Troll não obriga a região. Os traços do Meio-Dragão por nível usam `levels` (ver **Formato**). Pode usar o mesmo para outros ganhos por nível de origem (ex.: Mordida do Troll 1d8 no 6º), quando a subida de nível existir.
2. **Métodos de atributos** que a mesa usa (compra de pontos com quantos pontos e qual tabela, arranjo padrão, rolagem) e limite máximo na criação.
4. **Classes** (as 9): dado de vida, resistências, perícias à escolha, habilidades do 1º nível, ouro/equipamento inicial e os ganhos por nível.
5. **Passados** (Capítulo 4): perícias, ouro e característica.
6. **Ofícios**: atributo base e conjunto de cada um (para os testes de ofício e os níveis).
7. Equipamento inicial: agora ou numa etapa própria depois?
8. Idiomas: desligados a pedido; quando quiser, basta cadastrar os de cada região.
