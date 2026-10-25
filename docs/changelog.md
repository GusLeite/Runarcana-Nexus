# Changelog

Entradas mais recentes no topo. Formato: `## AAAA-MM-DD — título (branch)`.

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
