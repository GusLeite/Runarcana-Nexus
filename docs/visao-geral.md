# Visão geral

Plataforma de apoio a mestres e jogadores de RPG, feita inicialmente para o sistema **Runarcana** (RPG de mesa ambientado em Runeterra, baseado em D&D 5e). O objetivo é centralizar inventários, fichas de personagem, consulta à lore e ferramentas de organização de campanhas.

## Stack

| Camada | Tecnologia |
|---|---|
| Back-end | Java 27, Spring Boot 4.1.1 (Web MVC, Data JPA, Validation), Lombok, springdoc-openapi 3.1.1 |
| Banco | PostgreSQL (`localhost:5432/runarcana`), schema gerado pelo Hibernate (`ddl-auto=update`) |
| Front-end | React 18.3, Vite 8, Vitest 3; CSS puro (sem framework de UI) |
| Build | Maven Wrapper (`mvnw`) no back-end, npm no front-end |

## Organização do repositório

```
Runarcana-Nexus/
├── CLAUDE.md          instruções para o Claude (lê e atualiza estes docs)
├── docs/              esta documentação
├── frontend/          app React (ver frontend.md)
├── src/, pom.xml, mvnw   back-end Spring (ver backend.md)
└── .claude/launch.json  configuração do servidor de dev para o preview do Claude
```

## Branches

Back-end e front-end já estão juntos em `main` (PRs #4 e #5). Os branches de feature antigos ficam só como histórico:

| Branch | Conteúdo |
|---|---|
| `main` | **Tudo**: back-end Spring na raiz e front-end React em `frontend/` |
| `feature/inventory` | Back-end antes do merge (histórico) |
| `feature/frontend-react-login` | Front-end antes do merge (histórico) |
| `copilot/frontend-inicial-login`, `copilot/update-login-screen-implementation` | Tentativas do Copilot. **Descartadas** pelo dono do projeto; não usar como base |

Trabalho novo: crie um branch a partir de `main`.

## Como rodar

**Back-end** (precisa de um PostgreSQL local com o banco `runarcana` e do JDK 27; se o `java` não estiver no PATH, defina `JAVA_HOME`):

```bash
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080/runarcana` (context-path `/runarcana`). O Swagger fica em `/runarcana/swagger-ui.html`. Na primeira subida são criadas as contas dos 5 personagens (ver `backend.md`, seção Autenticação). Testes: `./mvnw test` (usa H2, não precisa do PostgreSQL).

Para o login funcionar no front, suba o back-end antes: o Vite repassa `/runarcana` para `localhost:8080` (ou para `VITE_PROXY_TARGET`, se definido).

**Sandbox (testar sem tocar no PostgreSQL):** a classe de teste `SandboxApplication` sobe o back na porta 8090 com H2 em memória e as regras reais (perfil `sandbox`, `src/test/resources/application-sandbox.properties`); tudo some ao desligar. Ela força o H2 por argumento, então nunca conecta no PostgreSQL. No preview do Claude, use as configurações `backend-sandbox` e `frontend-sandbox` do `.claude/launch.json`. Para subir um segundo sandbox ao mesmo tempo, a variável `SANDBOX_PORT` troca a porta do back (e `VITE_PROXY_TARGET` aponta o front para ela). Na mão: `mvnw test-compile spring-boot:test-run -Dspring-boot.test-run.main-class=gusleite.runarcana_nexus.SandboxApplication`; o front: `VITE_PROXY_TARGET=http://localhost:8090 npm run dev`. Atenção: no Spring Boot 4 o `spring-boot:run -Dspring-boot.run.useTestClasspath=true` **não** usa mais o classpath de testes (cai na configuração principal, a do PostgreSQL).

**Front-end:**

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm test         # testes (Vitest)
npm run build    # gera frontend/dist
```
