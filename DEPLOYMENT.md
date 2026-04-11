# Deployment Guide (Single Server)

This project can run client and server from one Node.js server process.

## 1) Prerequisites

- Node.js 20+
- PostgreSQL database

## 2) Configure server environment

From `server/`, create `.env` using the example.

```powershell
Set-Location server
Copy-Item .env.example .env
```

Set at least:

- `DATABASE_URL`
- `PORT` (optional, default `3000`)
- `NODE_ENV=production`

If frontend is served by the same server, you can leave `CORS_ORIGIN` unset.

## 3) Install dependencies

```powershell
Set-Location server
npm install
Set-Location ..\client
npm install
```

## 4) Build frontend

```powershell
Set-Location ..\server
npm run build
```

This creates `client/dist`, which Express serves automatically.

## 5) Start production server

```powershell
npm run start:prod
```

App URLs:

- Frontend: `http://<host>:<port>/`
- API health: `http://<host>:<port>/api/health`

## Notes

- Client uses same-origin `/api` when `VITE_API_URL` is not set.
- API routes are mounted under `/api/*`.
- Any non-API route is served by `client/dist/index.html` for SPA routing.