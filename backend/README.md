# Quick Monitor – Backend

Node.js (18.20+/20+) REST API that reads `machine_health` (see `../scripts/db.sql`) and exposes it to the frontend. The API has no authentication.

## Setup

```sh
npm install
cp .env.example .env     # Windows: copy .env.example .env
```

Edit `.env`:

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default 3000) |
| `CORS_ORIGIN` | Frontend origin (default `http://localhost:5173`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | MySQL connection |

## Run

```sh
npm start        # production
npm run dev      # auto-reload
npm test         # unit tests
```

## API

- `GET /api/services` – service names from the `services` table
- `GET /api/metrics?from=<ISO UTC>&to=<ISO UTC>[&services=a,b]` – metrics grouped by service

Timestamps are stored and returned in UTC.
