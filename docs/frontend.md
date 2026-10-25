# Front-end

> Código em `frontend/`, já em `main`. React 18 + Vite 8, CSS puro, JavaScript (sem TypeScript).

## Tela atual: seleção de personagem + login

1. O topo mostra o logo **RUNARCANA** e uma dica ("Escolha seu personagem para entrar").
2. Cinco painéis verticais (Rudo, Gaudron, Proto, Titan, Loge), separados por divisórias douradas com losangos.
3. **Hover/foco** em um painel: ele se expande com uma mola, ganha zoom e brilho, mostra papel, nome, linha dourada e lore; os vizinhos encolhem e a divisória ao lado acende. Um feixe de luz cruza o painel.
4. **Clique, Enter ou Espaço**: o personagem ocupa a tela, os outros somem e aparece o formulário de login com o nome dele.
5. **Login** (`LoginForm.jsx`): o usuário já vem preenchido com o `id` do personagem; a senha é conferida no back-end (`POST /auth/login`). Se a conta que entrou não for a do personagem escolhido, o login é desfeito e aparece um erro.
6. **Senha inicial**: enquanto a conta tem `mustChangePassword`, o painel abre direto em "Crie sua senha" (`PasswordForm.jsx`), com a opção "Agora não" (volta a pedir no próximo login).
7. **Logado** (`AccountPanel.jsx`): boas-vindas, "Alterar senha" e "Sair". É a tela pós-login provisória.
8. "Trocar de personagem" (antes de logar) volta para a seleção; "Sair" faz logout e volta também.

A sessão (`{ token, username, mustChangePassword }`) fica no `localStorage` (`runarcana.session`). Ao recarregar, o app abre direto no personagem logado e confirma o token com `GET /auth/me`; se o servidor recusar (401), volta para a seleção. Servidor fora do ar não desloga.

Responsivo: abaixo de 760px os painéis empilham na vertical e a lore some. Com `prefers-reduced-motion` as animações e partículas são desligadas.

## Estrutura

```
frontend/
├── index.html                 carrega as fontes Cinzel/Spectral (Google Fonts) e src/main.jsx
├── vite.config.js             plugin React + proxy /runarcana → http://localhost:8080
└── src/
    ├── main.jsx               monta <App/> e importa o CSS global
    ├── App.jsx                estado (hovered, selected, sessão), cabeçalho, painéis e qual formulário mostrar
    ├── api/auth.js (+ .test.js)  chamadas /auth (login, me, logout, senha) e sessão no localStorage
    ├── data/characters.js     lista de personagens + imports das artes
    ├── components/
    │   ├── CharacterPanel.jsx painel de um personagem (imagem/vídeo, sombra, legenda, efeitos)
    │   ├── Separator.jsx      divisória dourada entre painéis
    │   ├── LoginForm.jsx      formulário de login do personagem escolhido
    │   ├── PasswordForm.jsx   troca de senha (senha atual, nova, confirmação)
    │   ├── AccountPanel.jsx   painel do jogador logado
    │   └── effects/Embers.jsx brasas e calor (Gaudron)
    ├── hooks/usePanelSprings.js  animação por mola (requestAnimationFrame)
    ├── utils/placeholderArt.js   gera um retrato SVG para quem ainda não tem arte
    ├── styles/global.css      todo o visual (tokens em :root)
    ├── validation.js (+ .test.js)
    └── assets/characters/     rudo.jpg/.mp4, gaudron.jpg/.mp4
```

## Conexão com a API

`src/api/auth.js` chama `VITE_API_URL` (padrão `/runarcana`). Em `npm run dev`, o Vite repassa `/runarcana` para o Spring em `localhost:8080`, então **o back-end precisa estar rodando** para o login funcionar. Os erros mostrados vêm do campo `message` da API; sem servidor, aparece "Não foi possível falar com o servidor". As regras de senha são repetidas em `validation.js` (`validatePasswordChange`) só para avisar antes de enviar; quem decide é o back-end.

## Como a animação funciona

`usePanelSprings` roda um loop de `requestAnimationFrame` que, para cada painel, simula três molas (rigidez `w = 4`, amortecimento crítico):
- `g`: `flex-grow` (1 normal, 3.4 em hover, 0.65 nos vizinhos, 10 no selecionado, 0 nos que somem)
- `t`: progresso visual 0→1, exposto como a variável CSS `--t`
- `o`: opacidade

Os valores são escritos **direto no DOM** (`style.flexGrow`, `--t`, `opacity`) para não re-renderizar o React a cada frame. No CSS, zoom, saturação, brilho, legenda, linha e lore são `calc()` em cima de `--t`, por isso tudo anda no mesmo compasso. O hover tem um atraso de 90 ms (`App.jsx`) para o mouse poder atravessar a fileira sem acender todos os painéis.

## Personagens e efeitos

Definidos em `src/data/characters.js`:

| Campo | Uso |
|---|---|
| `id, name, role, lore` | textos |
| `hue` | cor do brilho do painel (`--h`); com `variant` (0–4), gera o placeholder |
| `img` | arte real importada de `assets/`; se não existir, usa `placeholderArt(hue, variant)` |
| `vid` | MP4 mudo em loop sobre a imagem (`img` vira o poster) |
| `pos` | enquadramento da arte (`background-position`/`object-position`) |
| `fx: 'embers'` | brasas subindo e calor no chão (`Embers.jsx`) |
| `impact` | ondas de choque, explosão laranja e tremor da arte ao entrar |
| `burst` | pulso radial vermelho ao entrar |

Estado atual: **Rudo** (vídeo + burst vermelho) e **Gaudron** (vídeo + brasas + impacto) têm arte real; **Proto, Titan e Loge** usam placeholders.

### Adicionar ou trocar a arte de um personagem
1. Coloque o arquivo em `src/assets/characters/` (JPG para a imagem; MP4 H.264 sem áudio para o vídeo).
2. Importe em `characters.js` e preencha `img` / `vid` / `pos` no item do personagem.
3. Para um efeito novo, crie o componente em `components/effects/`, renderize em `CharacterPanel.jsx` e adicione o CSS em `global.css`.

## Identidade visual

Tokens em `:root` (`global.css`): fundo `--bg #050b14`, painel `--panel #0a1626`, dourado `--gold #c8a24a` / `--gold-hi #f0c75e`, turquesa `--teal #2fd3c0`, texto `--text #e8dfc8`, apagado `--muted #8d97a8`. Fontes: **Cinzel** (títulos, nomes, botões) e **Spectral** (texto).

## Origem

A tela foi prototipada num `index.html` único (React via CDN, imagens e vídeo em base64, cerca de 12 MB) numa sessão anterior do Claude e depois portada para este projeto Vite. Ficaram de fora do porte:
- um efeito de "sangue escorrendo" (`BloodFx`) para o Rudo que estava no protótipo, mas não era usado (`fx: 'blood'` não estava ativo);
- o fallback que convertia vídeo base64 em Blob (não é necessário com arquivos de verdade).

## Pendências / problemas conhecidos

- Artes reais para Proto, Titan e Loge.
- Vídeos pesados (cerca de 8,5 MB e 7,2 MB) estão versionados no Git; vale comprimir ou passar para Git LFS/CDN.
- Ainda não há roteamento (react-router); a tela pós-login é só o `AccountPanel` provisório.
- O token fica no `localStorage` (simples, mas acessível a scripts da página); se o projeto crescer, considerar cookie `HttpOnly`.
