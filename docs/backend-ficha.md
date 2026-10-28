# Back-end — ficha, inventário, habilidades, documentos e anotações

> Parte do [backend.md](backend.md). Inclui o modelo de dados e os enums.

## Classe de Armadura

`ArmorClassCalculator` monta as opções de defesa: **Sem armadura** (10 + DES), as CAs alternativas da criação (`Character.armorRules`, tabela `character_armor_rules`, vindas das concessões `ARMOR_CLASS`; chave `RULE:<n>`, contando só as opções) e as **armaduras do inventário** (`Armor`: CA + mod. do `modifierAttribute`, no máximo +2 se média, nada se pesada; RD = `damageReduction`; chave `ITEM:<id do PlayerItems>`), a não ser que alguma regra tenha `blocksArmor`. Os bônus (`AC_BONUS`) somam em todas as opções (os `unarmoredOnly`, não nas armaduras do inventário). A defesa em uso é `Character.defense`; sem escolha, vale a de maior CA. **Escudos**: os itens do inventário cujo `catalogId` é um item `kind: SHIELD` do `itens.json` com `armorClass` fixo (Escudo Leve +1, Pesado e de Torre +2; o Broquel, "Especial", é reação e fica de fora). Entram como objeto comum, então o bônus vem do catálogo (`CharacterService.shieldsOf`). O escudo em uso (`Character.shield`: `ITEM:<id>`, `NONE` ou nulo = o de maior bônus) soma em **todas** as opções de defesa e aparece em `bonuses` ("Escudo Leve +1", com "(sem proficiência com escudos)" quando falta a proficiência; a CA soma mesmo assim). `GET /character/me` traz `armorClass` (`value`, `reduction`, `selected`, `options`, `bonuses`, `blockedBy`, `shield`, `shields`), `PATCH /character/me/defense` `{ key }` troca a defesa e `PATCH /character/me/shield` `{ key }` troca o escudo (`NONE` = sem escudo); 400 se a opção não existe. A prévia da criação traz a mesma `armorClass`, sem inventário.

## Ataques com arma

`AttackCalculator` (sem salvar, como a CA) monta `attacks` em `GET /character/me`: uma linha por arma do inventário (lida do `itens.json` pelo `catalogId`; sem catálogo, da linha de `Weapon`) e o **ataque desarmado** (1 + FOR, contundente, sempre proficiente) no fim. Atributo: **acuidade** = o maior entre FOR e DES; **à distância** (munição, arma de fogo, grupo `-distancia` ou categoria "Distância") = DES; senão FOR (arremesso corpo a corpo usa FOR). **Proficiência** pelas `weaponProficiencies`: categoria ("Armas simples" ↔ grupo `arma-simples`; também marciais, de fogo, Bodisatva, de corrente, impróprias) ou nome no plural ("Espadas longas" ↔ Espada Longa, sem acento). `AttackResponse`: `attackBonus` (mod. + proficiência), `damage` (primeiro dado do livro + mod., "1d8+3"), `versatileDamage` ("Versátil (1d10 r)"), `damageType` (r = cortante, p = perfurante, c = contundente), `critRange`/`critMultiplier` ("p 19 x3" → 19, 3; padrão 20, ×2), `range` ("20/60 pés", das propriedades ou do alcance das armas de fogo), `mastery`, `properties` (texto).

## Ficha do jogador logado (`GET /character/me`)

- A ficha da conta é achada pela **ligação direta** (`Character.account`, preenchida pelo assistente de criação). Fichas antigas, sem dono (como o Rudo criado pelo `POST /character`), ainda são achadas **pelo nome**: a conta `rudo` abre o personagem "Rudo" (sem diferenciar maiúsculas). A busca por nome ignora fichas que já têm dono.
- O inventário vem de `PlayerItems` (`PlayerItemsRepository.findByCharacterOrderByIdAsc`) e cada entrada vira um `InventoryItemResponse`: `name, description, effect, rarity, kind (WEAPON | ARMOR | CONSUMABLE | OBJECT), quantity, weight, price` e, conforme o tipo, `damage` ("1d6"), `damageType`, `properties` (arma) ou `armorClass`, `armorWeight` (armadura).
- `Armor` tem um campo `weight` (`ArmorWeight`) com o mesmo nome do peso em kg do `Item`; por isso o getter dele é `getArmorWeight()` (o Lombok está desligado nesse campo).
- `Character` usa `@Getter @Setter` (não `@Data`): o `equals`/`hashCode`/`toString` do `@Data` entraria em recursão com o `@Data` do `CharacterSkill`.

## Magias e habilidades (`CharacterAbility`)

