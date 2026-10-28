# Plano: o que falta para jogar

Roteiro das próximas entregas, na ordem em que serão feitas. O foco é a **mesa rodando com a ficha**: o que o mestre e os jogadores precisam durante uma sessão. Segurança e front/polimento vêm depois (ver o fim deste documento).

Cada etapa é uma entrega própria: código + testes + docs (subdoc da área em `backend-*.md`/`frontend-*.md` + `changelog.md`) no mesmo commit, como manda o `CLAUDE.md`. Ao concluir uma etapa, marque-a aqui como **feita** (com a data) e tire dela as pendências dos outros docs.

Regras da mesa que valem para todo o plano (ver [regras-criacao.md](regras-criacao.md), Decisões da mesa): quem altera a ficha pronta é o **mestre**; o jogador altera só os próprios **PV**, os **usos de habilidade**, as **anotações** e as **preparadas** (no descanso longo). Decididas em 2026-10-27 para este plano: o jogador também **gasta** consumíveis e ouro e marca os próprios **testes contra a morte**; inspiração é **sim/não**; condições e exaustão ficam com o mestre.

## Estado atual (2026-10-27)

- Ficha: atributos, perícias, resistências, CA (com armadura e escudo do inventário), PV editáveis pelo jogador, habilidades com usos, magias, descanso curto/longo, magias preparadas, rolagens de d20 e de dano, ataques com arma (Etapa 2), conjurar gastando Mana com CD e ataque de magia (Etapa 3), testes contra a morte e condições (Etapa 4; Exaustão até 10, como no livro), mestre edita habilidades/documentos e ajusta PV (Etapa 5), aba Mesa com todos os personagens (Etapa 6), inventário (o jogador gasta), documentos, anotações, aba Livro.
- Mestre: cria/apaga habilidades e documentos, sobe de nível (com multiclasse), trava regras da mesa, dá e tira itens, ouro e inspiração (Etapa 1).
- Todas as etapas do plano estão feitas; o que falta está em "Depois do para jogar".

## Etapa 1 — Inventário, ouro e inspiração pelo mestre — **feita (2026-10-28)**

**Por quê**: depois da criação ninguém mexe no inventário; loot, compras e gastos param a mesa.

Back-end:
- `InventoryController` (só o mestre, `/character/{id}/items`):
  - `GET` lista (reusa `InventoryItemResponse`);
  - `POST { catalogId, quantity }` adiciona um item do `itens.json` (reusa a conversão de `StartingEquipmentService`, que acha/cria a linha de `Item` pelo `catalogId`); se a ficha já tem o item, soma a quantidade;
  - `POST /custom { name, description, effect, weight, price, rarity, quantity, consumable }` item livre (loot que não está no catálogo, sem `catalogId`);
  - `PATCH /{playerItemId} { quantity }` (0 remove) e `DELETE /{playerItemId}`.
- `PATCH /character/{id}/gold { gold }` e `PATCH /character/{id}/inspiration { inspiration }` (só o mestre; ouro ≥ 0; inspiração sim/não, 0 ou 1).
- Jogador (`/character/me`): `POST /items/{playerItemId}/use` gasta 1 de um consumível (0 remove a linha; 400 se não for consumível) e `POST /gold/spend { amount }` gasta ouro (400 se faltar). Não adiciona nada.
- Inspiração do jogador: `POST /character/me/inspiration/use` gasta a inspiração (1 → 0); só o mestre dá.
- Tirar o escudo/armadura escolhidos da defesa quando o item sai do inventário (`Character.shield`/defesa voltam ao padrão).

Front:
- Painel do mestre → aba própria **Inventário** (`MasterInventory.jsx`): escolhe o personagem, grade do inventário com +/− e remover, busca no catálogo (`/creation/catalog` já traz `equipment.items`), formulário de item livre, campos de ouro e inspiração.
- Ficha do jogador: no inventário, **Usar** no consumível escolhido (−1); no ouro do topo, **Gastar** (valor); a inspiração vira um botão que gasta quando está acesa.

Testes: `InventoryControllerTests` (403 para jogador nas rotas do mestre, soma de quantidade, item livre, remover, ouro negativo = 400, escudo removido some da CA; jogador usa consumível, gasta ouro além do que tem = 400, não usa arma como consumível, gasta inspiração).

## Etapa 2 — Ataques com arma — **feita (2026-10-28)**

**Por quê**: o jogador hoje calcula o ataque de cabeça; é a rolagem mais comum da mesa.

Back-end:
- `CharacterResponse.attacks`: uma linha por arma do inventário (`Weapon`) + ataque desarmado. Bônus de ataque = mod. do atributo (`Weapon.damageAttribute`; **acuidade** = o maior entre FOR e DES; à distância = DES) + proficiência se a ficha é proficiente (`character_weapon_proficiencies` por categoria "Armas simples"/"Armas marciais" ou pelo nome); dano = dado + mesmo mod.; tipo de dano, alcance, propriedades, crítico e maestria (texto).
- Cálculo num serviço próprio (`AttackCalculator`, como o `ArmorClassCalculator`), sem salvar.

