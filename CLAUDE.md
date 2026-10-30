# CLAUDE.md — Runarcana Nexus

Responda sempre em **português-BR**.

## Antes de qualquer alteração: consulte a documentação

A pasta [`docs/`](docs/README.md) é a fonte de verdade do projeto. No início de toda tarefa, leia **só o que a tarefa toca** (não leia docs inteiros "por garantia"):

1. Escolha o documento da área (o mapa completo está em [`docs/README.md`](docs/README.md); não precisa abri-lo se a área já está clara aqui):
   - back-end: [`docs/backend.md`](docs/backend.md) (arquitetura, convenções, auth, pendências gerais) + **um** subdoc:
     - endpoints → [`backend-api.md`](docs/backend-api.md)
     - criação, assistente, subida de nível, catálogos JSON → [`backend-criacao.md`](docs/backend-criacao.md) (formato dos JSON: [`regras-criacao.md`](docs/regras-criacao.md), só se for mexer neles)
     - ficha, CA, inventário, habilidades, documentos, anotações, entidades → [`backend-ficha.md`](docs/backend-ficha.md)
   - front-end: [`docs/frontend.md`](docs/frontend.md) (estrutura, API, pendências gerais) + **um** subdoc:
     - telas (login, mestre, criação, ficha) → [`frontend-telas.md`](docs/frontend-telas.md)
     - animações, efeitos, artes → [`frontend-visual.md`](docs/frontend-visual.md)
   - stack, branches, como rodar → [`docs/visao-geral.md`](docs/visao-geral.md)
   - o que desenvolver em seguida → [`docs/plano-jogo.md`](docs/plano-jogo.md) (siga as etapas na ordem; ao concluir uma, marque-a como feita)
2. Em tarefa pequena e localizada (um bug, um ajuste visual), vá direto ao código; prefira `grep` pela seção relevante a ler o doc inteiro.
3. Use o que está lá (convenções, decisões, pendências) para planejar a mudança, sem redescobrir tudo do zero.
4. Se a documentação estiver errada ou desatualizada em relação ao código, confie no código, corrija o doc e avise o usuário.

## Depois de finalizar algo: alimente a documentação

Toda entrega concluída (feature, correção, decisão de design) **termina com a atualização dos docs**, no mesmo commit do código:

- atualize o subdoc da área (`backend-*.md` / `frontend-*.md`; o `backend.md`/`frontend.md` só se mudou algo geral) e `docs/visao-geral.md` se mudou stack, branches ou o jeito de rodar;
- adicione uma entrada **curta** (3–6 linhas) no topo de `docs/changelog.md` (data, branch, resumo); leia só o topo dele, nunca o arquivo inteiro;
- remova as pendências resolvidas e registre as novas, no subdoc da área;
- mantenha os docs enxutos: descreva o estado atual, não o histórico (histórico vai no changelog).

## Commits

Faça um commit por entrega (feature, correção ou etapa do plano), assim que ela estiver pronta e testada, com os docs junto. Não acumule várias entregas sem commit.

Não coloque senhas, tokens nem credenciais nos docs.

## Atalhos

- Front-end: `cd frontend && npm run dev | npm test | npm run build`. Para o preview no app, use `.claude/launch.json` (configuração `frontend`).
- Back-end: `./mvnw spring-boot:run` (precisa de PostgreSQL local e JDK 27) | `./mvnw test` (usa H2).
