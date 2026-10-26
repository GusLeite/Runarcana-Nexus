# Back-end

> Código na raiz do repositório (`src/`, `pom.xml`), já em `main`. Pacote raiz: `gusleite.runarcana_nexus`.

## Arquitetura

Camadas clássicas de Spring:

```
controller/   REST controllers (@RestController)
services/     regras de negócio (@Service)
repository/   Spring Data JPA (JpaRepository)
model/        entidades JPA
  items/      Item (base) → Weapon, Armor, Consumable, Object
  player/     Character, CharacterSkill, CharacterAbility, Background, Occupation, Origin, PlayerItems
  roles/      CharacterClass
  auth/       Account, AuthToken (login)
  notes/      PlayerNote (anotações do jogador)
  documents/  GameDocument, DocumentRead (documentos do mestre)
record/       DTOs de entrada e saída (Java records)
enums/        enums de domínio (regras do sistema Runarcana)
config/       beans de configuração (AuthConfig: BCrypt + seed das contas)
rules/        modelo do catálogo de regras de criação (RuleCatalog, RuleOption, RuleClass, Grant…)
exception/    ApiException + ApiExceptionHandler (erros viram { "message": ... })
```

Build: o `pom.xml` declara o Lombok em `annotationProcessorPaths` (obrigatório no JDK 23+) e fixa `lombok.version=1.18.48`, porque a 1.18.46 que vem com o Boot 4.1.1 quebra no `javac` do JDK 27.

Configuração em `src/main/resources/application.properties`:
- `server.servlet.context-path=/runarcana`, então todas as rotas começam com `/runarcana`
- PostgreSQL em `jdbc:postgresql://localhost:5432/runarcana`
- `spring.jpa.hibernate.ddl-auto=update` (o Hibernate cria e altera as tabelas) e `show-sql=true`

## Endpoints

| Método | Rota | Corpo | Descrição |
|---|---|---|---|
| POST | `/background` | `Background` (entidade) | Cria um antecedente |
| GET | `/background` | – | Lista os antecedentes |
| PATCH | `/background/{name}` | `BackGroundSkillsRequest { skills: SkillType[] }` | Substitui as perícias do antecedente com aquele nome |
| POST | `/character-classes` | `CharacterClassRequest { hitHpDice, className }` | Cria uma classe |
| GET | `/character-classes` | – | Lista as classes |
| POST | `/character` | `CreateCharacterRequest` (ver abaixo) | Cria um personagem; devolve `CharacterResponse` (201). 400 com `message` se faltar campo, a classe/antecedente não existir ou o JSON tiver valor fora do enum |
| GET | `/character` | – | Lista os personagens (`CharacterResponse[]`) |
| GET | `/character/me` | – (Bearer) | Ficha do personagem da conta logada: `{ character: CharacterResponse, inventory: InventoryItemResponse[], abilities: AbilityResponse[] }`. 401 sem sessão; 404 com `message` se a ficha não existir |
| POST | `/character/{id}/abilities` | `AbilityRequest` (Bearer **mestre**) | Cadastra magia/habilidade no personagem. 201; 403 para jogador |
| GET | `/character/{id}/abilities` | – (Bearer **mestre**) | Habilidades do personagem (painel do mestre) |
| PATCH | `/character/{id}/abilities/{abilityId}/icon` | `{ icon }` (Bearer **mestre**) | Troca o ícone (data URL ou link); `icon: null` remove. 400 se não for imagem PNG/JPEG/WebP/GIF ou link http(s) |
| DELETE | `/character/{id}/abilities/{abilityId}` | – (Bearer **mestre**) | Remove. 204 |
| PATCH | `/character/me/abilities/{abilityId}` | `{ usesLeft }` (Bearer) | Jogador gasta/recupera usos. 400 se passar do máximo ou a habilidade não tiver usos |
| POST | `/character/me/rest` | `{ type: SHORT \| LONG }` (Bearer) | Descanso: curto recupera o que é `SHORT_REST`; longo recupera tudo que recarrega. Devolve as habilidades |
| GET | `/notes` | – (Bearer) | Anotações do jogador (fixadas primeiro, depois as mais recentes) |
| POST | `/notes` | `NoteRequest { title, body, pinned }` (Bearer) | Cria. Título vazio vira "Sem título". 201 |
| PUT | `/notes/{id}` | `NoteRequest` (Bearer) | Atualiza. 404 se a nota não for da conta |
| DELETE | `/notes/{id}` | – (Bearer) | Apaga. 204 |
| GET | `/documents/me` | – (Bearer) | Documentos para o jogador (para todos ou só para ele), com `read` |
| POST | `/documents/{id}/read` | – (Bearer) | Marca como lido. 204; 404 se o documento não for para ele |
| GET | `/documents` | – (Bearer **mestre**) | Todos os documentos, com `recipients` |
| GET | `/documents/recipients` | – (Bearer **mestre**) | Usernames que podem receber documentos (todas as contas de jogador, em ordem) |
| POST | `/documents` | `DocumentRequest` (Bearer **mestre**) | Envia um documento. 201 |
| GET | `/creation/catalog` | – (Bearer) | Catálogo de regras de criação (origens, classes, passados, regiões, ofícios, Heranças, métodos de atributos) |
| POST | `/creation/preview` | `CreationRequest` (Bearer) | Ficha em construção calculada (não salva). `errors` vazio = pode criar |
| POST | `/creation` | `CreationRequest` (Bearer) | Cria a ficha da conta logada. 201; 400 com o 1º erro da prévia; 409 se a conta já tem ficha; 403 para o mestre |
| DELETE | `/documents/{id}` | – (Bearer **mestre**) | Apaga (e as marcas de lido). 204 |
| POST | `/auth/login` | `LoginRequest { username, password }` | Entra; devolve `{ token, expiresAt, account: { username, mustChangePassword, master } }`. 401 se errar |
| GET | `/auth/me` | – (Bearer) | Conta do token. 401 se o token for inválido ou expirado |
| POST | `/auth/logout` | – (Bearer) | Apaga o token. 204 |
| PUT | `/auth/password` | `ChangePasswordRequest { currentPassword, newPassword }` (Bearer) | Troca a senha; devolve a conta. 400 com `message` se a regra falhar |

