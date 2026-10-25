# Changelog

Entradas mais recentes no topo. Formato: `## AAAA-MM-DD — título (branch)`.

## 2026-10-25 — Painel do mestre (`feature/character-sheet`)
- Front-end: botão **MESTRE** na tela inicial abre um portal de login (anéis hextech); o mestre logado vê o painel com as abas **Documentos** (escrever com prévia igual à do jogador, tipo, destinatários, enviados com apagar) e **Habilidades** (escolher personagem, cadastrar com prévia ao vivo, apagar).
- Back-end: `GET /character/{id}/abilities` e `GET /documents/recipients` (só mestre), com testes.
- Diagnóstico: o 404 ao criar anotação vinha de um back-end iniciado antes das rotas novas; registrado nas pendências.

## 2026-10-25 — Magias, documentos do mestre e anotações (`feature/character-sheet`)
- Back-end: papel de **mestre** (`Account.role`, conta `mestre` no seed, `AuthService.requireMaster` → 403).
- Magias e habilidades (`CharacterAbility`): o mestre cadastra/apaga; o jogador gasta usos e descansa (curto/longo). Vêm em `/character/me`.
- Documentos do mestre (`GameDocument` + `DocumentRead`): para todos ou para jogadores escolhidos, com marca de lido.
- Anotações do jogador (`PlayerNote`): CRUD isolado por conta.
- `CharacterResponse.hitDie` (dado de vida da classe). Testes em `PlayerFeaturesTests`.
- Front-end: abas **MAGIAS** (teclas Q/W/E/R/P, usos em losangos, descanso, rolagem de dano), **DOCUMENTOS** (pergaminho com selo, NOVO, carimbo de segredo) e **ANOTAÇÕES** (salvamento automático, fixar).
- Aba Ficha mais cheia: dados de vida, vantagem/desvantagem, barra rápida de habilidades, documentos recentes e anotação fixada. Barra do topo reorganizada para 5 abas; no celular o "Rolar d20" vira botão flutuante.

## 2026-10-25 — Inventário em aba própria (`feature/character-sheet`)
- A ficha ganhou as abas **FICHA** e **INVENTÁRIO** na barra do topo (também no celular).
- A aba de inventário tem grade maior, filtro por tipo, detalhe do item ao lado e valor estimado (`totalValue` em `rules.js`, com teste).

## 2026-10-25 — Correção: siglas dos atributos cortadas (`feature/character-sheet`)
- Em larguras médias os 6 hexágonos ficavam pequenos e o `clip-path` cortava a sigla (FOR, DES...). Agora atributos e estatísticas se ajustam à largura da coluna (container queries) e o texto escala com o hexágono.

## 2026-10-25 — Ficha do personagem pós-login (`feature/character-sheet`)
- Front-end: a tela pós-login provisória (`AccountPanel`) virou a **ficha do personagem** no estilo do cliente do LoL: splash com anel de nível e barra de PV, atributos em hexágonos, estatísticas, as 19 perícias com bônus, inventário em casas por raridade com dica de item, barra de carga e rolagem de d20 animada (crítico/falha crítica, atalho R).
- `data/rules.js` com os rótulos em PT e as regras derivadas dos atributos (+ testes).
- Back-end: `GET /character/me` (Bearer) devolve a ficha e o inventário do personagem da conta logada (ligação pelo nome).
- `CharacterResponse.skills` passou a trazer todas as perícias com `proficient` e `modifier`; as passivas agora somam o modificador do atributo.
- `Item`, `Weapon`, `Armor` e `PlayerItems` ganharam getters/setters (`Armor.getArmorWeight()` por causa do nome repetido).

## 2026-10-25 — Endpoint de criação de personagem (`main`)
- `POST /character` e `GET /character` expostos. Antes o JSON era ignorado (faltava `@RequestBody`) e o personagem chegava vazio na validação do Hibernate.
- Entrada pelo DTO `CreateCharacterRequest` (`@Valid`, mensagens em PT); o `CharacterService` resolve a classe pelo `CharacterClassType`, o antecedente pelo nome e cria os `CharacterSkill` proficientes.
- Saída pelo `CharacterResponse` (achatado, com bônus de proficiência e passivas).
- `Character` ganhou `@Getter @Setter` e `level` mínimo 1; `ApiExceptionHandler` trata JSON inválido/enum desconhecido.
- Testes `CharacterControllerTests` (H2).

## 2026-10-25 — Login real e troca de senha (`main`)
- Back-end: contas por personagem (`Account`) com senha BCrypt, tokens de sessão (`AuthToken`, guardados como SHA-256, 30 dias) e rotas `/auth/login`, `/auth/me`, `/auth/logout`, `/auth/password`.
- Seed das contas Rudo, Gaudron, Proto, Titan e Loge com senha inicial = nome do usuário e troca de senha sugerida no primeiro login.
- Front-end: `LoginForm` conectado à API, `PasswordForm` (troca de senha), `AccountPanel` (logado), sessão no `localStorage` e proxy do Vite para o Spring.
- Build: Lombok declarado como processador de anotações e atualizado para 1.18.48 (o back não compilava via Maven no JDK 27).
- Testes do back com H2 (`AuthControllerTests`) e do front para `api/auth.js` e validação de senha.
- Docs: branches atualizados (back e front já estão em `main`).

## 2026-10-25 — Tela de seleção de personagem em React + documentação (`feature/frontend-react-login`)
- Front-end migrado de JS puro para **React 18 + Vite** (`@vitejs/plugin-react`).
- Tela de seleção de personagem portada do protótipo HTML: painéis animados por mola, divisórias douradas, vídeos do Rudo e do Gaudron, efeitos de brasas, impacto e burst, e login por personagem.
- Imagens e vídeos extraídos do HTML (base64) para `frontend/src/assets/characters/`.
- Removida a tela de login antiga do Copilot (`main.js`, `style.css`); `validation.js` reescrito para usuário e senha.
- Criada a pasta `docs/` (visão geral, back-end, front-end, changelog) e o `CLAUDE.md`.

## 2026-10-23 — Seed do banco e perícias (`feature/inventory`)
- Entidades de personagem, antecedentes, itens e classes; enums de domínio; perícias (`SkillType`).
