# Quick Monitor – Frontend

React + Vite dashboard with line charts per metric (one line per service).

## Setup

```sh
npm install
```

## Run

Start the backend first (see `../backend/README.md`), then:

```sh
npm run dev      # http://localhost:5173, proxies /api to http://localhost:3000
```

The date range defaults to today (00:00:00 to now, local time); the range is converted to UTC for the API.

## Other commands

```sh
npm test         # unit tests
npm run build    # production build in dist/
npm run preview  # serve the production build
```

For production, serve `dist/` behind a web server that proxies `/api` to the backend, or change the proxy target in `vite.config.js` for local use.
