# Changelog

Entradas mais recentes no topo. Formato: `## AAAA-MM-DD — título (branch)`.

## 2026-10-25 — Tela de seleção de personagem em React + documentação (`feature/frontend-react-login`)
- Front-end migrado de JS puro para **React 18 + Vite** (`@vitejs/plugin-react`).
- Tela de seleção de personagem portada do protótipo HTML: painéis animados por mola, divisórias douradas, vídeos do Rudo e do Gaudron, efeitos de brasas, impacto e burst, e login por personagem.
- Imagens e vídeos extraídos do HTML (base64) para `frontend/src/assets/characters/`.
- Removida a tela de login antiga do Copilot (`main.js`, `style.css`); `validation.js` reescrito para usuário e senha.
- Criada a pasta `docs/` (visão geral, back-end, front-end, changelog) e o `CLAUDE.md`.

## 2026-10-23 — Seed do banco e perícias (`feature/inventory`)
- Entidades de personagem, antecedentes, itens e classes; enums de domínio; perícias (`SkillType`).
