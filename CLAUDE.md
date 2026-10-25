# CLAUDE.md — Runarcana Nexus

Responda sempre em **português-BR**.

## Antes de qualquer alteração: consulte a documentação

A pasta [`docs/`](docs/README.md) é a fonte de verdade do projeto. No início de toda tarefa:

1. Leia [`docs/README.md`](docs/README.md) e o documento da área envolvida:
   - back-end (Spring, entidades, endpoints, regras do RPG) → [`docs/backend.md`](docs/backend.md)
   - front-end (React, telas, animações, assets) → [`docs/frontend.md`](docs/frontend.md)
   - stack, branches, como rodar → [`docs/visao-geral.md`](docs/visao-geral.md)
2. Use o que está lá (convenções, decisões, pendências) para planejar a mudança, sem redescobrir tudo do zero.
3. Se a documentação estiver errada ou desatualizada em relação ao código, confie no código, corrija o doc e avise o usuário.

## Depois de finalizar algo: alimente a documentação

Toda entrega concluída (feature, correção, decisão de design) **termina com a atualização dos docs**, no mesmo commit do código:

- atualize `docs/backend.md` e/ou `docs/frontend.md` (e `docs/visao-geral.md` se mudou stack, branches ou o jeito de rodar);
- adicione uma entrada no topo de `docs/changelog.md` (data, branch, resumo);
- remova as pendências resolvidas e registre as novas.

Não coloque senhas, tokens nem credenciais nos docs.

## Atalhos

- Front-end: `cd frontend && npm run dev | npm test | npm run build`. Para o preview no app, use `.claude/launch.json` (configuração `frontend`).
- Back-end: `./mvnw spring-boot:run` (precisa de PostgreSQL local e JDK 27) | `./mvnw test` (usa H2).