Não há endpoints de itens.

### Criação de personagem

O endpoint não recebe a entidade `Character`: recebe o DTO `record/CreateCharacterRequest`, e o `CharacterService` monta a entidade.
- `characterClass` é um `CharacterClassType` (ex.: `"ARCANIST"`); o service busca a `CharacterClass` já cadastrada (`findByClassName`). Se não existir, 400. Cadastre antes em `POST /character-classes`.
- `background` é o **nome** do antecedente (sem diferenciar maiúsculas). É opcional; se vier e não existir, 400.
- `skills` é a lista de `SkillType` em que o personagem é **proficiente**; cada uma vira um `CharacterSkill` com `proficient = true` (repetidas contam uma vez).
- Validações com mensagem em PT: nomes obrigatórios, `level` 1–20, atributos e PV máx. > 0, `currentHp` ≤ `maxHp`.
- A resposta (`record/CharacterResponse`) é achatada: classe como enum, antecedente como nome, mais `proficiencyBonus`, `passivePerception`, `passiveInsight` calculados e `hitDie` (dado de vida da classe). `skills` traz **todas** as 19 perícias como `SkillResponse { skill, attribute, proficient, expertise, modifier }`, com o bônus já somado (atributo + proficiência, duas vezes com especialidade: `CharacterSkill.expertise`; as passivas também usam). Isso evita o ciclo `Character` ↔ `CharacterSkill` na serialização.

### Assistente de criação (`/creation`)

As regras (o que cada origem, classe, antecedente e região concede) ficam em `src/main/resources/rules/criacao.json`, descritas em [regras-criacao.md](regras-criacao.md). `RuleCatalogService` lê o arquivo ao subir (Jackson 3 estrito: chave desconhecida é erro) e confere tudo; problema no arquivo impede a aplicação de subir, com a lista de erros e onde estão. O caminho vem de `runarcana.rules.catalog` (os testes usam `rules/criacao-teste.json`). As **Heranças** ficam num arquivo à parte, `rules/herancas.json` (`runarcana.rules.heritages`; testes: `rules/herancas-teste.json`), juntado ao catálogo ao subir e conferido junto. Os **traços da Runinata** ficam em `rules/tracos.json` (`runarcana.rules.traits`; testes: `rules/tracos-teste.json`), também juntados ao catálogo (`RuleCatalog.traits`, records `RuleTraits`/`RuleTrait`).

