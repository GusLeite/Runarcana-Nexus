# Documentação do Runarcana Nexus

Esta pasta é a **fonte de verdade** do projeto. Ela serve para quem chega ao código e também como contexto para o Claude: antes de qualquer alteração, leia o documento da área que vai ser mexida.

| Documento | Conteúdo |
|---|---|
| [visao-geral.md](visao-geral.md) | O que é o projeto, stack, organização dos branches e como rodar tudo |
| [backend.md](backend.md) | API Spring Boot: pacotes, entidades, endpoints, enums, regras de negócio e pendências |
| [frontend.md](frontend.md) | App React/Vite: estrutura, componentes, animações, assets e como adicionar personagens |
| [regras-criacao.md](regras-criacao.md) | Formato do catálogo de regras de criação (origens, regiões, classes, passados, ofícios, Heranças) e o que falta preencher |
| [plano-jogo.md](plano-jogo.md) | **Roteiro atual**: as etapas do que falta para jogar (inventário, ataques, Mana, morte e condições, edição pelo mestre, visão da mesa), na ordem de desenvolvimento |
| [changelog.md](changelog.md) | Registro do que foi entregue, em ordem cronológica (mais recente no topo) |

## Como manter esta documentação

Sempre que uma entrega for concluída:

1. Atualize o documento da área afetada (`backend.md` ou `frontend.md`). Se mudou algo que vale para o projeto todo, como a stack, os branches ou o jeito de rodar, atualize também o `visao-geral.md`.
2. Adicione uma entrada no topo do [changelog.md](changelog.md) com a data, o branch e o resumo do que mudou.
3. Se uma pendência listada foi resolvida, remova-a. Se surgiu uma nova, registre-a na seção **Pendências / problemas conhecidos** do documento.
4. Faça o commit da documentação junto com o código da entrega.

Regras de escrita: português-BR, objetivo, e sem copiar código longo; aponte para o arquivo (`caminho/arquivo.ext`). **Nunca** coloque senhas, tokens ou credenciais aqui.