Front:
- Card **Ataques** na aba Ficha (ou na Habilidades): nome, bônus (clicável → d20 + bônus, com vantagem/desvantagem do `DiceRoll`), dano (clicável → rola o dano; crítico dobra os dados).

Testes: proficiente × não proficiente, acuidade, arma à distância, crítico.

## Etapa 3 — Conjurar gastando Mana — **feita (2026-10-28)**

**Por quê**: Mana é a "moeda" da magia; hoje o jogador desconta os usos na mão e faz a conta do custo.

Back-end:
- `RuleClass.castingAttribute` (Acólito/Xamã SAB, Arcanista e Combatente Arcano INT…) no `criacao.json`; a magia guarda de que classe veio (já há `source` → classe) para a **CD** (8 + proficiência + mod.) e o **ataque de magia** (proficiência + mod.) em `AbilityResponse`.
- `POST /character/me/abilities/{id}/cast { level }`: confere nível ≥ nível da magia e ≤ maior nível máximo de magia do personagem; desconta `MagicRules.manaCost(level)` da habilidade "Pontos de Mana" (400 se faltar); truque não gasta. Magia com usos próprios ("sem Mana, X vezes") gasta o uso dela. Usa a regra de que o jogador mexe nos usos (já permitido).
- Nível máximo de magia do personagem: o maior entre as classes (regra de multiclasse da wiki).

Front:
- Na aba Magias: botão **Conjurar** com o nível (padrão = nível da magia), mostra o custo e a Mana restante; CD e ataque de magia na carta; rolar o ataque/dano da magia.

Testes: custo por nível, Mana insuficiente, truque grátis, nível acima do permitido, multiclasse.

## Etapa 4 — Testes contra a morte e condições — **feita (2026-10-28)**

**Por quê**: a cena de 0 PV e as condições (Caído, Agarrado, Envenenado…) acontecem em todo combate.

Back-end:
- `Character.deathSuccesses`/`deathFailures` (0–3), zerados ao ganhar PV ou no descanso; `PATCH /character/me/death-saves` (jogador) e `PATCH /character/{id}/death-saves` (mestre ajusta).
- Condições: lista do livro (conferir os nomes no Capítulo de regras da wiki) em `rules/condicoes.json` (nome + texto); `Character.conditions` (conjunto) e `exhaustion` (0–6); `PATCH /character/{id}/conditions` (só o mestre).
- `CharacterResponse`: `deathSaves`, `conditions` (com o texto), `exhaustion`.

Front:
- Herói: com 0 PV, a barra vira os 3+3 círculos dos testes (clicar rola d20: 10+ sucesso, 1 = duas falhas, 20 = volta com 1 PV).
- Chips de condição no herói com o texto na dica (só leitura para o jogador); o mestre liga/desliga no painel.

## Etapa 5 — Mestre edita o que já criou — **feita (2026-10-28)**

**Por quê**: errar um texto de habilidade ou documento hoje obriga a apagar e criar de novo (e perde ícone e usos).

Back-end:
- `PUT /character/{id}/abilities/{abilityId}` (mestre): nome, tipo, texto, usos, recarga, dano, campos de magia; mantém ícone e usos gastos (limitados ao novo máximo).
- `PUT /documents/{id}` (mestre): título, texto, imagem, destinatários; `GET /documents` passa a trazer quem leu (`DocumentRead`).
- `PATCH /character/{id}/hp { currentHp, tempHp, maxHpBonus? }` para o mestre ajustar PV de qualquer ficha.

Front:
- `MasterAbilities`: "Editar" abre o formulário preenchido.
- `MasterDocuments`: "Editar" e a lista de quem leu.

Testes: editar mantém ícone/usos, 403 para jogador, quem leu.

## Etapa 6 — Visão da mesa (painel do mestre) — **feita (2026-10-28)**

**Por quê**: durante o combate o mestre precisa ver todo mundo de uma vez.

- Aba **Mesa** no painel do mestre: um cartão por personagem com PV (barra), CA, condições, testes contra a morte, Mana e inspiração; atualiza a cada poucos segundos (polling simples de `GET /character`, só para o mestre — a rota passa a exigir o mestre, adiantando parte da segurança).
- Ações rápidas no cartão: dano/cura (usa a rota da Etapa 5), condição, inspiração.

## Depois do "para jogar"

Não fazem parte deste plano; continuam nas pendências de [backend.md](backend.md) e [frontend.md](frontend.md):

- **Segurança**: senha do banco fora do Git, rotas sem login (`POST /character`, `/background`, `/character-classes`; `GET /character` já exige o mestre), ligação conta ↔ personagem por chave estrangeira, reset de senha, CORS, enums salvos como ordinal, token no `localStorage`.
- **Front/polimento**: artes (Proto, Titan, Loge, itens), vídeos pesados no Git, roteamento, atualização em tempo real, histórico de rolagens compartilhado.
- **Regras no texto**: o que sobrou dos efeitos de Herança e dos Aprimoramentos (condicionais, escolhas de lista de outra classe), fórmulas e níveis aprendidos depois do 1º nos ofícios, o Ígneo e a Rajada Etérea.
