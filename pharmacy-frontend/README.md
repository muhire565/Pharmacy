# Pharmacy frontend

React (Vite) UI for the pharmacy POS / inventory app.

## API

- **Production backend:** `https://pharmacy-hafj.onrender.com` (REST under `/api/v1`).
- Production builds use `.env.production` for `VITE_API_URL`. To point at another API, change that file or set `VITE_API_URL` in your host’s build environment (e.g. Render static site env vars).

## Local development

```bash
npm install
npm run dev
```

Ensure the Spring API runs locally (default `http://localhost:8080`) so the Vite proxy for `/api` and `/ws` works, or set `VITE_API_URL` in `.env.local`.

## Build

```bash
npm run build
```

Output: `dist/` — deploy as a static site (Render, Netlify, etc.).
