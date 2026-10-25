# Back-end

> Código no branch `feature/inventory` (ainda não está em `main`). Pacote raiz: `gusleite.runarcana_nexus`.

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
record/       DTOs de entrada (Java records)
enums/        enums de domínio (regras do sistema Runarcana)
```

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

`CharacterController` (`/character`) existe, mas os métodos são `private` e não têm `@GetMapping`/`@PostMapping`, então **nenhuma rota de personagem está exposta** ainda. Não há endpoints de itens nem de autenticação.

## Modelo de dados

### Itens (`model/items`)
`Item` usa herança `JOINED` (uma tabela por subclasse):
- **Item**: `id, name, itemDescription, rarity (Rarity), price, weight, size (ItemSize), effect`
- **Weapon**: `damageAttribute (Attribute), damageType (B/P/S), hitDice, hitDiceQuantity, critical, masteries (Set<WeaponMasteryType>), properties (Set<WeaponProperty>), category (WeaponCategory), weaponType (WeaponType)`
- **Armor**: `weight (ArmorWeight), armorClass, modifierAttribute (Attribute), damageReduction, nerfStealth`
- **Consumable**, **Object**: sem campos próprios por enquanto

### Personagem (`model/player`)
- **Character**: jogador, nome, `level` (0–20), ouro, idade, altura, `characterClass` (ManyToOne), PV máx./atual, atributos `str, dex, con, intel, wis, cha`, `skills` (OneToMany → CharacterSkill), `region`, `background`, `alignment`, `inspiration`.
  - Regras: modificador = `floor((atributo - 10) / 2)`; bônus de proficiência por nível (1–4: +2, 5–8: +3, 9–12: +4, 13–16: +5, 17–20: +6); percepção e intuição passivas = 10 + proficiência, se o personagem for proficiente. Hoje o cálculo passivo **não soma o modificador do atributo**.
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
- Lombok `@Data` nas entidades que precisam de getters e setters.

## Pendências / problemas conhecidos

- **Credencial no Git**: a senha do banco está versionada em `application.properties`. Mover para variável de ambiente (`${DB_PASSWORD}`) e trocar a senha.
- `CharacterController`: métodos privados e sem mapeamento, então os endpoints de personagem não existem.
- `Character`, `Item`, `Weapon`, `Armor`, `Origin` e `PlayerItems` não têm getters (nem `@Data`), então o Jackson não serializa os campos e não dá para preencher via setter.
- `Character.level` aceita 0 (`@Min(0)`), mas `getProficiencyBonus()` lança exceção para nível < 1.
- O enum `region`/`alignment` em `Character` não tem `@Enumerated(STRING)` e é salvo como ordinal (frágil se a ordem mudar).
- `BackgroundService.getBackGroundByName` dá NullPointerException quando o nome não existe; o nome do método não diz que ele altera dados.
- `ItemService` tem métodos com nomes copiados (`getAllCharacters`, `createCharacter`) e ainda não tem controller.
- Não há autenticação. O front-end precisa de um endpoint de login (ver `frontend.md`).
- Não há CORS configurado para `http://localhost:5173`.
- Teste: apenas `contextLoads`.
