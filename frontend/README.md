# Ads Intelligence Dashboard Frontend

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Default API URL:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## AI Assistant

The first screen calls `POST /ai/query` and renders all backend response types:

- `text`
- `table`
- `mixed`
- `clarification`

Run backend first, then open the Vite URL shown by `npm run dev`.
