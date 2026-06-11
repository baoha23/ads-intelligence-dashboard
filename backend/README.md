# Ads Intelligence Dashboard Backend

## Setup

From project root, start PostgreSQL:

```bash
docker compose up -d
```

Then run backend setup:

```bash
npm install
copy .env.example .env
npm run db:setup
npm run dev
```

`npm run db:setup` runs:

1. `prisma generate`
2. `prisma db push`
3. `tsx prisma/seed.ts`

## Useful endpoints

### Metrics overview

`GET /metrics/overview`

### AI query

`POST /ai/query`

```json
{
  "question": "Top 5 campaign revenue tuần này?",
  "from": "2026-06-01",
  "to": "2026-06-07"
}
```

The backend classifies the question, computes metrics first, then asks MiniMax only to format and explain the prepared `analyticsContext`. If `MINIMAX_API_KEY` is not configured, the endpoint returns a deterministic local response so the UI contract can still be developed.