`CreationService.evaluate` faz a conta uma vez só, usada pela prévia e pela criação:
1. resolve origem (e a **linhagem**, obrigatória quando a origem tem `lineages`; as concessões dela viram a fonte "Linhagem: …"), os **traços** quando a origem tem `usesTraits` (ver abaixo), região, classe (e a **subclasse**, `CreationRequest.subclassId`, obrigatória quando a classe tem `subclasses`; fonte "Glifo: …", "Cabala: …") e passado (região e passado são obrigatórios se o catálogo tiver algum; na Runinata o passado só existe com um traço `background`);
2. valida os atributos base pelo método (`POINT_BUY` com custo e orçamento, `STANDARD_ARRAY` usando cada valor uma vez, `MANUAL` na faixa);
3. (`FEATURE` com `options` e `PROFICIENCY_CHOICE` são escolhas da 2ª passada.) Aplica as concessões **fixas** (atributo, perícia, resistência, passiva/habilidade, PV, deslocamento, ouro, tamanho, ofício, idioma, pontos de Herança de Região) e depois as **escolhas** (`ATTRIBUTE_CHOICE`, `SKILL_CHOICE`, `SIZE_CHOICE`, `CRAFT_CHOICE`, `LANGUAGE_CHOICE`). Cada escolha tem uma chave `"<fonte>:<id>:<índice>"` (ex.: `class:ARCANIST:2`), que a prévia devolve e o front manda de volta em `choices`. O que já foi ganho some das opções. Escolha de ofício/idioma **sem opções cadastradas** volta com `note` e não bloqueia a criação;
4. compra as **Heranças** (`CreationRequest.heritages`, lista de `{ id, option }`; repetir o id = escolher de novo): cada uma custa 1 ponto do tipo certo (`HERITAGE_POINTS` com `value` REGION compra Heranças de Região e Gerais; ORIGIN, de Origem e Gerais; sem value, qualquer uma; as Gerais usam o ponto que sobrar). Confere os pré-requisitos que dá para checar (origem, linhagem, região, classe, atributo mínimo, `requires` — outra Herança escolhida —, `excludes`), `maxTimes` e a opção obrigatória (`options`). A prévia devolve `heritagePools` (pontos e gastos por tipo), `heritages` (escolhidas) e `heritageOptions` (cada Herança do catálogo com `available` e o motivo quando não dá). Ponto sobrando com Herança disponível é erro. Cada Herança escolhida entra em `features` como `HERITAGE` (nome com a opção e "(2×)" quando repetida);
   Traços (`CreationService.traits`): `CreationRequest.traitBudget` (id do modo), `traits` e `drawbacks` (listas de `{ id, detail }`; repetir o id = escolher de novo). Confere máximo, `requires` e resposta obrigatória (`detail`); escolhe sozinho se converte 1 traço menor e/ou 1 maior em pontos (a combinação que cobre as escolhas com menos sobra). Cada escolha vira uma fonte "Traço: …"/"Desvantagem: …" (chaves `trait:<id>:<n>:<i>`), e o traço sem `silent` vira uma passiva. A prévia devolve `traitBudget` (vagas, usados, conversões, pontos e gastos), `traits` e `traitOptions` (disponível ou o motivo). Tamanho fixo (`SIZE`) vence `SIZE_CHOICE`; pontos `GENERAL` só compram Heranças Gerais;
5. calcula PV (dado de vida + mod. CON + bônus), deslocamento em **pés** (da origem ou `baseSpeed`) e ouro; habilidades que escalam (`usesFormula`, `diceByProficiency`) saem calculadas para o bônus de proficiência +2 (`CreationService.usesFor`/`diceFor`, arredondamento por `rounding`); junta os erros (o que falta escolher, nome, idade e altura).

