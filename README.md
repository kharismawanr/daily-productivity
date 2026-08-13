# Daily Productivity (Hermes Work Management)

Personal task/project manager with Kanban, dashboard, projects, and chat assistants. Runs on Docker (frontend nginx + backend API).

## Stack

- **Frontend:** React + Vite + Tailwind, PWA (`vite-plugin-pwa`)
- **Backend:** Node/Express + MySQL
- **Deploy:** `docker compose` — frontend `:8182`, backend `:3002` (API also proxied at `/api` on frontend)

## Quick start

```bash
cp .env.example .env
# edit DB_* and API_KEY

docker compose up -d --build
```

- App: http://localhost:8182  
- API direct: http://localhost:3002/api/v1  
- Same-origin API (PWA/HTTPS): http://localhost:8182/api/v1  

## Env

See `.env.example`. Required: `DB_USER`, `DB_PASS`, `API_KEY`.

`API_KEY` is injected into the frontend build as `VITE_API_KEY` and checked by the backend (`x-api-key` header).

## PWA / remote access

App is installable as PWA. For Android install from outside the LAN, put HTTPS in front (e.g. Cloudflare Tunnel public hostname → `http://localhost:8182`). Service in Zero Trust should be **http** to the origin; users get **https** on the public hostname.

## Layout

```
backend/     Express API
frontend/    Vite React PWA + nginx reverse proxy to API
docker-compose.yml
.env.example
```

## DB

SQL schema/seed: `backend/schema.sql`, `backend/seed.sql`.