# CHApp

Aplicativo mobile da Chapecoense feito com Expo/React Native e uma API Node.js para autenticação e dados das telas principais.

## O que o projeto tem hoje

- Login e cadastro com API real.
- Sessão persistida no app com `expo-secure-store` no mobile e `localStorage` no web.
- Backend com `Express`, `PostgreSQL`, `Prisma`, `JWT` e senha criptografada com `bcryptjs`.
- Tela inicial com dados de história, jogos e títulos.
- Telas integradas com API: `home`, `jogos`, `titulos`, `historia` e `carteirinha`.
- Integração com `football-data.org` para buscar jogos, tabela e calendário.
- Configuração Expo/EAS em `eas.json`.

## Tecnologias e ferramentas

### App mobile

- Expo `~54`
- React `19`
- React Native `0.81`
- Expo Router
- React Navigation
- TypeScript
- Expo Secure Store
- Expo Haptics, Clipboard, Image, Splash Screen, Status Bar e System UI
- `@expo/vector-icons` com Material Icons
- ESLint com `eslint-config-expo`

### Backend

- Node.js `20+`
- Express
- TypeScript
- TSX em desenvolvimento
- PostgreSQL `16` via Docker Compose
- Prisma ORM
- JWT com `jsonwebtoken`
- Criptografia de senha com `bcryptjs`
- CORS e dotenv

## Estrutura do projeto

```txt
.
├── app/                    # Rotas e telas do Expo Router
├── assets/                 # Imagens, icones e assets do app
├── components/             # Componentes reutilizaveis do app
├── constants/              # Tema e constantes visuais
├── contexts/               # Contexto de autenticacao
├── hooks/                  # Hooks reutilizaveis
├── services/               # Cliente HTTP e services do app
├── types/                  # Tipos TypeScript do app
├── backend/                # API Node.js/Express
│   ├── prisma/             # Schema Prisma
│   ├── src/                # Codigo fonte da API
│   └── docker-compose.yml  # PostgreSQL local
└── docs/                   # Documentacao complementar
```

## Requisitos

- Node.js 20 ou superior
- npm
- Docker e Docker Compose
- Expo Go no celular, Android Emulator ou iOS Simulator para testar o app mobile
- Conta/token da `football-data.org` para dados reais de jogos

## Setup rapido

Rode o backend em um terminal e o app em outro.

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d
npm run prisma:generate
npm run prisma:push
npm run dev
```

API local padrao:

```txt
http://localhost:3333
```

Depois de copiar `backend/.env.example`, troque o `JWT_SECRET` por um valor forte:

```bash
openssl rand -hex 32
```

Exemplo de `backend/.env` para desenvolvimento local:

```env
PORT=3333
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/chapp?schema=public"
JWT_SECRET="cole-aqui-o-valor-gerado"
JWT_EXPIRES_IN="7d"
FOOTBALL_DATA_BASE_URL="https://api.football-data.org/v4"
FOOTBALL_DATA_TOKEN="seu-token-do-football-data"
FOOTBALL_DATA_COMPETITION_CODE="BSA"
FOOTBALL_DATA_TEAM_NAME="Chapecoense"
```

Observacao: o Docker Compose publica o Postgres em `localhost:5433`. Por isso o `DATABASE_URL` local usa a porta `5433`, mesmo o container usando `5432` internamente.

### 2. App

Na raiz do projeto:

```bash
cp .env.example .env
npm install
npm start
```

Com o Expo aberto, escolha onde rodar:

- `a` para Android
- `i` para iOS
- `w` para web
- ler o QR Code pelo Expo Go no celular

## Variaveis de ambiente do app

Arquivo: `.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3333
EXPO_PUBLIC_AUTH_LOGIN_PATH=/auth/login
EXPO_PUBLIC_AUTH_REGISTER_PATH=/auth/register
```

Use `EXPO_PUBLIC_API_BASE_URL` conforme o ambiente:

- Web no mesmo computador: `http://localhost:3333`
- Android Emulator: `http://10.0.2.2:3333`
- iOS Simulator: `http://localhost:3333`
- Expo Go no celular: `http://IP_DA_SUA_MAQUINA:3333`

Exemplo para Expo Go no celular:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.2.19:3333
EXPO_PUBLIC_AUTH_LOGIN_PATH=/auth/login
EXPO_PUBLIC_AUTH_REGISTER_PATH=/auth/register
```

O cliente HTTP tenta ajustar automaticamente `localhost` para o host correto em alguns cenarios de desenvolvimento, mas para Expo Go o mais confiavel e usar o IP da maquina.

## Comandos uteis

Na raiz do app:

```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
```

No backend:

```bash
npm run dev
npm run build
npm start
npm run prisma:generate
npm run prisma:push
npm run prisma:migrate
```

Docker do banco:

```bash
cd backend
docker compose up -d
docker compose down
```

## Endpoints atuais

Endpoints publicos:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`

Endpoints autenticados com `Authorization: Bearer <token>`:

- `GET /auth/me`
- `GET /jogos/overview`
- `GET /titulos/overview`
- `GET /historia/overview`
- `GET /carteirinha/overview`

## Como testar a autenticacao

Com o backend rodando, crie um usuario pela API:

```bash
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@chapp.com","password":"123456"}'
```

Ou crie direto pelo app em `Criar uma conta`.

Depois faca login com:

```txt
email: teste@chapp.com
senha: 123456
```

Para testar um endpoint autenticado via terminal:

```bash
TOKEN="cole-o-token-retornado-no-login"
curl http://localhost:3333/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Jogos da Chape

`GET /jogos/overview` busca dados reais da `football-data.org` no backend.

Variaveis relevantes em `backend/.env`:

```env
FOOTBALL_DATA_BASE_URL="https://api.football-data.org/v4"
FOOTBALL_DATA_TOKEN="seu-token"
FOOTBALL_DATA_COMPETITION_CODE="BSA"
FOOTBALL_DATA_TEAM_NAME="Chapecoense"
```

Defaults usados pelo projeto:

- `FOOTBALL_DATA_COMPETITION_CODE=BSA`
- `FOOTBALL_DATA_TEAM_NAME=Chapecoense`

No plano free da `football-data.org`, jogos em andamento podem ter atraso nos placares. O backend ainda retorna ultimos jogos, proximos jogos e tabela da competicao.

## Build com EAS

O arquivo `eas.json` ja possui perfis de build:

- `development`: build com development client.
- `preview`: build interno Android em APK.
- `production`: build de producao com `autoIncrement`.

Exemplo:

```bash
npx eas build --profile preview --platform android
```

Antes de gerar build para celular real, revise o `EXPO_PUBLIC_API_BASE_URL` do perfil para apontar para uma API acessivel pelo aparelho. `localhost` dentro do app nao aponta para o seu computador em builds instalados no telefone.

## Documentacao complementar

- [Plano de Finalizacao](docs/PLANO_FINALIZACAO.md)
- [README do Backend](backend/README.md)

## Observacoes para compartilhar o projeto

- Nao envie os arquivos `.env` reais. Eles ficam ignorados pelo Git.
- Envie os `.env.example` e explique quais valores precisam ser preenchidos.
- Para outra pessoa rodar tudo localmente, ela precisa instalar dependencias na raiz e dentro de `backend/`.
- Se a porta `5433` ja estiver em uso, altere a porta no `backend/docker-compose.yml` e ajuste o `DATABASE_URL`.
