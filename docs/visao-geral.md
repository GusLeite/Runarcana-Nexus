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

Os branches ainda **não foram unificados**. Hoje cada parte vive em um branch diferente:

| Branch | Conteúdo |
|---|---|
| `main` | Só `README.md` e `.gitignore` (commit inicial) |
| `feature/inventory` | **Back-end** Spring completo (entidades, controllers, seed do banco) |
| `copilot/frontend-inicial-login` | Primeiro login em JS puro, feito pelo Copilot (substituído) |
| `copilot/update-login-screen-implementation` (remoto) | Restyle do login feito pelo Copilot. **Descartado** pelo dono do projeto |
| `feature/frontend-react-login` | **Front-end React** atual: tela de seleção de personagem + login |

Próximo passo natural: fazer o merge de `feature/inventory` e `feature/frontend-react-login` em `main`.

## Como rodar

**Back-end** (no branch `feature/inventory`; precisa de um PostgreSQL local com o banco `runarcana`):

```bash
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080/runarcana` (context-path `/runarcana`). O Swagger fica em `/runarcana/swagger-ui.html`.

**Front-end:**

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm test         # testes (Vitest)
npm run build    # gera frontend/dist
```
