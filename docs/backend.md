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
  player/     Character, CharacterSkill, Background, Occupation, Origin, PlayerItems
  roles/      CharacterClass
  auth/       Account, AuthToken (login)
record/       DTOs de entrada e saída (Java records)
enums/        enums de domínio (regras do sistema Runarcana)
config/       beans de configuração (AuthConfig: BCrypt + seed das contas)
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
| GET | `/character/me` | – (Bearer) | Ficha do personagem da conta logada: `{ character: CharacterResponse, inventory: InventoryItemResponse[] }`. 401 sem sessão; 404 com `message` se a ficha não existir |
| POST | `/auth/login` | `LoginRequest { username, password }` | Entra; devolve `{ token, expiresAt, account: { username, mustChangePassword } }`. 401 se errar |
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
- A resposta (`record/CharacterResponse`) é achatada: classe como enum, antecedente como nome, mais `proficiencyBonus`, `passivePerception` e `passiveInsight` calculados. `skills` traz **todas** as 19 perícias como `SkillResponse { skill, attribute, proficient, modifier }`, com o bônus já somado (atributo + proficiência). Isso evita o ciclo `Character` ↔ `CharacterSkill` na serialização.

### Ficha do jogador logado (`GET /character/me`)

- A conta e o personagem se ligam **pelo nome**: a conta `rudo` abre o personagem cujo `characterName` é "Rudo" (sem diferenciar maiúsculas; se houver dois, vale o de menor `id`). Não há chave estrangeira entre `Account` e `Character`.
- O inventário vem de `PlayerItems` (`PlayerItemsRepository.findByCharacterOrderByIdAsc`) e cada entrada vira um `InventoryItemResponse`: `name, description, effect, rarity, kind (WEAPON | ARMOR | CONSUMABLE | OBJECT), quantity, weight, price` e, conforme o tipo, `damage` ("1d6"), `damageType`, `properties` (arma) ou `armorClass`, `armorWeight` (armadura).
- `Armor` tem um campo `weight` (`ArmorWeight`) com o mesmo nome do peso em kg do `Item`; por isso o getter dele é `getArmorWeight()` (o Lombok está desligado nesse campo).
- `Character` usa `@Getter @Setter` (não `@Data`): o `equals`/`hashCode`/`toString` do `@Data` entraria em recursão com o `@Data` do `CharacterSkill`.

Erros de regra e de `@Valid` voltam como `{ "message": "..." }` (`exception/ApiExceptionHandler.java`), já em português para o front mostrar direto.

## Autenticação

Feita para a mesa atual (5 jogadores), sem Spring Security completo: só o `spring-security-crypto` para o BCrypt.

- **Contas** (`model/auth/Account`): `username` (único, sempre minúsculo), `passwordHash` (BCrypt), `mustChangePassword`, `passwordChangedAt`. Uma conta por personagem; o `username` é o `id` do personagem no front (`rudo`, `gaudron`, `proto`, `titan`, `loge`).
- **Seed** (`config/AuthConfig.seedAccounts`): ao subir, cria as contas que ainda não existem, com a **senha inicial igual ao nome do usuário** e `mustChangePassword = true`. A lista vem de `runarcana.auth.seed-accounts` (padrão: os 5 personagens). Conta já existente não é tocada; para "resetar" a senha de alguém, apague a linha dele em `account` (e os tokens em `auth_token`) e reinicie.
- **Login** (`services/AuthService`): o usuário não diferencia maiúsculas nem espaços nas pontas. Gera um token opaco aleatório (32 bytes, base64url) válido por 30 dias; no banco (`auth_token`) fica só o SHA-256 dele. O cliente manda `Authorization: Bearer <token>`. Tokens vencidos são limpos a cada login.
- **Troca de senha**: exige a senha atual; a nova precisa ter 6–72 caracteres, ser diferente da atual e não ser o nome do personagem. Ao trocar, `mustChangePassword` vira `false` e as **outras** sessões da conta são encerradas (a atual continua).
- As rotas antigas (`/background`, `/character-classes`) continuam **abertas**; nada exige login além de `/auth/me`, `/auth/logout` e `/auth/password`.

## Testes

`./mvnw test` usa H2 em memória (`src/test/resources/application.properties`), então não precisa do PostgreSQL. `controller/AuthControllerTests` cobre seed, login, senha errada, token inválido, troca de senha, sessões derrubadas e logout. `controller/CharacterControllerTests` cria o Rudo com o payload real (números como string) e cobre classe/antecedente inexistente, campo obrigatório vazio e enum inválido, além de `/character/me` (ficha com inventário, 401 sem login e 404 sem ficha). As tabelas antigas `character`/`character_skill` geram avisos de DDL no H2 (usam `tinyint`), sem afetar os testes.

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
- Não há papel de mestre (admin) nem tela para resetar senha esquecida; hoje o reset é apagar a conta no banco (ver Autenticação).
- Não há CORS configurado: em dev o Vite faz proxy de `/runarcana`. Num deploy com front e API em domínios diferentes, será preciso configurar CORS.
- Testes só cobrem a autenticação, as rotas de personagem e o `contextLoads`.
