# Front-end

> Código em `frontend/`, já em `main`. React 18 + Vite 8, CSS puro, JavaScript (sem TypeScript).

## Onde está cada assunto

Leia este arquivo e **só** o subdocumento da área da tarefa:

| Documento | Conteúdo |
|---|---|
| [frontend-telas.md](frontend-telas.md) | Login e seleção, painel do mestre, assistente de criação, ficha do personagem |
| [frontend-visual.md](frontend-visual.md) | Animações, efeitos, artes dos personagens e como trocar/adicionar |

## Estrutura

```
frontend/
├── index.html                 carrega as fontes Cinzel/Spectral (Google Fonts) e src/main.jsx
├── vite.config.js             plugin React + proxy /runarcana → http://localhost:8080
└── src/
    ├── main.jsx               monta <App/> e importa o CSS global
    ├── App.jsx                estado (hovered, selected, sessão), cabeçalho, painéis e qual formulário mostrar
    ├── api/auth.js (+ .test.js)  chamadas /auth (login, me, logout, senha), sessão no localStorage e o `request` compartilhado
    ├── api/character.js       ficha do logado, usos de habilidade e descanso
    ├── api/documents.js       documentos do mestre (listar, marcar lido)
    ├── api/notes.js           anotações (listar, criar, salvar, apagar)
    ├── data/characters.js     lista de personagens + imports das artes
    ├── data/rules.js (+ .test.js)  rótulos em PT, formatação e regras derivadas dos atributos
    ├── components/
    │   ├── CharacterPanel.jsx painel de um personagem (imagem/vídeo, sombra, legenda, efeitos)
    │   ├── Separator.jsx      divisória dourada entre painéis
    │   ├── LoginForm.jsx      formulário de login do personagem escolhido
    │   ├── PasswordForm.jsx   troca de senha (senha atual, nova, confirmação)
    │   ├── effects/Embers.jsx brasas e calor (Gaudron)
    │   ├── effects/BloodMagic.jsx magia de sangue (Rudo)
    │   └── sheet/             ficha pós-login: CharacterSheet (abas e estado), SheetHero, OverviewTab, AttributeGrid,
    │                          SkillList, AbilitiesTab, AbilityIcon, Inventory, DocumentsTab, NotesTab, DiceRoll,
    │                          TabBar (abas com sublinhado deslizante), Num (número que conta), icons
    │   └── master/            MasterGate (portal de login), MasterPanel, MasterDocuments, MasterAbilities, MasterSheets, MasterRules
    ├── hooks/usePanelSprings.js  animação por mola (requestAnimationFrame)
    ├── hooks/useCountUp.js (+ .test.js)  número que conta até o valor; prefersReducedMotion
    ├── utils/motion.js        replay (reinicia animação de classe) e afterLeave (espera a saída)
    ├── utils/placeholderArt.js   gera um retrato SVG para quem ainda não tem arte
    ├── utils/iconImage.js (+ .test.js)  valida e reduz a imagem do ícone de habilidade para 128x128
    ├── styles/global.css      visual da seleção e do login (tokens em :root)
    ├── styles/sheet.css       visual da ficha
    ├── styles/master.css      botão, portal e painel do mestre
    ├── styles/motion.css      animações de polimento (importado por último no main.jsx)
    ├── api/master.js          rotas do mestre (personagens, habilidades, documentos, destinatários, liberar a subida de nível)
    ├── validation.js (+ .test.js)
    └── assets/characters/     rudo.jpg/.mp4, gaudron.jpg/.mp4
```

## Conexão com a API

`src/api/auth.js` chama `VITE_API_URL` (padrão `/runarcana`). Em `npm run dev`, o Vite repassa `/runarcana` para o Spring em `localhost:8080`, então **o back-end precisa estar rodando** para o login funcionar. Os erros mostrados vêm do campo `message` da API; sem servidor, aparece "Não foi possível falar com o servidor". As regras de senha são repetidas em `validation.js` (`validatePasswordChange`) só para avisar antes de enviar; quem decide é o back-end.

## Identidade visual

Tokens em `:root` (`global.css`): fundo `--bg #050b14`, painel `--panel #0a1626`, dourado `--gold #c8a24a` / `--gold-hi #f0c75e`, turquesa `--teal #2fd3c0`, texto `--text #e8dfc8`, apagado `--muted #8d97a8`. Fontes: **Cinzel** (títulos, nomes, botões) e **Spectral** (texto).

## Origem

A tela foi prototipada num `index.html` único (React via CDN, imagens e vídeo em base64, cerca de 12 MB) numa sessão anterior do Claude e depois portada para este projeto Vite. Ficaram de fora do porte:
- um efeito de "sangue escorrendo" (`BloodFx`) para o Rudo que estava no protótipo, mas não era usado. Depois o Rudo ganhou um efeito novo, a magia de sangue (`BloodMagic.jsx`, `fx: 'blood'`);
- o fallback que convertia vídeo base64 em Blob (não é necessário com arquivos de verdade).

## Pendências / problemas conhecidos

- Ainda não há roteamento (react-router): as abas da ficha são estado local e não mudam a URL (recarregar volta para "FICHA").
- O token fica no `localStorage` (simples, mas acessível a scripts da página); se o projeto crescer, considerar cookie `HttpOnly`.