Na criação: a classe vira/atualiza a linha de `CharacterClass` (com o dado de vida do catálogo); o antecedente vira um `Background` (criado se não existir); a ficha nasce no nível 1, **ligada à conta** (`Character.account`), com perícias, resistências (`character_saving_throws`), origem, deslocamento de caminhada (`speed`, pés) e os outros tipos (`character_speeds`: natação, escalada, voo, escavação, enum `MovementType`), tamanho (`CreatureSize`), subclasse (`Character.subclass`), proficiências com armaduras (`character_armor_proficiencies`) e armas (`character_weapon_proficiencies`), ofícios com especialidade (`character_craft_expertise`), idiomas (`character_languages`), ofícios pelo **nome** (`character_crafts`), Heranças pelo nome (`character_heritages`), pontos de Herança que **sobraram** (`heritagePoints`, normalmente 0) e as escolhas guardadas em `Character.build` (JSON, para a subida de nível); cada `FEATURE` e cada Herança (tipo `HERITAGE`, com o texto completo) vira uma `CharacterAbility`. A ficha (`CharacterResponse`) e a prévia trazem `speeds`: lista `{ type, feet }` com a caminhada primeiro e depois os outros tipos que existirem (`SpeedLine`).

### Regras da mesa (`/creation/settings`)

Configurações que o mestre define e a criação respeita, na tabela `table_setting` (chave → valor; `TableSettingsService`). Hoje: `runinata.traitBudget`, o modo de traços da Runinata travado. `GET /creation/settings` (qualquer conta logada) devolve `{ traitBudget }`; `PUT /creation/settings` (só o mestre; 403 para jogador, 400 para modo desconhecido) trava ou, com `null`, destrava. A prévia marca `traitBudget.locked`.

### Classe de Armadura

`ArmorClassCalculator` monta as opções de defesa: **Sem armadura** (10 + DES), as CAs alternativas da criação (`Character.armorRules`, tabela `character_armor_rules`, vindas das concessões `ARMOR_CLASS`; chave `RULE:<n>`, contando só as opções) e as **armaduras do inventário** (`Armor`: CA + mod. do `modifierAttribute`, no máximo +2 se média, nada se pesada; RD = `damageReduction`; chave `ITEM:<id do PlayerItems>`), a não ser que alguma regra tenha `blocksArmor`. Os bônus (`AC_BONUS`) somam em todas as opções (os `unarmoredOnly`, não nas armaduras do inventário). A defesa em uso é `Character.defense`; sem escolha, vale a de maior CA. `GET /character/me` traz `armorClass` (`value`, `reduction`, `selected`, `options`, `bonuses`, `blockedBy`) e `PATCH /character/me/defense` `{ key }` troca a defesa (400 se a opção não existe). A prévia da criação traz a mesma `armorClass`, sem inventário.

### Ficha do jogador logado (`GET /character/me`)

- A ficha da conta é achada pela **ligação direta** (`Character.account`, preenchida pelo assistente de criação). Fichas antigas, sem dono (como o Rudo criado pelo `POST /character`), ainda são achadas **pelo nome**: a conta `rudo` abre o personagem "Rudo" (sem diferenciar maiúsculas). A busca por nome ignora fichas que já têm dono.
- O inventário vem de `PlayerItems` (`PlayerItemsRepository.findByCharacterOrderByIdAsc`) e cada entrada vira um `InventoryItemResponse`: `name, description, effect, rarity, kind (WEAPON | ARMOR | CONSUMABLE | OBJECT), quantity, weight, price` e, conforme o tipo, `damage` ("1d6"), `damageType`, `properties` (arma) ou `armorClass`, `armorWeight` (armadura).
- `Armor` tem um campo `weight` (`ArmorWeight`) com o mesmo nome do peso em kg do `Item`; por isso o getter dele é `getArmorWeight()` (o Lombok está desligado nesse campo).
- `Character` usa `@Getter @Setter` (não `@Data`): o `equals`/`hashCode`/`toString` do `@Data` entraria em recursão com o `@Data` do `CharacterSkill`.

### Magias e habilidades (`CharacterAbility`)