- Campos: `name`, `type` (`SPELL | ABILITY | PASSIVE`), `spellLevel` (0 = truque, 1–9; só em magia), `school`, `castingTime`, `range` (coluna `ability_range`), `duration`, `components`, `damage` (expressão "2d6+4"; o front rola direto dela), `description`, `maxUses`/`usesLeft` (nulos = uso livre) e `recharge` (`SHORT_REST | LONG_REST | NONE`; padrão `LONG_REST` quando há usos), `icon` (opcional).
- **Ícone**: guardado na própria linha (`icon`, até 300.000 caracteres) como **data URL** (`data:image/png|jpeg|webp|gif;base64,...`) ou **link http(s)**; qualquer outra coisa dá 400 (`AbilityIconRequest.ICON_PATTERN`, também usado no `AbilityRequest`). O front já manda a imagem reduzida para 128×128 em WebP (uns 3–20 KB), então não há rota de upload nem arquivo em disco; o ícone vem junto em `/character/me`.
- O mestre cadastra; o jogador só gasta/recupera usos e descansa. Os usos começam cheios.
- Exemplo (mestre, `POST /runarcana/character/1/abilities`): `{ "name": "Seta Estelar", "type": "SPELL", "spellLevel": 1, "range": "36 m", "damage": "3d4+3", "maxUses": 4, "recharge": "LONG_REST", "description": "Três dardos de luz." }`

## Documentos do mestre (`GameDocument`)

- Campos: `title`, `kind` (`LETTER | CLUE | MAP | LORE | SECRET | REWARD`, muda ícone e cor no front), `body` (texto; o front entende `## título`, `**negrito**` e `*itálico*`), `imageUrl` (opcional, `http(s)://`), `recipients` (usernames; vazio = **todos**), `createdAt`, `author`.
- Leitura por jogador fica em `DocumentRead` (único por documento + conta). O jogador não vê para quem mais o documento foi (`recipients` vem nulo para ele).
- Exemplo (mestre, `POST /runarcana/documents`): `{ "title": "Carta selada", "kind": "SECRET", "body": "## Só para você\n\nO templo abre à noite.", "recipients": ["rudo"] }`

## Anotações (`PlayerNote`)

Por conta (não por personagem): `title`, `body` (até 20.000 caracteres), `pinned`, `createdAt`, `updatedAt`. Nota de outra conta responde 404. `pinned` é `Boolean` no DTO porque o Jackson 3 (Boot 4) recusa campo primitivo ausente no JSON.

## Modelo de dados

### Itens (`model/items`)
`Item` usa herança `JOINED` (uma tabela por subclasse):
- **Item**: `id, name, itemDescription, rarity (Rarity), price, weight, size (ItemSize), effect`
- **Weapon**: `damageAttribute (Attribute), damageType (B/P/S), hitDice, hitDiceQuantity, critical, masteries (Set<WeaponMasteryType>), properties (Set<WeaponProperty>), category (WeaponCategory), weaponType (WeaponType)`
- **Armor**: `weight (ArmorWeight), armorClass, modifierAttribute (Attribute), damageReduction, nerfStealth`
- **Consumable**, **Object**: sem campos próprios por enquanto

### Personagem (`model/player`)
- **Character**: jogador, nome, `level` (1–20), ouro, idade, altura, `characterClass` (ManyToOne), PV máx./atual, `tempHp` (PV temporários; nulo nas fichas antigas = 0), atributos `str, dex, con, intel, wis, cha`, `skills` (OneToMany → CharacterSkill), `region`, `background`, `alignment`, `inspiration`.
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

## Pendências / problemas conhecidos

- Inventário depois da criação (`InventoryService`, decisão da mesa): o mestre dá e tira itens, ouro e inspiração; o jogador só gasta. **Consumível** = `Consumable` ou item do catálogo com kind `AMMUNITION` ou grupo `consumivel` no `itens.json` (`EquipmentRules.consumable`; as linhas de `Item` antigas foram criadas como objeto comum, por isso a conferência também olha o catálogo). A munição do catálogo vem em pacote ("Virotes de besta (20)", quantidade 1): usar gasta o pacote inteiro; o mestre ajusta pelo painel.
- `Item.itemDescription` e `Item.effect` passaram para `varchar(4000)` (`@Column(length = 4000)`). O `ddl-auto=update` **não aumenta** coluna que já existe: no PostgreSQL local rode uma vez `ALTER TABLE item ALTER COLUMN item_description TYPE varchar(4000); ALTER TABLE item ALTER COLUMN effect TYPE varchar(4000);` (a coluna nova `catalog_id` é criada sozinha). Sem isso, criar personagem com equipamento dá erro de valor longo.
- Ataques: estilos de luta (Duelismo, Arquearia...), "Imprópria -N", dano extra de Heranças e a munição gasta não entram na conta; o texto das propriedades fica na dica.
- O jogador altera os próprios PV e só **gasta** consumíveis, ouro e inspiração (decisão da mesa); não há rota para apagar a ficha.
