# CHApp Backend

API Node.js/Express do CHApp. Ela cuida de autenticação, sessão via JWT e dos dados consumidos pelas telas de jogos, títulos, história e carteirinha.

## Tecnologias

- Node.js 20+
- Express
- TypeScript
- TSX para desenvolvimento
- PostgreSQL 16 via Docker Compose
- Prisma ORM
- JWT com `jsonwebtoken`
- Hash de senha com `bcryptjs`
- CORS e dotenv

## Endpoints implementados

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)
- `GET /jogos/overview` (Bearer token)
- `GET /titulos/overview` (Bearer token)
- `GET /historia/overview` (Bearer token)
- `GET /carteirinha/overview` (Bearer token)

## Requisitos

- Node 20+
- Docker (opcional, recomendado para PostgreSQL local)
- npm

## Setup

1. Copie `backend/.env.example` para `backend/.env`.
2. Gere um `JWT_SECRET` forte. Exemplo:
   - `openssl rand -hex 32`
3. Configure `FOOTBALL_DATA_TOKEN` com sua chave da `football-data.org`.
4. Suba o banco:
   - `cd backend`
   - `docker compose up -d`
5. Instale dependências:
   - `npm install`
6. Gere client Prisma:
   - `npm run prisma:generate`
7. Crie esquema no banco:
   - `npm run prisma:push`
8. Inicie API:
   - `npm run dev`

API local padrão: `http://localhost:3333`

O `docker-compose.yml` publica o Postgres local em `localhost:5433`. Portanto, para rodar a API fora do Docker, use:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/chapp?schema=public"
```

## Variáveis de ambiente

Arquivo: `backend/.env`

```env
PORT=3333
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/chapp?schema=public"
JWT_SECRET="seu-valor-gerado"
JWT_EXPIRES_IN="7d"
FOOTBALL_DATA_BASE_URL="https://api.football-data.org/v4"
FOOTBALL_DATA_TOKEN="seu-token-do-football-data"
FOOTBALL_DATA_COMPETITION_CODE="BSA"
FOOTBALL_DATA_TEAM_NAME="Chapecoense"
```

## JWT secret

Exemplo para gerar uma chave forte:

```bash
openssl rand -hex 32
```

Depois use o valor gerado em `backend/.env`:

```env
JWT_SECRET="seu-valor-gerado"
```

## Integração de jogos

O endpoint `GET /jogos/overview` usa `football-data.org` para retornar:

- partidas anteriores da Chapecoense
- partidas em andamento da Chapecoense, observando que o plano free pode entregar placares com atraso
- próximas partidas da Chapecoense
- tabela da Série A

Variáveis usadas:

```env
FOOTBALL_DATA_BASE_URL="https://api.football-data.org/v4"
FOOTBALL_DATA_TOKEN="seu-token-do-football-data"
FOOTBALL_DATA_COMPETITION_CODE="BSA"
FOOTBALL_DATA_TEAM_NAME="Chapecoense"
```

## Contrato de resposta (auth)

`POST /auth/login` e `POST /auth/register` retornam:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "Nome",
    "email": "email@dominio.com",
    "updatedAt": "2026-03-18T00:00:00.000Z"
  }
}
```

## Cadastro atual

O backend aceita cadastro com `POST /auth/register`.

O app mobile agora tambem consegue criar conta pela tela de autenticacao, desde que `EXPO_PUBLIC_API_BASE_URL` esteja apontando para a API correta.

## Comandos úteis

```bash
npm run dev
npm run build
npm start
npm run prisma:generate
npm run prisma:push
npm run prisma:migrate
```