- Campos: `name`, `type` (`SPELL | ABILITY | PASSIVE`), `spellLevel` (0 = truque, 1–9; só em magia), `school`, `castingTime`, `range` (coluna `ability_range`), `duration`, `components`, `damage` (expressão "2d6+4"; o front rola direto dela), `description`, `maxUses`/`usesLeft` (nulos = uso livre) e `recharge` (`SHORT_REST | LONG_REST | NONE`; padrão `LONG_REST` quando há usos), `icon` (opcional).
- **Ícone**: guardado na própria linha (`icon`, até 300.000 caracteres) como **data URL** (`data:image/png|jpeg|webp|gif;base64,...`) ou **link http(s)**; qualquer outra coisa dá 400 (`AbilityIconRequest.ICON_PATTERN`, também usado no `AbilityRequest`). O front já manda a imagem reduzida para 128×128 em WebP (uns 3–20 KB), então não há rota de upload nem arquivo em disco; o ícone vem junto em `/character/me`.
- O mestre cadastra; o jogador só gasta/recupera usos e descansa. Os usos começam cheios.
- Exemplo (mestre, `POST /runarcana/character/1/abilities`): `{ "name": "Seta Estelar", "type": "SPELL", "spellLevel": 1, "range": "36 m", "damage": "3d4+3", "maxUses": 4, "recharge": "LONG_REST", "description": "Três dardos de luz." }`

### Documentos do mestre (`GameDocument`)

- Campos: `title`, `kind` (`LETTER | CLUE | MAP | LORE | SECRET | REWARD`, muda ícone e cor no front), `body` (texto; o front entende `## título`, `**negrito**` e `*itálico*`), `imageUrl` (opcional, `http(s)://`), `recipients` (usernames; vazio = **todos**), `createdAt`, `author`.
- Leitura por jogador fica em `DocumentRead` (único por documento + conta). O jogador não vê para quem mais o documento foi (`recipients` vem nulo para ele).
- Exemplo (mestre, `POST /runarcana/documents`): `{ "title": "Carta selada", "kind": "SECRET", "body": "## Só para você\n\nO templo abre à noite.", "recipients": ["rudo"] }`

### Anotações (`PlayerNote`)

Por conta (não por personagem): `title`, `body` (até 20.000 caracteres), `pinned`, `createdAt`, `updatedAt`. Nota de outra conta responde 404. `pinned` é `Boolean` no DTO porque o Jackson 3 (Boot 4) recusa campo primitivo ausente no JSON.

Erros de regra e de `@Valid` voltam como `{ "message": "..." }` (`exception/ApiExceptionHandler.java`), já em português para o front mostrar direto.

## Autenticação

Feita para a mesa atual (5 jogadores), sem Spring Security completo: só o `spring-security-crypto` para o BCrypt.

- **Contas** (`model/auth/Account`): `username` (único, sempre minúsculo), `passwordHash` (BCrypt), `mustChangePassword`, `passwordChangedAt`, `role` (`PLAYER | MASTER`; nulo nas contas antigas = jogador). Uma conta por personagem; o `username` é o `id` do personagem no front (`rudo`, `gaudron`, `proto`, `titan`, `loge`).
- **Mestre**: a conta `mestre` (`role = MASTER`) é a única que cadastra magias/habilidades e envia documentos (`AuthService.requireMaster`, 403 "Só o mestre pode fazer isso." para jogadores). No front, o mestre entra pelo botão **MESTRE** da tela inicial e usa o painel do mestre (ver `frontend.md`); a API também pode ser usada direto pelo Swagger (`/runarcana/swagger-ui.html`) com o token em `Authorization: Bearer <token>`.
- **Seed** (`config/AuthConfig.seedAccounts`): ao subir, cria as contas que ainda não existem, com a **senha inicial igual ao nome do usuário** e `mustChangePassword = true`. Jogadores vêm de `runarcana.auth.seed-accounts` (padrão: os 5 personagens); mestres, de `runarcana.auth.master-accounts` (padrão: `mestre`). Troque a senha do mestre logo no primeiro acesso (`PUT /auth/password`). Conta já existente não é tocada; para "resetar" a senha de alguém, apague a linha dele em `account` (e os tokens em `auth_token`) e reinicie.
- **Login** (`services/AuthService`): o usuário não diferencia maiúsculas nem espaços nas pontas. Gera um token opaco aleatório (32 bytes, base64url) válido por 30 dias; no banco (`auth_token`) fica só o SHA-256 dele. O cliente manda `Authorization: Bearer <token>`. Tokens vencidos são limpos a cada login.
- **Troca de senha**: exige a senha atual; a nova precisa ter 6–72 caracteres, ser diferente da atual e não ser o nome do personagem. Ao trocar, `mustChangePassword` vira `false` e as **outras** sessões da conta são encerradas (a atual continua).
- As rotas antigas (`/background`, `/character-classes`) continuam **abertas**; nada exige login além de `/auth/me`, `/auth/logout` e `/auth/password`.

