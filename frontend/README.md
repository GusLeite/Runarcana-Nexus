# Frontend - Runarcana Nexus

Frontend inicial do projeto com tela de login (somente frontend) em português-BR.

## Requisitos

- Node.js 20+ (recomendado)
- npm 10+ (recomendado)

## Como instalar

```bash
cd /home/runner/work/Runarcana-Nexus/Runarcana-Nexus/frontend
npm install
```

## Como rodar em desenvolvimento

```bash
npm run dev
```

## Como gerar build de produção

```bash
npm run build
```

## Como executar testes

```bash
npm run test
```

## Escopo desta entrega

- Tela de login responsiva (desktop/mobile)
- Direção visual original de fantasia premium (tema escuro com acentos dourados e painel estilo RPG)
- Campos de e-mail/usuário e senha
- Validação client-side com mensagens acessíveis de erro
- Estado de carregamento visual no botão
- Alternância mostrar/ocultar senha
- Link visual de recuperação de senha (sem backend)
- Mensagens explícitas de que a autenticação real e a recuperação de senha dependem do backend

## Pendências do backend

Responsável pelo backend, por favor construir os itens abaixo para permitir integração real do login:

1. Endpoint de login (rota HTTP e método)
2. Contrato de autenticação e resposta (payload de entrada/saída)
3. Estratégia de sessão ou token (JWT/cookie etc.)
4. Fluxo/endpoints de recuperação de senha
5. Configuração de CORS e variáveis de ambiente por ambiente
6. Padrão de tratamento e retorno de erros de autenticação
