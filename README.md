# CHApp

Aplicativo mobile da Chapecoense construído com Expo/React Native, com backend Node.js para autenticação.

## Status atual

- `login` funcionando com API real
- `cadastro` funcionando com API real
- sessão persistida com `expo-secure-store`
- backend com `PostgreSQL + Prisma + JWT`
- tela `jogos` integrada com API local
- tela `titulos` integrada com API local
- tela `historia` integrada com API local
- tela `carteirinha` integrada com API local

## Estrutura

- `app/`: app mobile com `expo-router`
- `backend/`: API de autenticação
- `docs/PLANO_FINALIZACAO.md`: roadmap e pendências do projeto

## Requisitos

- Node 20+
- npm
- Docker

## Setup do backend

1. Entre em `backend/`
2. Copie `backend/.env.example` para `backend/.env`
3. Gere um `JWT_SECRET` forte:

```bash
openssl rand -hex 32
```

4. Coloque o valor em `backend/.env`
5. Configure `FOOTBALL_DATA_TOKEN` em `backend/.env` com sua chave da `football-data.org`
6. Suba o banco:

```bash
cd backend
docker compose up -d
```

7. Instale dependências e prepare o Prisma:

```bash
npm install
npm run prisma:generate
npm run prisma:push
```

8. Inicie a API:

```bash
npm run dev
```

API local padrão:

```txt
http://localhost:3333
```

## Setup do app

1. Na raiz do projeto, copie `.env.example` para `.env`
2. Ajuste `EXPO_PUBLIC_API_BASE_URL` conforme o ambiente de teste
3. Instale dependências:

```bash
npm install
```

4. Inicie o app:

```bash
npm start
```

## URL da API por ambiente

Use `EXPO_PUBLIC_API_BASE_URL` conforme onde o app estiver rodando:

- Web no mesmo computador:
  - `http://localhost:3333`
- Android Emulator:
  - `http://10.0.2.2:3333`
- iOS Simulator:
  - `http://localhost:3333`
- Expo Go no celular:
  - `http://IP_DA_SUA_MAQUINA:3333`
  - exemplo: `http://192.168.2.19:3333`

Exemplo de `.env` na raiz:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.2.19:3333
EXPO_PUBLIC_AUTH_LOGIN_PATH=/auth/login
EXPO_PUBLIC_AUTH_REGISTER_PATH=/auth/register
```

## Como testar autenticação

Com backend rodando, você pode criar usuário pela API:

```bash
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@chapp.com","password":"123456"}'
```

Ou criar direto pela interface do app em `Criar uma Conta`.

Login de teste:

```txt
email: teste@chapp.com
senha: 123456
```

## Endpoints atuais

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /jogos/overview`
- `GET /titulos/overview`
- `GET /historia/overview`
- `GET /carteirinha/overview`
- `GET /health`

## Comandos úteis

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
npm run prisma:generate
npm run prisma:push
```

## Documentação complementar

- [Plano de Finalização](/home/wilian/Documents/-chapp/docs/PLANO_FINALIZACAO.md)
- [README do Backend](/home/wilian/Documents/-chapp/backend/README.md)

## Jogos da Chape

`GET /jogos/overview` agora busca dados reais da `football-data.org` no backend.

Variáveis relevantes em `backend/.env`:

```env
FOOTBALL_DATA_BASE_URL=https://api.football-data.org/v4
FOOTBALL_DATA_TOKEN=seu-token
FOOTBALL_DATA_COMPETITION_CODE=BSA
FOOTBALL_DATA_TEAM_NAME=Chapecoense
```

Defaults usados pelo projeto:

- `FOOTBALL_DATA_COMPETITION_CODE=BSA` para Série A
- `FOOTBALL_DATA_TEAM_NAME=Chapecoense`

No plano free do `football-data.org`, os jogos em andamento podem ter atraso nos placares. Ainda assim, o backend retorna últimos jogos, próximos jogos e tabela reais da competição.