## Testes

`./mvnw test` usa H2 em memória (`src/test/resources/application.properties`), então não precisa do PostgreSQL. `controller/AuthControllerTests` cobre seed, login, senha errada, token inválido, troca de senha, sessões derrubadas e logout. `controller/CharacterControllerTests` cria o Rudo com o payload real (números como string) e cobre classe/antecedente inexistente, campo obrigatório vazio e enum inválido, além de `/character/me` (ficha com inventário, 401 sem login e 404 sem ficha). `controller/PlayerFeaturesTests` cobre habilidades (cadastro, listagem e exclusão pelo mestre, 403 para jogador, usos e descanso, ícone: guardar, trocar por link, remover e recusar tipo inválido), a lista de destinatários, anotações (CRUD e isolamento entre contas) e documentos (destinatários, lido, exclusão, 403 e destinatário inexistente). `controller/CreationControllerTests` cobre o assistente (catálogo exige login, prévia aplicando cada tipo de concessão, o que falta, compra de pontos estourada, criação ligada à conta, 409 na segunda, 403 para o mestre e as Heranças: tipo de ponto, pré-requisitos, exclusão, opção, repetição e pontos sobrando) e `services/RuleCatalogValidationTests` cobre a conferência do catálogo (inclusive Heranças e ofícios) e garante que o `rules/criacao.json` e o `rules/herancas.json` reais continuam válidos. As tabelas antigas `character`/`character_skill` geram avisos de DDL no H2 (usam `tinyint`), sem afetar os testes.

## Modelo de dados

### Itens (`model/items`)
`Item` usa herança `JOINED` (uma tabela por subclasse):
- **Item**: `id, name, itemDescription, rarity (Rarity), price, weight, size (ItemSize), effect`
- **Weapon**: `damageAttribute (Attribute), damageType (B/P/S), hitDice, hitDiceQuantity, critical, masteries (Set<WeaponMasteryType>), properties (Set<WeaponProperty>), category (WeaponCategory), weaponType (WeaponType)`
- **Armor**: `weight (ArmorWeight), armorClass, modifierAttribute (Attribute), damageReduction, nerfStealth`
- **Consumable**, **Object**: sem campos próprios por enquanto

### Personagem (`model/player`)
- **Character**: jogador, nome, `level` (1–20), ouro, idade, altura, `characterClass` (ManyToOne), PV máx./atual, atributos `str, dex, con, intel, wis, cha`, `skills` (OneToMany → CharacterSkill), `region`, `background`, `alignment`, `inspiration`.
  - Regras: modificador = `floor((atributo - 10) / 2)`; bônus de proficiência por nível (1–4: +2, 5–8: +3, 9–12: +4, 13–16: +5, 17–20: +6); bônus de perícia (`getSkillModifier`) = modificador do atributo base + proficiência, se proficiente; percepção e intuição passivas = 10 + bônus da perícia.
- **CharacterSkill**: `character, skillType, proficient`
- **Background** (antecedente): `name` (único), `skills` (tabela `background_skills`), `occupation`, `items` (ManyToMany, tabela `background_items`)
- **Occupation**: `name` (único)
- **Origin**: `name, description, baseMovementSpeed`
- **PlayerItems**: inventário (`character, item, quantity`)

### Classe (`model/roles`)
- **CharacterClass**: `className (CharacterClassType, único), hitHpDice`. Usa herança `JOINED`, pronta para subclasses específicas.

## Enums de domínio

