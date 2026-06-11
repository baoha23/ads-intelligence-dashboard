# Architecture

## System overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Frontend (React)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │ Dashboard  │  │ Campaigns  │  │  Reports   │  │ AI Asst.   │     │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │
│         │              │              │              │             │
│         └──────────────┴──────────────┴──────────────┘             │
│                         fetch / typed API client                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Backend (NestJS)                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │  Metrics   │  │ Campaigns  │  │  Export    │  │   Seed     │     │
│  │ Controller │  │ Controller │  │ Controller │  │ Controller │     │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘     │
│        │               │               │               │          │
│  ┌─────┴───────────────┴───────────────┴───────────────┴──────┐   │
│  │                       AI Module                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │ Intent   │  │ Context  │  │  MiniMax │  │  Local   │    │   │
│  │  │Classifier│→ │  Builder │→ │  Client  │  │  Fallback│    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  │       ↓              ↓              ↓            ↓          │   │
│  │  classifyAiIntent  buildContext  Anthropic    deterministic │   │
│  │                                   SDK         response     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                          ↓                                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Prisma Client (PostgreSQL)                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## AI 2-layer design

The AI assistant follows a strict separation of concerns:

1. **Backend layer (deterministic)**
   - Classify the user question into a known `AiIntent`
   - Run a Prisma query with the matching intent
   - Compute all numeric metrics (revenue, cost, CPM, CPA, CPS, CTR)
   - Build a strict `AnalyticsContext` JSON object

2. **MiniMax layer (interpretive)**
   - Receives the prepared `AnalyticsContext`
   - Explains, summarizes, or formats the data
   - Returns a strict JSON response matching the schema

This separation prevents:
- Hallucinated numbers (model never invents metrics)
- SQL injection (model never queries DB)
- Causal claims without evidence (model only cites context)

## Intent classification

```
User question
  ↓
classifyAiIntent()  (deterministic keyword matching)
  ↓
AiIntent:
  - top_campaigns_by_revenue
  - highest_cpm_campaigns
  - revenue_comparison_period
  - declining_clicks_campaigns
  - revenue_by_ad_type
  - campaign_summary
  - unknown
```

Each intent maps to a dedicated backend query. Unknown intents still call MiniMax for small-talk / concept explanations.

## Local fallback

When `MINIMAX_API_KEY` is not set, or when the API call fails, the service returns a deterministic local response. This enables:

- Local development without API access
- Graceful degradation during outages
- Testable UI contract

## Anomaly detection

2-sigma rolling window over the last 7 days:

```typescript
expected = avg(last 7 days)
sigma = (today - expected) / stddev
if |sigma| > 2 → flag
```

Checks three metrics: `revenue`, `clicks`, `cpm`. Skips flat series (stddev = 0).

## Module dependency graph

```
AppModule
  ├── ConfigModule (global)
  ├── MetricsModule
  │     └── PrismaModule
  ├── CampaignsModule
  │     └── PrismaModule
  ├── ExportModule
  │     └── PrismaModule
  ├── SeedModule
  │     └── PrismaModule
  └── AiModule
        ├── MetricsModule
        └── PrismaModule
```

`PrismaModule` is the only data access point. No module directly imports another module's service except through the DI container.

## Testing strategy

- **Pure functions** extracted into separate files (e.g. `intent.ts`, `csv.ts`, `anomalyDetect.ts`, `aiResponse.ts`) so they can be tested without DI or DB
- **Node:test** runner (built-in, no Jest/Mocha dependency)
- 17 tests covering: intent classifier, local response builder, anomaly detection, CSV escaping

## Data model

```prisma
Campaign 1───n DailyRecord
Campaign 1───n DailyRecord (cascade delete)
```

Two models, four fields. `AnomalyLog` is declared but currently computed on-the-fly without persistence.

## Why these choices?

- **NestJS over Express**: opinionated structure, built-in DI, easy module boundaries
- **Prisma over raw SQL**: type-safe queries, schema-as-source-of-truth
- **Anthropic SDK over raw HTTP**: typed responses, retry/timeout built-in
- **React + Vite over CRA**: faster dev server, native ESM, smaller bundle
- **CSS over Tailwind**: zero extra dependencies, easier to read for reviewers
- **Node:test over Jest**: zero config, fast, native to Node 22
