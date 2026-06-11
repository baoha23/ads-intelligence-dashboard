# AI-powered Ads Intelligence Dashboard

Full-stack ads performance analytics dashboard with a deterministic metrics backend and an AI assistant that explains prepared analytics context in Vietnamese or English.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript + CSS |
| Backend | NestJS + Prisma + PostgreSQL |
| AI | MiniMax (Anthropic-compatible) with local fallback |
| Tests | Node:test (built-in) |

## Features

- **Dashboard**: KPI cards, revenue vs cost trend chart, anomaly detection panel, CSV export
- **Campaigns**: list with filters (ad type, upstream, downstream), drilldown with daily records, create sample data, delete campaign (cascade)
- **Reports**: weekly report with top campaigns, revenue by ad type, anomaly signals
- **AI Assistant**: Vietnamese / English natural language queries with MiniMax + local deterministic fallback
- **AI intent classification**: 6 supported intents (top revenue, highest CPM, comparison, declining clicks, revenue by ad type, campaign summary)

## Project structure

```
ads-intelligence-dashboard/
├── backend/                  # NestJS API
│   ├── prisma/
│   ├── src/
│   │   ├── ai/              # AI service, anomaly, reports, intent
│   │   ├── campaigns/       # Campaigns CRUD
│   │   ├── export/          # CSV export
│   │   ├── metrics/         # Deterministic metrics
│   │   ├── prisma/          # Prisma service
│   │   └── seed/            # Sample data generator
│   └── tests (Node:test)
├── frontend/                 # React + Vite
│   └── src/
│       ├── api/             # Typed API clients
│       ├── pages/           # Dashboard, Campaigns, Reports, AI Assistant
│       └── components/
└── docker-compose.yml        # PostgreSQL (optional)
```

## Local setup

### 1. PostgreSQL

Use Docker Compose (optional):

```bash
docker compose up -d
```

Or any local PostgreSQL instance. Update `backend/.env` `DATABASE_URL` accordingly.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Edit `backend/.env` to set:

- `DATABASE_URL` — your PostgreSQL connection string
- `MINIMAX_API_KEY` — your MiniMax API key (optional; app falls back to deterministic local responses without it)
- `MINIMAX_BASE_URL` — defaults to `https://api.minimax.io/anthropic`
- `MINIMAX_MODEL` — defaults to `MiniMax-Text-01`

Useful checks:

```bash
npm run typecheck
npm run test
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL (default `http://localhost:3000`).

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /metrics/overview | KPI summary + top campaigns |
| GET | /metrics/trend | Daily revenue/cost trend |
| GET | /campaigns | List with filters |
| GET | /campaigns/:id | Detail + daily records |
| DELETE | /campaigns/:id | Cascade delete |
| POST | /ai/query | Natural language analytics query |
| GET | /ai/anomalies | 2-sigma rolling anomaly detection |
| GET | /ai/report/weekly | Weekly summary report |
| GET | /export/csv | Daily records CSV |
| POST | /seed/sample | Generate sample data |
| GET | /ai/debug | Test MiniMax connection |

## Testing

```bash
cd backend
npm run test          # 17 tests
npm run test:intent   # AI intent classifier
npm run test:ai       # AI module
```

## AI design

The AI layer follows a strict 2-stage design:

1. **Backend** classifies intent, queries the database, and computes all numeric metrics deterministically.
2. **MiniMax** only receives a pre-computed `analyticsContext` and explains, summarizes, or formats it.

This prevents the model from inventing numbers, querying raw data, or hallucinating calculations. When `MINIMAX_API_KEY` is not configured, the endpoint returns a deterministic local response so the UI can be developed and demoed without API access.

## License

MIT
