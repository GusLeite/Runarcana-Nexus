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
| Origens | **Humano**, **Minotauro** (Linhagens Aelus, Alnuk e Auroque) e **Construto** (modelos Brutal, Emissário e Ligeiro). As outras ainda faltam |
| Regiões | As 14 do enum |
| Idiomas | **Desligados** por enquanto (o Humano não escolhe idioma; a estrutura `LANGUAGE`/`LANGUAGE_CHOICE` continua disponível) |
| Ofícios | Os **22** (16 maiores, 6 menores), sem atributo base nem níveis ainda |
| Heranças | **136** em `rules/herancas.json`: 59 Gerais, 54 de Região e 23 de Origem (Humano, Minotauro e Construto). As exclusivas das outras origens entram com elas |
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
                     "lineages": [ { "id", "name", "description", "grants": [...] } ] } ],   // linhagens (tribos), opcional
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
- Ouro inicial = soma dos `startingGold` da classe, do passado e da origem, mais concessões `GOLD`.
- Deslocamento sempre em **pés**, como no livro.

## Concessões (`grants`)

| `type` | Campos | O que faz |
|---|---|---|
| `ATTRIBUTE` | `attribute`, `amount` | +amount no atributo (pode ser negativo) |
| `ATTRIBUTE_CHOICE` | `count`, `amount`, `options`?, `label`? | Escolhe `count` atributos (de `options`; sem = qualquer um) para +amount. Duas escolhas da **mesma fonte** não repetem atributo ("+2 em um atributo e +1 em outro" = duas concessões) |
| `SKILL` | `skill` | Proficiência fixa na perícia |
| `SKILL_CHOICE` | `count`, `options`?, `label`? | Escolhe `count` perícias (sem `options` = qualquer uma); as que ele já tem somem das opções |
| `SAVING_THROW` | `attribute` | Proficiência no teste de resistência |
| `SIZE` | `value` (`TINY`/`SMALL`/`MEDIUM`/`LARGE`/`HUGE`) | Tamanho fixo |
| `SIZE_CHOICE` | `options`, `label`? | Escolhe o tamanho entre as opções |
| `CRAFT` | `value` (id de `crafts`) | Proficiência fixa num ofício |
| `CRAFT_CHOICE` | `count`, `options`?, `label`? | Escolhe ofícios (sem `options` = todos de `crafts`) |
| `LANGUAGE` | `value` (nome) | Idioma fixo |
| `LANGUAGE_CHOICE` | `count`, `options`? ou `fromRegion: true`, `label`? | Escolhe idiomas da lista ou da região escolhida |
| `HERITAGE_POINTS` | `amount`, `value`? (`REGION`/`ORIGIN`/`ANY`), `label`? | +pontos de Herança do tipo (ver **Heranças**; sem `value` = `ANY`) |
| `PROFICIENCY_CHOICE` | `count`, `options`? (`SKILL`/`CRAFT`/`MARTIAL_WEAPON`; sem = os três), `label`? | Proficiência à escolha entre perícia, ofício e arma marcial (Funcional do Emissário). Perícia e ofício entram na ficha; arma marcial vira a passiva "Proficiência em arma marcial" (a ficha ainda não tem lista de armas). Opções na chave: `SKILL:ARCANA`, `CRAFT:alquimista`, `MARTIAL_WEAPON` |
| `FEATURE` | `name`, `description`, `abilityType` (`PASSIVE`/`ABILITY`/`SPELL`), `spellLevel`, `damage` ("2d6+4"), `maxUses` **ou** `usesFormula`, `diceByProficiency`, `recharge` (`SHORT_REST`/`LONG_REST`/`NONE`), `castingTime`, `range`, `duration`, `components`, `options` (habilidade com escolha: o jogador escolhe 1 e ela vira "Resistente (Ígneo)"), `damageBonus` (somado ao dado: `PROFICIENCY`, `HALF_PROFICIENCY` ou um atributo, ex.: `["PROFICIENCY", "STRENGTH"]` → Chifres 1d6+5 com Força 17) | Vira uma passiva, habilidade ou magia na aba **Magias** |
| `HP_BONUS` | `amount` **ou** `usesFormula`, `perLevel`?, `label`? | +PV (`perLevel` marca que se repete a cada nível). Com `usesFormula` (`HALF_PROFICIENCY`/`PROFICIENCY`) o valor sai do bônus de proficiência do nível: a Constituição Poderosa do Minotauro dá +1 no 1º nível e +12 até o 10º |
| `SPEED` | `feet` | +deslocamento em pés |
| `GOLD` | `amount` | +ouro inicial |

