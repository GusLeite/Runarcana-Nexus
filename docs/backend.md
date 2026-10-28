# Back-end

> Código na raiz do repositório (`src/`, `pom.xml`), já em `main`. Pacote raiz: `gusleite.runarcana_nexus`.

## Onde está cada assunto

Leia este arquivo e **só** o subdocumento da área da tarefa:

| Documento | Conteúdo |
|---|---|
| [backend-api.md](backend-api.md) | Tabela de todos os endpoints (rota, corpo, resposta, erros) |
| [backend-criacao.md](backend-criacao.md) | Criação de personagem, assistente `/creation`, catálogos JSON, subida de nível, magias preparadas, regras da mesa |
| [backend-ficha.md](backend-ficha.md) | CA e escudos, `GET /character/me`, inventário, habilidades, documentos, anotações, modelo de dados e enums |

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

`./mvnw test` usa H2 em memória (`src/test/resources/application.properties`), então não precisa do PostgreSQL. `controller/AuthControllerTests` cobre seed, login, senha errada, token inválido, troca de senha, sessões derrubadas e logout. `controller/CharacterControllerTests` cria o Rudo com o payload real (números como string) e cobre classe/antecedente inexistente, campo obrigatório vazio e enum inválido, além de `/character/me` (ficha com inventário, 401 sem login e 404 sem ficha). `controller/PlayerFeaturesTests` cobre habilidades (cadastro, listagem e exclusão pelo mestre, 403 para jogador, usos e descanso, ícone: guardar, trocar por link, remover e recusar tipo inválido), a lista de destinatários, anotações (CRUD e isolamento entre contas) e documentos (destinatários, lido, exclusão, 403 e destinatário inexistente). `CharacterControllerTests` também cobre os PV do jogador (atual, temporários, limites, 401 e 404). `controller/LevelUpControllerTests` cobre a subida de nível (403 para jogador, 404, PV e dado de vida, usos gastos e habilidade do mestre mantidos, usos pelo nível da classe, Aprimoramento com aumento de atributo e pré-requisito de nível de classe, multiclasse com proficiências reduzidas, subclasse obrigatória e pré-requisito). `controller/CreationControllerTests` cobre o assistente (catálogo exige login, prévia aplicando cada tipo de concessão, o que falta, compra de pontos estourada, criação ligada à conta, 409 na segunda, 403 para o mestre e as Heranças: tipo de ponto, pré-requisitos, exclusão, opção, repetição e pontos sobrando) e `services/RuleCatalogValidationTests` cobre a conferência do catálogo (inclusive Heranças e ofícios) e garante que o `rules/criacao.json` e o `rules/herancas.json` reais continuam válidos. As tabelas antigas `character`/`character_skill` geram avisos de DDL no H2 (usam `tinyint`), sem afetar os testes.

## Convenções

- Injeção: novos services usam **injeção por construtor** (como `BackgroundService`); evite `@Autowired` em campo.
- DTOs de entrada em `record/` como Java `record`.
- Lombok `@Data` nas entidades que precisam de getters e setters; em entidades com relação bidirecional (`Character` ↔ `CharacterSkill`) e na hierarquia de `Item`, use `@Getter @Setter`.

## Pendências / problemas conhecidos

- **Credencial no Git**: a senha do banco está versionada em `application.properties`. Mover para variável de ambiente (`${DB_PASSWORD}`) e trocar a senha.
- `Origin` não tem getters (nem `@Data`).
- `POST /character` e `GET /character` não exigem login; só `/character/me` exige. A ligação conta ↔ personagem é pelo nome (ver acima), não por chave estrangeira.
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
- `POST /character` (antigo, sem assistente) continua aberto e não liga a ficha a uma conta.
