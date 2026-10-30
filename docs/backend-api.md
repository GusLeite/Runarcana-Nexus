# Back-end — API (endpoints)

> Parte do [backend.md](backend.md). Todas as rotas começam com `/runarcana`.

| Método | Rota | Corpo | Descrição |
|---|---|---|---|
| POST | `/background` | `Background` (entidade) | Cria um antecedente |
| GET | `/background` | – | Lista os antecedentes |
| PATCH | `/background/{name}` | `BackGroundSkillsRequest { skills: SkillType[] }` | Substitui as perícias do antecedente com aquele nome |
| POST | `/character-classes` | `CharacterClassRequest { hitHpDice, className }` | Cria uma classe |
| GET | `/character-classes` | – | Lista as classes |
| POST | `/character` | `CreateCharacterRequest` (ver abaixo) | Cria um personagem; devolve `CharacterResponse` (201). 400 com `message` se faltar campo, a classe/antecedente não existir ou o JSON tiver valor fora do enum |
| GET | `/character` | – (mestre) | Lista os personagens (`CharacterResponse[]`). 401 sem sessão; 403 para jogador |
| GET | `/character/table` | – (mestre) | Visão da mesa: `[{ character: CharacterResponse, armorClass, manaLeft, manaMax }]` (Mana nula se a ficha não tem Pontos de Mana). 403 para jogador |
| GET | `/character/me` | – (Bearer) | Ficha do personagem da conta logada: `{ character: CharacterResponse, armorClass, attacks: AttackResponse[], spellcasting: SpellcastingResponse, inventory: InventoryItemResponse[], abilities: AbilityResponse[] }`. 401 sem sessão; 404 com `message` se a ficha não existir |
| POST | `/character/{id}/abilities` | `AbilityRequest` (Bearer **mestre**) | Cadastra magia/habilidade no personagem. 201; 403 para jogador |
| GET | `/character/{id}/abilities` | – (Bearer **mestre**) | Habilidades do personagem (painel do mestre) |
| PATCH | `/character/{id}/abilities/{abilityId}/icon` | `{ icon }` (Bearer **mestre**) | Troca o ícone (data URL ou link); `icon: null` remove. 400 se não for imagem PNG/JPEG/WebP/GIF ou link http(s) |
| DELETE | `/character/{id}/abilities/{abilityId}` | – (Bearer **mestre**) | Remove. 204 |
| PATCH | `/character/me/abilities/{abilityId}` | `{ usesLeft }` (Bearer) | Jogador gasta/recupera usos. 400 se passar do máximo ou a habilidade não tiver usos |
| PATCH | `/character/me/shield` | `{ key }` (Bearer) | Escudo em uso: `NONE` (sem escudo) ou `ITEM:<id>` de um escudo do inventário. Devolve a CA recalculada. 400 se o escudo não está no inventário |
| PATCH | `/character/me/hp` | `{ currentHp, tempHp? }` (Bearer) | Jogador marca os próprios PV: atual de 0 ao máximo e temporários (0 ou mais; sem `tempHp` = mantém). Devolve `CharacterResponse`. 400 fora dos limites; 404 sem ficha |
| GET | `/character/{id}/items` | – (Bearer **mestre**) | `MasterInventory { characterId, characterName, gold, inspiration, items }`. As rotas do mestre abaixo devolvem o mesmo |
| POST | `/character/{id}/items` | `{ catalogId, quantity? }` (Bearer **mestre**) | Dá um item do `itens.json` (conjunto entra aberto; item que a ficha já tem soma na mesma linha). 400 se o item não existe ou a quantidade sai de 1–9999 |
| POST | `/character/{id}/items/custom` | `{ name, description?, effect?, weight?, price?, rarity?, quantity?, consumable? }` (Bearer **mestre**) | Loot fora do catálogo (`Consumable` se `consumable`, senão objeto comum; sem `catalogId`) |
| PATCH | `/character/{id}/items/{entryId}` | `{ quantity }` (Bearer **mestre**) | Nova quantidade (0 tira o item). 404 se o item não é dessa ficha |
| DELETE | `/character/{id}/items/{entryId}` | – (Bearer **mestre**) | Tira o item. Se era a armadura ou o escudo em uso, a defesa volta ao padrão |
| PATCH | `/character/{id}/gold` | `{ gold }` (Bearer **mestre**) | Ouro (0 ou mais) |
| PATCH | `/character/{id}/inspiration` | `{ inspiration: boolean }` (Bearer **mestre**) | Dá ou tira a inspiração (sim/não) |
| POST | `/character/me/items/{entryId}/use` | – (Bearer) | Jogador gasta 1 de um consumível (a última unidade tira a linha). 400 se não for consumível. Devolve a ficha (`CharacterSheetResponse`) |
| POST | `/character/me/gold/spend` | `{ amount }` (Bearer) | Jogador gasta ouro (de 1 até o que tem). Devolve a ficha |
| POST | `/character/me/inspiration/use` | – (Bearer) | Jogador gasta a inspiração acesa. 400 sem inspiração. Devolve a ficha |
| POST | `/character/me/abilities/{abilityId}/cast` | `{ level? }` (Bearer) | Jogador conjura a magia no nível (sem `level` = o da magia): truque não gasta; com usos próprios, no nível dela, gasta 1 uso; senão desconta a Mana do nível de "Pontos de Mana". Devolve `{ level, manaCost, usedUse, abilities }`. 400 se não for magia, não estiver preparada, abaixo do nível da magia, acima do nível máximo da ficha ou faltar Mana |
| PATCH | `/character/me/death-saves` | `{ successes, failures }` (Bearer) | Jogador marca os próprios testes contra a morte (0–3 cada). Devolve `CharacterResponse`. 400 fora dos limites |
| PATCH | `/character/{id}/hp` | `{ currentHp?, tempHp?, maxHpBonus? }` (mestre) | Mestre ajusta os PV de qualquer ficha e o bônus nos PV máximos (`maxHpBonus`, pode ser negativo) (mesmos limites do jogador; PV > 0 zera os testes contra a morte). 403 para jogador |
| PUT | `/character/{id}/abilities/{abilityId}` | `AbilityRequest` (mestre) | Edita a habilidade: mantém o ícone (se não vier outro) e os usos gastos (usos restantes = novo máximo − gastos, mínimo 0). 403 para jogador; 404 se não for da ficha |
| PUT | `/documents/{id}` | `DocumentRequest` (mestre) | Edita título, tipo, texto, imagem e destinatários; as leituras ficam. Devolve com `readBy` |
| PATCH | `/character/{id}/death-saves` | `{ successes, failures }` (mestre) | Mestre ajusta os testes contra a morte de qualquer ficha. 403 para jogador |
| PATCH | `/character/{id}/conditions` | `{ conditions?, exhaustion? }` (mestre) | Condições (ids do `condicoes.json`; a lista substitui a atual) e Exaustão (0–10); nulo = mantém. Devolve `CharacterResponse`. 400 com id desconhecido ou Exaustão fora dos limites; 403 para jogador |
| GET | `/crafts/formulas` | – (Bearer) | Fórmulas de Ofício: `{ rule, general: Formula[], crafts: { <id do ofício>: Formula[] } }` (`id, name, level, discipline, prerequisite, craft/crafts, part, dc, component, value, time, detail, description, natural20`) |
| PUT | `/character/{id}/formulas` | `{ formulas: ["cuteleiro:criar-arma-1"] }` (mestre) | Fórmulas conhecidas da ficha (substitui a lista). 400 com fórmula desconhecida ou de ofício que a ficha não tem; 403 para jogador |
| GET | `/conditions` | – (Bearer) | Catálogo das condições: `{ exhaustionMax, exhaustion, conditions: [{ id, name, text }] }` |
| POST | `/character/me/rest` | `{ type: SHORT \| LONG, prepared? }` (Bearer) | Descanso: curto recupera o que é `SHORT_REST`; longo recupera tudo que recarrega. No longo, `prepared` (`{ "ACOLYTE": ["spell:<id>"], "SHAMAN": ["ability:<id>"] }`) troca as magias preparadas antes (400 acima do limite ou fora das opções, e aí não descansa). Devolve as habilidades |
| GET | `/character/me/preparation` | – (Bearer) | `PreparationResponse`: por classe que prepara (Acólito, Xamã), `limit`, `maxSpellLevel` (nulo = entre os conhecidos), `options` (`key`, `name`, `level`) e `prepared`. `classes` vazio se a ficha não prepara |
| GET | `/notes` | – (Bearer) | Anotações do jogador (fixadas primeiro, depois as mais recentes) |
| POST | `/notes` | `NoteRequest { title, body, pinned }` (Bearer) | Cria. Título vazio vira "Sem título". 201 |
| PUT | `/notes/{id}` | `NoteRequest` (Bearer) | Atualiza. 404 se a nota não for da conta |
| DELETE | `/notes/{id}` | – (Bearer) | Apaga. 204 |
| GET | `/documents/me` | – (Bearer) | Documentos para o jogador (para todos ou só para ele), com `read` |
| POST | `/documents/{id}/read` | – (Bearer) | Marca como lido. 204; 404 se o documento não for para ele |
| GET | `/documents` | – (Bearer **mestre**) | Todos os documentos, com `recipients` |
| GET | `/documents/recipients` | – (Bearer **mestre**) | Usernames que podem receber documentos (todas as contas de jogador, em ordem) |
| POST | `/documents` | `DocumentRequest` (Bearer **mestre**) | Envia um documento. 201 |
| GET | `/creation/catalog` | – (Bearer) | Catálogo de regras de criação (origens, classes, passados, regiões, ofícios, Heranças, recursos e Runas, Natureza Rúnica, magia sem a lista de magias, métodos de atributos) |
| GET | `/creation/spells` | – (Bearer) | Lista de magias do Capítulo 10 (`RuleMagic.Spell[]`, 558), fora do catálogo por ser grande |
| GET | `/compendium` | – (Bearer) | Páginas de consulta do livro (`RuleCompendium`: Familiares, Tecmaturgia e os 5 Aparatos), com seções e tabelas |
| GET | `/compendium/rituals` | – (Bearer) | `{ rituals, tables }`: a Lista de Rituais e as tabelas do Capítulo 10 (Conjuração Ritual, Trespassando, Rituais, Magia Púrpura, Magia Descontrolada Yordle, Essência, Golem) |
| POST | `/creation/preview` | `CreationRequest` (Bearer) | Ficha em construção calculada (não salva). `errors` vazio = pode criar |
| POST | `/creation` | `CreationRequest` (Bearer) | Cria a ficha da conta logada. 201; 400 com o 1º erro da prévia; 409 se a conta já tem ficha; 403 para o mestre |
| PATCH | `/character/{id}/pending-levels` | `{ pendingLevels }` (Bearer **mestre**) | Libera a subida de nível: quantos níveis a ficha pode subir (0 cancela). Devolve `CharacterResponse`. 404 sem ficha; 400 sem `build` ou se passar do 20º nível |
| POST | `/character/me/level-up/preview` | `LevelUpRequest { levels: LevelPick[] }` (Bearer) | Jogador: prévia dos níveis liberados (não salva): `LevelUpPreview` com a prévia completa, nível e PV antes/depois, `attributeChanges` e `newFeatures`. 403 se o mestre não liberou ou se pedir mais níveis que os liberados |
| POST | `/character/me/level-up` | `LevelUpRequest` (Bearer) | Jogador: aplica e desconta de `pendingLevels`; devolve `CharacterResponse`. 400 com o 1º erro da prévia (nada muda); 403 como na prévia |
| DELETE | `/documents/{id}` | – (Bearer **mestre**) | Apaga (e as marcas de lido). 204 |
| POST | `/auth/login` | `LoginRequest { username, password }` | Entra; devolve `{ token, expiresAt, account: { username, mustChangePassword, master } }`. 401 se errar |
| GET | `/auth/me` | – (Bearer) | Conta do token. 401 se o token for inválido ou expirado |
| POST | `/auth/logout` | – (Bearer) | Apaga o token. 204 |
| PUT | `/auth/password` | `ChangePasswordRequest { currentPassword, newPassword }` (Bearer) | Troca a senha; devolve a conta. 400 com `message` se a regra falhar |

Não há endpoints de itens; o catálogo de itens vem no `GET /creation/catalog` (`equipment`).