**Habilidades que escalam** (`FEATURE`): `usesFormula` = `FIXED` (usa `maxUses`), `HALF_PROFICIENCY` (metade do bônus de proficiência, arredondada por `rounding`, mínimo 1), `PROFICIENCY` ou `ATTRIBUTE_MODIFIER` (modificador do `attribute` da concessão, mínimo 1; ex.: Urro Triunfante = mod. de Constituição). "Descanso pleno" do livro é cadastrado como `LONG_REST`. `diceByProficiency` = dado por bônus, valendo o maior bônus atingido, ex.: `{ "2": "1d4", "4": "1d6", "6": "1d8" }`. Na criação (nível 1, bônus +2) o Inspirado do Humano fica com 1 uso de 1d4; a subida de nível vai recalcular. O arredondamento é **para baixo**: os exemplos da Constituição Poderosa do Minotauro (+1 no 1º nível, +12 no 10º) só fecham assim.

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
  "prerequisite": "Piltovense, não ter as Heranças Operário ou Privilegiado",  // o texto do livro, sempre mostrado
  "maxTimes": 2,                    // quantas vezes pode ser escolhida (padrão 1)
  "options": ["Marai", "Shimon"],   // sub-escolha obrigatória (tribo do Meio-Vastaya, fonte da Progressão Tecnológica...)
  "description": "Texto completo do livro (vira a habilidade na aba Magias)."
}
```

Como os pontos funcionam no assistente:
- Cada Herança custa **1 ponto**. O tipo do ponto vem da concessão `HERITAGE_POINTS` da origem: `REGION` compra Heranças **de Região** (da região escolhida) e **Gerais**; `ORIGIN` compra **de Origem** e **Gerais**; `ANY` compra qualquer uma. O Humano tem 2 pontos `REGION` ("Receba 2 pontos de Herança de Região").
- Os pré-requisitos de origem, linhagem, região, classe, atributo mínimo e `excludes` são conferidos sozinhos. O resto do texto (ex.: "Conjuração", "proficiência com arma de fogo") **só é mostrado**: confira com o mestre.
- Ponto sobrando com alguma Herança disponível impede a criação.
- O efeito de cada Herança é o **texto**: ela vira uma habilidade do tipo Herança na ficha. Nenhum bônus é aplicado sozinho ainda.
- Níveis 5, 9, 13 e 17 (Heranças de Origem e Gerais, sem as de Região nem as "Inicial") entram com a subida de nível.

As Variantes do Humano levam o texto completo do capítulo "Heranças Variantes": Anfíbio, Colosso, Progressão Tecnológica e Ressurgido podem ser escolhidas 2 vezes; Meio-Vastaya, Progressão Tecnológica e Ressurgido pedem a opção. A Glacinata usa o texto da Natividade Elemental.

## O que falta definir (preencher com as regras do Runarcana)

Para cada item, basta mandar o texto do livro ou um resumo; eu converto para o JSON.

1. **Demais origens** (e as Heranças de Origem de cada uma).
2. **Métodos de atributos** que a mesa usa (compra de pontos com quantos pontos e qual tabela, arranjo padrão, rolagem) e limite máximo na criação.
4. **Classes** (as 9): dado de vida, resistências, perícias à escolha, habilidades do 1º nível, ouro/equipamento inicial e os ganhos por nível.
5. **Passados** (Capítulo 4): perícias, ouro e característica.
6. **Ofícios**: atributo base e conjunto de cada um (para os testes de ofício e os níveis).
7. Equipamento inicial: agora ou numa etapa própria depois?
8. Idiomas: desligados a pedido; quando quiser, basta cadastrar os de cada região.