| Enum | Valores |
|---|---|
| `CharacterClassType` | ACOLYTE, ARCANIST, MARKSMAN, BODHISATTVA, BRUTE, HUNTER, FIGHTER, MERCURIAL, SHAMAN |
| `Attribute` | STRENGTH, DEXTERITY, CONSTITUTION, INTELLIGENCE, WISDOM, CHARISMA |
| `SkillType` | perícias de 5e com o atributo base; inclui `TECHNOLOGY` (INT), uma adaptação do Runarcana |
| `Region` | BILGEWATER, BANDLE_CITY, DEMACIA, FRELJORD, SHADOW_ISLES, IONIA, IXTAL, NOXUS, NAZUMAH, PILTOVER, SHURIMA, TARGON, VOID, ZAUN |
| `Alignment` | os 9 alinhamentos de 5e |
| `Rarity` | Common, Uncommon, Rare, Epic, Legendary, Mythical, Forbidden |
| `WeaponMasteryType` | CLEAVE, GRAZE, NICK, PUSH, SAP, SLOW, TOPPLE, VEX, cada um com uma descrição em PT |
| `WeaponProperty` | FINESSE, THROWN, TWO_HANDED, LIGHT, HEAVY, VERSATILE, AMMUNITION, RELOAD, EXPLOSIVE, SCATTER, REACH |
| `WeaponCategory` / `WeaponType` | SIMPLE, MARTIAL, IMPROVISED, FIREARM / FIREARM, CHAIN, REGIONAL, SPECIAL |
| `DamageType`, `ArmorWeight`, `ItemSize`, `ItemWeight` | B/P/S; LIGHT/MEDIUM/HEAVY; SMALL/MEDIUM/LARGE; LIGHT/MEDIUM/HEAVY |
| `AccountRole` | PLAYER, MASTER |
| `AbilityType`, `Recharge`, `RestType` | SPELL/ABILITY/PASSIVE/HERITAGE; SHORT_REST/LONG_REST/NONE; SHORT/LONG |
| `HeritageCategory` | GENERAL, ORIGIN, REGION (tipo de Herança) |
| `DocumentKind` | LETTER, CLUE, MAP, LORE, SECRET, REWARD |
| `GrantType` | ATTRIBUTE, ATTRIBUTE_CHOICE, SKILL, SKILL_CHOICE, SAVING_THROW, FEATURE, HP_BONUS, SPEED, GOLD, SIZE, SIZE_CHOICE, CRAFT, CRAFT_CHOICE, LANGUAGE, LANGUAGE_CHOICE, HERITAGE_POINTS (concessões das regras de criação) |
| `CreatureSize`, `UsesFormula` | TINY/SMALL/MEDIUM/LARGE/HUGE; FIXED/HALF_PROFICIENCY/PROFICIENCY |

## Convenções

- Injeção: novos services usam **injeção por construtor** (como `BackgroundService`); evite `@Autowired` em campo.
- DTOs de entrada em `record/` como Java `record`.
- Lombok `@Data` nas entidades que precisam de getters e setters; em entidades com relação bidirecional (`Character` ↔ `CharacterSkill`) e na hierarquia de `Item`, use `@Getter @Setter`.

## Pendências / problemas conhecidos

