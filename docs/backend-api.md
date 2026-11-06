# Back-end — API (endpoints)

> Parte do [backend.md](backend.md). Todas as rotas começam com `/runarcana`.

| Método | Rota | Corpo | Descrição |
|---|---|---|---|
| POST | `/background` | `Background` (entidade) (Bearer **mestre**) | Cria um antecedente |
| GET | `/background` | – (Bearer **mestre**) | Lista os antecedentes |
| PATCH | `/background/{name}` | `BackGroundSkillsRequest { skills: SkillType[] }` (Bearer **mestre**) | Substitui as perícias do antecedente com aquele nome |
| POST | `/character-classes` | `CharacterClassRequest { hitHpDice, className }` (Bearer **mestre**) | Cria uma classe |
| GET | `/character-classes` | – (Bearer **mestre**) | Lista as classes |
| POST | `/character` | `CreateCharacterRequest` (ver abaixo) (Bearer **mestre**) | Cria um personagem; devolve `CharacterResponse` (201). 400 com `message` se faltar campo, a classe/antecedente não existir ou o JSON tiver valor fora do enum |
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
| POST | `/character/{id}/items/custom` | `{ name, description?, effect?, weight?, price?, rarity?, quantity?, consumable?, image? }` (Bearer **mestre**) | Loot fora do catálogo (`Consumable` se `consumable`, senão objeto comum; sem `catalogId`) |
| PUT | `/character/{id}/items/{entryId}` | `{ name, description?, effect?, weight?, price?, rarity?, image? }` (Bearer **mestre**) | Edita o item da linha. `image`: link http(s) ou imagem enviada (data URL PNG/JPEG/WebP/GIF até 2 MB); vazio tira. Se o texto muda e outras fichas ou lojas usam o mesmo item (catálogo), a linha ganha uma **cópia** só dela; mudar só a imagem vale para o item inteiro. 400 em nome vazio, número negativo ou imagem inválida |
| PATCH | `/character/{id}/items/{entryId}` | `{ quantity }` (Bearer **mestre**) | Nova quantidade (0 tira o item). 404 se o item não é dessa ficha |
| DELETE | `/character/{id}/items/{entryId}` | – (Bearer **mestre**) | Tira o item. Se era a armadura ou o escudo em uso, a defesa volta ao padrão |
| PATCH | `/character/{id}/gold` | `{ gold }` (Bearer **mestre**) | Ouro (0 ou mais) |
| PATCH | `/character/{id}/inspiration` | `{ inspiration: boolean }` (Bearer **mestre**) | Dá ou tira a inspiração (sim/não) |
| POST | `/character/me/items/{entryId}/use` | – (Bearer) | Jogador gasta 1 de um consumível (a última unidade tira a linha). 400 se não for consumível. Devolve a ficha (`CharacterSheetResponse`) |
| POST | `/character/me/gold/spend` | `{ amount }` (Bearer) | Jogador gasta ouro (de 1 até o que tem). Devolve a ficha |
| POST | `/character/me/inspiration/use` | – (Bearer) | Jogador gasta a inspiração acesa. 400 sem inspiração. Devolve a ficha |
| GET · POST | `/merchants` | `{ name, greeting, image, buyRate, haggleDc }` (Bearer **mestre**) | Lista os mercadores / cria (201). `image`: data URL (PNG, JPEG, WebP, GIF) ou link http(s); `buyRate` 0–100 (padrão 50); `haggleDc` 0–40 (padrão 15, 0 = não pechincha) |
| PUT · DELETE | `/merchants/{id}` | igual ao POST / – (Bearer **mestre**) | Edita / apaga com o movimento (204) |
| POST | `/merchants/{id}/open` · `/close` | – (Bearer **mestre**) | Abre (fecha qualquer outro) ou fecha a loja |
| POST | `/merchants/{id}/items` | `{ catalogId \| custom: CustomItem, price?, stock? }` (Bearer **mestre**) | Põe na prateleira. Preço nulo = do catálogo; estoque nulo = sem limite. 400 se o item do catálogo já está lá |
| PATCH · DELETE | `/merchants/{id}/items/{lineId}` | `{ price, stock }` / – (Bearer **mestre**) | Muda preço e estoque / tira da prateleira |
| GET | `/merchants/{id}/trades` | – (Bearer **mestre**) | Últimas 50 negociações, mais novas primeiro |
| GET | `/merchants/{id}/haggles` | – (Bearer **mestre**) | Pechinchas desta abertura `[{ characterName, skill, d20, modifier, total, dc, percent }]` |
| GET | `/merchants/active/ping` | – (Bearer) | `{ id, name, revision }` sem imagem (`id` nulo = nada aberto) |
| GET | `/merchants/active` | – (Bearer) | A loja aberta, com `offers: [{ entryId, unitValue }]` para o inventário de quem pede. 404 se nada aberto |
| POST | `/merchants/active/buy` | `{ lineId, quantity, price? }` (Bearer) | Compra: tira ouro e estoque, dá o item. 400 se faltar ouro/estoque ou `price` for diferente do atual. Devolve `{ merchant, sheet }` |
| POST | `/merchants/active/sell` | `{ entryId, quantity, unitValue? }` (Bearer) | Vende: dá ouro, tira o item e põe na prateleira. 400 sem oferta, quantidade a mais ou `unitValue` diferente; 404 se não é dele. Devolve `{ merchant, sheet }` |
| POST | `/merchants/active/haggle` | `{ skill: PERSUASION | DECEPTION }` (Bearer) | Pechincha (o back rola), uma vez por abertura: devolve a loja com `haggle` e os preços dele. 400 se já tentou, perícia errada ou o mercador não pechincha (CD 0); 404 sem loja aberta |
| GET · POST | `/journal` | `{ title, body, poiId }` (Bearer) | Diário do grupo: lista `[{ id, kind, who, title, body, createdAt, updatedAt, mine, poiId, poiName }]`; `poiId` liga a entrada a um ponto do mapa e só volta (com `poiName`) para quem vê o ponto; citar um ponto que a conta não vê dá 400 / escreve (201). `kind`: `NOTE`, `LOOT`, `GOLD`, `DOWNED`, `DOCUMENT`, `LEVEL_UP`. 400 sem título nem texto |
| PUT · DELETE | `/journal/{id}` | igual ao POST / – (Bearer) | Edita / apaga (204). 403 se não é de quem pede (o mestre pode tudo; evento automático, só o mestre) |
| POST | `/character/me/abilities/{abilityId}/cast` | `{ level? }` (Bearer) | Jogador conjura a magia no nível (sem `level` = o da magia): truque não gasta; com usos próprios, no nível dela, gasta 1 uso; senão desconta a Mana do nível de "Pontos de Mana". Devolve `{ level, manaCost, usedUse, abilities }`. 400 se não for magia, não estiver preparada, abaixo do nível da magia, acima do nível máximo da ficha ou faltar Mana |
| PATCH | `/character/me/death-saves` | `{ successes, failures }` (Bearer) | Jogador marca os próprios testes contra a morte (0–3 cada). Devolve `CharacterResponse`. 400 fora dos limites |
| PATCH | `/character/{id}/hp` | `{ currentHp?, tempHp?, maxHpBonus? }` (mestre) | Mestre ajusta os PV de qualquer ficha e o bônus nos PV máximos (`maxHpBonus`, pode ser negativo) (mesmos limites do jogador; PV > 0 zera os testes contra a morte). 403 para jogador |
| PUT | `/character/{id}/abilities/{abilityId}` | `AbilityRequest` (mestre) | Edita a habilidade: mantém o ícone (se não vier outro) e os usos gastos (usos restantes = novo máximo − gastos, mínimo 0). 403 para jogador; 404 se não for da ficha |
| PUT | `/documents/{id}` | `DocumentRequest` (mestre) | Edita título, tipo, texto, imagem e destinatários; as leituras ficam. Devolve com `readBy` |
| PATCH | `/character/{id}/death-saves` | `{ successes, failures }` (mestre) | Mestre ajusta os testes contra a morte de qualquer ficha. 403 para jogador |
| DELETE | `/character/{id}` | (mestre) | Apaga a ficha com inventário, habilidades, perícias e regateios (a conta, o diário e as notas ficam), para o jogador recriar o personagem pelo assistente. 204; 404 se não existe; 403 para jogador |
| PATCH | `/character/{id}/conditions` | `{ conditions?, exhaustion? }` (mestre) | Condições (ids do `condicoes.json`; a lista substitui a atual) e Exaustão (0–10); nulo = mantém. Devolve `CharacterResponse`. 400 com id desconhecido ou Exaustão fora dos limites; 403 para jogador |
| GET | `/crafts/formulas` | – (Bearer) | Fórmulas de Ofício: `{ rule, general: Formula[], crafts: { <id do ofício>: Formula[] } }` (`id, name, level, discipline, prerequisite, craft/crafts, part, dc, component, value, time, detail, description, natural20`) |
| PUT | `/character/{id}/formulas` | `{ formulas: ["cuteleiro:criar-arma-1"] }` (mestre) | Fórmulas conhecidas da ficha (substitui a lista). 400 com fórmula desconhecida ou de ofício que a ficha não tem; 403 para jogador |
| GET | `/lore` | – (Bearer) | Verbetes que a conta conhece, com só os conhecimentos dela: `{ id, kind, name, subtitle, quote, quoteAuthor, summary, imageUrl, mapSlug, region, linked[], related[], pois[], facts[], sections[], toAll, recipients }`. `pois`: pontos do mapa ligados ao verbete (o do próprio lugar e os relacionados) que a conta vê. `recipients` só para o mestre. O jogador vê o verbete se recebeu ele ou um conhecimento dele; vínculos com o que não conhece não vêm |
| POST | `/lore` | `LoreEntryRequest` (Bearer **mestre**) | Cria o verbete inteiro (201). `facts` e `sections` substituem os atuais; em região, `linkedIds` são personagens e lugares dela; nos outros, `regionId`. `relatedIds` (até 40, qualquer tipo): verbetes relacionados, **nos dois sentidos** (marcar B em A também põe A em B; tabela `lore_entry_relations`, o `ddl-auto` cria); nulo mantém os atuais; 400 para o próprio verbete ou id inexistente. `relatedPoiIds` (até 40): pontos do mapa relacionados (o mesmo vínculo do `relatedLoreIds` do ponto; nulo mantém). `toAll` falso sem `recipients` = só o mestre. `imageUrl` é um link http(s) **ou uma imagem enviada** (data URL PNG/JPEG/WebP/GIF até 2 MB, reduzida no navegador; coluna `image_data`, nova e nula, o `ddl-auto` cria): o back valida com `ImageRules` e as respostas trazem uma só em `imageUrl` |
| PUT | `/lore/{id}` | `LoreEntryRequest` (Bearer **mestre**) | Edita. 404 se não existir |
| DELETE | `/lore/{id}` | – (Bearer **mestre**) | Apaga; quem apontava para o verbete (ou era relacionado a ele) só perde o vínculo |
| GET | `/map/pois` | – (Bearer; `?as=usuário` só o **mestre**) | Pontos que a conta vê, com os comentários da mesa e as anotações dela. Com `as`, a prévia "Ver como": o que aquele jogador vê, sem `secretNotes` e sem as anotações privadas dele (403 para jogador; 400 se o usuário não é jogador) |
| POST / PUT | `/map/pois`, `/map/pois/{id}` | `PoiRequest { name, kind, description, x, y, loreEntryId, relatedLoreIds, secretNotes, toAll, recipients }` (Bearer **mestre**) | Cria ou edita. `relatedLoreIds` (até 40, nulo mantém): verbetes relacionados ao ponto (tabela `map_poi_lore`, o `ddl-auto` cria); a resposta traz `related` só com os que a conta conhece. `kind`: CITY, LANDMARK, QUEST, DANGER, MYSTERY, OUTPOST, HIDEOUT, RUIN, CAMP, DUNGEON, PORT. `secretNotes` só volta para o mestre. Se `map_poi` já existia no PostgreSQL, o `CHECK` do `kind` não tem os tipos novos: `ALTER TABLE map_poi DROP CONSTRAINT map_poi_kind_check;` (o `ddl-auto` não recria). `x` e `y` entre -1024 e 1024 |
| DELETE | `/map/pois/{id}` | – (Bearer **mestre**) | Apaga o ponto e os comentários. 400 num lugar do mapa oficial (esconda em vez de apagar) |
| POST | `/map/pois/{id}/comments` | `{ text, shared }` (Bearer) | Comentário (`shared`) ou anotação só do autor (201). 404 se a conta não vê o ponto |
| DELETE | `/map/pois/comments/{id}` | – (Bearer) | O autor apaga o seu; o mestre, os da mesa. 404 nos demais casos |
| PATCH | `/map/pois/{id}/audience` | `{ toAll, recipients }` (Bearer **mestre**) | Revela (a todos e/ou a jogadores) ou esconde o ponto sem mexer no resto. Revelar a mais gente gera o evento `PLACE` no diário (com o nome só se for a todos) |
| GET | `/map/pois/visible` | – (Bearer) | Lista leve `[{ id, name }]` do que a conta vê (a ficha usa para avisar de local novo) |
| PATCH | `/map/pois/official/audience` | `{ region, toAll }` (Bearer **mestre**) | Liga ou desliga para a mesa os lugares do mapa oficial de uma região (slug) ou de todos (`region` nulo). Devolve `{ changed }`. Sem aviso no diário |
| GET | `/map/routes` | – (Bearer; `?as=usuário` só o **mestre**) | Trajetórias que os jogadores desenham: `[{ id, owner, name, points: [{ x, y }] }]`. Jogador: as suas; mestre: as de todos; com `as`, as daquele jogador (prévia) |
| POST | `/map/routes` | `{ name, points }` (Bearer **jogador**) | Cria (201): nome opcional (padrão "Trajetória"), 2 a 60 pontos dentro do mapa, até 5 por jogador. 400 para o mestre |
| PUT · DELETE | `/map/routes/{id}` | igual ao POST / – (Bearer) | Só o dono (404 nos demais) |
| GET | `/map/pois/{id}/history` | – (Bearer) | "Aconteceu aqui": `{ entries: [entradas do diário ligadas ao ponto], stops: [paradas da trilha a até 60 unidades] }`. 404 se a conta não vê o ponto |
| GET | `/map/pois/{id}/images` | – (Bearer) | Imagens do ponto (data URL ou link), só para quem vê o ponto (404 se não). A lista de pontos traz só `imageCount`, `spotlight` e `spotlightRev` |
| POST | `/map/pois/{id}/images` | `{ image }` (Bearer **mestre**) | Adiciona (até 6 por ponto; mesmas regras de imagem do mercador, em `ImageRules`) e devolve o ponto |
| DELETE | `/map/pois/{id}/images/{index}` | – (Bearer **mestre**) | Apaga a imagem e limpa o destaque |
| POST | `/map/pois/{id}/spotlight` | `{ index }` (Bearer **mestre**) | MOSTRAR À MESA: sobe `spotlightRev`; quem vê o ponto abre a imagem ao notar a revisão nova |
| GET | `/map/waypoints` | – (Bearer; `?as=usuário` só o **mestre**) | Jogador: os seus. Mestre: os de todos, com `owner`; com `as`, só os daquele jogador (prévia) |
| POST / PUT | `/map/waypoints`, `/map/waypoints/{id}` | `{ name, comment, x, y }` (Bearer) | Só o dono. 400 no quarto waypoint e para o mestre; 404 no waypoint de outro |
| DELETE | `/map/waypoints/{id}` | – (Bearer) | Só o dono |
| GET | `/map/bandle` | – (Bearer) | Última rolagem de Bandópolis: `{ roll }` (1 a 10; nulo antes da primeira). Para jogador, nulo também com a névoa ligada e `bandle` não revelada (`MapPartyService.hiddenFromPlayers`). 401 sem sessão |
| POST | `/map/bandle/roll` | – (Bearer **mestre**) | Rola o d10 no servidor, guarda em `TableSetting` (`map.bandleRoll`) e devolve `{ roll }`. 401 sem sessão; 403 para jogador |
| GET | `/map/party` | – (Bearer) | O grupo no mapa (`MapPartyService`): `{ x, y, trail: [{ x, y, label, createdAt }], fog, revealed: [slug] }`. `x` nulo = fora do mapa; `fog` falso = tudo à vista |
| PUT · DELETE | `/map/party` | `{ x, y, label? }` / – (Bearer **mestre**) | Move o marcador (−1024 a 1024; parada nova na trilha se mudou de lugar, até 200) / tira do mapa (a trilha fica). Posição em `TableSetting` `map.party` |
| DELETE | `/map/party/trail` | – (Bearer **mestre**) | Apaga a trilha (`PartyTrailPoint`); com o grupo no mapa, ela recomeça dele |
| PUT | `/map/fog` · `/map/fog/{slug}` | `{ enabled }` / `{ revealed }` (Bearer **mestre**) | Liga/desliga a névoa de guerra (`map.fog`) / revela ou encobre uma região (`map.revealed`, slug de minúsculas e hífen). 400 em slug inválido |
| GET | `/conditions` | – (Bearer) | Catálogo das condições: `{ exhaustionMax, exhaustion, conditions: [{ id, name, text }] }` |
| POST | `/character/me/rest` | `{ type: SHORT \| LONG, prepared? }` (Bearer) | Descanso: curto recupera o que é `SHORT_REST`; longo recupera tudo que recarrega. No longo, `prepared` (`{ "ACOLYTE": ["spell:<id>"], "SHAMAN": ["ability:<id>"] }`) troca as magias preparadas antes (400 acima do limite ou fora das opções, e aí não descansa). Devolve as habilidades |
| GET | `/character/me/breakdown` | – (Bearer) | `StatBreakdown`: `attributes` (por atributo: `total` e `lines` `{label, amount}`: valor base + cada fonte) e `hp` (`total` e `lines`: dado de vida, Constituição por nível, bônus por fonte, ajuste do mestre). A soma das linhas é o total (uma linha "Outros ajustes"/"Forma ativa" cobre a diferença). 400 se a ficha não tem `build` |
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
| POST | `/auth/login` | `LoginRequest { username, password }` | Entra; devolve `{ token, expiresAt, account: { username, mustChangePassword, master } }`. 401 se errar; 429 depois de muitas senhas erradas do mesmo endereço |
| GET | `/auth/me` | – (Bearer) | Conta do token. 401 se o token for inválido ou expirado |
| POST | `/auth/logout` | – (Bearer) | Apaga o token. 204 |
| POST | `/live/ticket` | – (Bearer) | `{ ticket }` de uso único, válido por 30 s, para abrir o canal ao vivo. 401 sem sessão |
| GET | `/rolls?limit=` | – (Bearer) | Histórico de rolagens da mesa, mais nova primeiro (padrão 30, máx. 100). Secreta (`PRIVATE`) de outra conta vem com `hidden: true` e só `id, who, username, mine, visibility, createdAt` (o mestre vê tudo) |
| POST | `/rolls` | `{ label, kind: CHECK|DICE, mod?, mode?: normal|adv|dis, critRange?, expr?, visibility?: TABLE|PRIVATE }` (Bearer) | O servidor sorteia (`SecureRandom`), guarda (`TableRoll`) e avisa o canal (tópico `rolls`, depois do commit). Devolve `{ id, who, username, mine, hidden, visibility, kind, label, mode, mod, d20, other, critRange, expr, count, sides, bonus, rolls[], total, createdAt }` (201). 400: rótulo vazio ou > 120, tipo/modo/visibilidade inválidos, `mod` além de ±100, `critRange` fora de 2–20, expressão fora de `NdM±B` com 1–100 dados, 2–1000 faces e bônus até ±1000 |
| POST | `/map/focus` | `{ x, y }` ou `{ poiId }` (Bearer **mestre**) | "Olhem aqui!": manda `map-focus` `{ x, y, poiId?, name?, from }` pelo canal; ponto oculto só vai para quem o vê. Devolve `{ sentTo }` (conexões que receberam). 400 fora do mapa (±1024) ou sem x/y; 404 ponto inexistente; 403 jogador |
| POST | `/map/ping` | `{ x, y }` (Bearer) | Ping: manda `map-ping` `{ x, y, from, who }` para todos. Até 3 a cada 3 s por conta (429). Nada é salvo |
| GET | `/live/stream?ticket=…` | – | Canal ao vivo (Server-Sent Events): `hello` ao abrir e `change` com `{ topic }` a cada alteração (ver `backend.md`, Canal ao vivo). 401 com ticket inválido, vencido ou já usado |
| POST | `/auth/test-player` | – (Bearer **mestre**) | Sessão do personagem de teste (`teste`), com token próprio; 403 para jogador |
| GET | `/auth/players` | – (aberto) | Jogadores que o mestre adicionou: `[{ username }]` |
| POST | `/auth/players` | `CreatePlayerRequest { username }` (Bearer **mestre**) | Cria conta de jogador (2–20 de `a-z0-9_-`) e devolve `{ username, temporaryPassword }`; 400 se repetir ou for `teste`. 201 |
| GET | `/auth/accounts` | – (Bearer **mestre**) | Contas de jogador: `[{ username, mustChangePassword }]` (sem o mestre e a conta de teste) |
| POST | `/auth/accounts/{username}/reset-password` | – (Bearer **mestre**) | Gera senha provisória: `{ username, temporaryPassword }`; encerra as sessões do jogador. 404 se não for conta de jogador |
| PUT | `/auth/password` | `ChangePasswordRequest { currentPassword, newPassword }` (Bearer) | Troca a senha; devolve a conta. 400 com `message` se a regra falhar |

Não há endpoints de itens; o catálogo de itens vem no `GET /creation/catalog` (`equipment`).