- **Credencial no Git**: a senha do banco está versionada em `application.properties`. Mover para variável de ambiente (`${DB_PASSWORD}`) e trocar a senha.
- `Origin` não tem getters (nem `@Data`).
- Não há rotas de itens nem de inventário: hoje os itens só entram no banco direto (tabelas `item`/`weapon`/`armor`/... e `player_items`). A ficha mostra o inventário, mas ninguém consegue preenchê-lo pela API.
- `POST /character` e `GET /character` não exigem login; só `/character/me` exige. A ligação conta ↔ personagem é pelo nome (ver acima), não por chave estrangeira.
- Ainda não há rotas para editar a ficha (PV atual, ouro, inspiração) nem para apagá-la.
- O enum `region`/`alignment` em `Character` não tem `@Enumerated(STRING)` e é salvo como ordinal (frágil se a ordem mudar).
- `BackgroundService.getBackGroundByName` dá NullPointerException quando o nome não existe; o nome do método não diz que ele altera dados.
- `ItemService` tem métodos com nomes copiados (`getAllCharacters`, `createCharacter`) e ainda não tem controller.
- As rotas de dados (`/background`, `/character-classes`) não exigem login. Quando houver rotas de ficha/inventário, proteger com `AuthService.authenticate` (ou migrar para Spring Security).
- Não há como resetar senha esquecida; hoje o reset é apagar a conta no banco (ver Autenticação).
- Back-end iniciado antes de uma mudança não tem as rotas novas: o front recebe 404 (ex.: "Nova" anotação). Reinicie o `spring-boot:run` depois de puxar o código.
- Não há rota para o mestre editar uma habilidade (só criar e apagar) nem para editar um documento já enviado.
- Documentos aceitam só link de imagem (`imageUrl`); não há upload de arquivos.
- Não há CORS configurado: em dev o Vite faz proxy de `/runarcana`. Num deploy com front e API em domínios diferentes, será preciso configurar CORS.
- Testes não cobrem `/background`, `/character-classes` nem itens.
- **Regras de criação incompletas**: as 10 origens reais estão cadastradas; classes e passados ainda são de exemplo (lista do que falta em [regras-criacao.md](regras-criacao.md)). Idiomas estão desligados por decisão do usuário (a estrutura continua no código).
- Heranças: o efeito de cada uma é **texto** (habilidade `HERITAGE`); nada é aplicado na ficha automaticamente (ex.: Inspirar Aliados não muda os usos do Inspirado). Pré-requisitos como "Conjuração" ou "Ofício de Artista" não são conferidos, só mostrados. Estão cadastradas as Gerais, as de Região e as de Origem de todas as origens cadastradas; o pré-requisito de linhagem (ex.: Brutalizador → Auroque, Mestre de Vinhas → Floral) é conferido. Pré-requisitos com caminhos alternativos usam `anyOf` (origem, linhagem, outra Herança com opção, opção de habilidade): Cauda Preênsil (linhagem Shimon/Oovi-Kat ou Meio-Vastaya dessas tribos) e Variante Glacinata (Construto/Humano/Minotauro/Yordle, Troll do Gelo ou Floral com Flor Gélida).
- Construto: Proteção Ajustável (modos de CA/RD), Construto Vivo e Peculiaridades ficam no texto; a Herança "Variante Nebulon" (Nebulon é um tipo de Construto) tem o texto completo e pede a perícia da Memória Longeva como opção; especialidade, idiomas, Mente Centenária e Gasoso ficam no texto. Gás Corrosivo, Ionizado e Termiônico exigem a variante (`requires`).
- Classes: não há catálogo de magias nem de itens; Mistérios, truques e magias conhecidas ficam como escolha/texto, e o equipamento inicial só na descrição. Maestria de Armas, idiomas da classe e limites de "por turno" ficam no texto.
- **Ganhos por nível** (`levels`) de classe, subclasse, origem e linhagem (`RuleLevel`, conferidos ao subir) ainda não são aplicados: não existe subida de nível. O Meio-Dragão de 1º nível não tem sopro nem forma na ficha (certo pela regra); o mestre pode adicionar pelo painel até a subida de nível existir.
- Runinata: respostas livres (`detail`) não são conferidas.
- Origens novas, o que fica só no texto: deslocamentos que dependem de outro (Heranças como Pés Cascudos e Vida Marinha, "igual ao seu deslocamento") e os de formas temporárias (voo da Forma Dracônica, formas de Sho'Ma); CA das Heranças (Proteção Metálica, Guerreiro Primal, Resiliência Adaptativa…) e escudos (o inventário não tem escudo); requisitos dos modos da Proteção Ajustável (proficiência com armaduras médias/pesadas) só aparecem no nome, e o padrão é a maior CA, então o jogador deve escolher o modo certo; Mordida do Troll virar 1d8 no 6º nível. As especialidades das **Heranças** ("caso já tenha, recebe especialidade") e a perícia da Memória Longeva do Nebulon continuam só no texto, como todo efeito de Herança.
- Efeitos de linhagem como "+1 de CA sem armadura" (Auroque) e "RD de metade da proficiência" (Alnuk) ficam no texto: a ficha ainda não calcula CA nem RD.
- Dano com `damageBonus` (ex.: Chifres 1d6+5) e PV por nível são calculados na criação; mudar Força depois não atualiza o dado, e a subida de nível ainda não soma os PV dos próximos níveis.
- Subida de nível ainda não existe: as classes já guardam os ganhos por nível (`levels`) e a ficha guarda as escolhas da criação (`build`), mas não há rota nem tela.
- `POST /character` (antigo, sem assistente) continua aberto e não liga a ficha a uma conta.
