# pb-st-system

Full‑stack inventory and billing system built with:

- Frontend: React + Vite + Tailwind CSS + TanStack Query
- Backend: Node.js (Express) + Prisma (PostgreSQL/SQLite)

## Quick start

1) Clone and install

```powershell
# from repo root
cd server; npm install; cd ..
cd client; npm install; cd ..
```

2) Configure env vars

- Client: copy `client/.env.example` to `client/.env` and adjust the API URL if needed

```powershell
Copy-Item client/.env.example client/.env
```

- Server: ensure database connection is set in `server/.env` for Prisma

3) Run dev

```powershell
# Terminal 1
cd server; npm run dev

# Terminal 2
cd client; npm run dev
```

The app will be available at http://localhost:5173 and the API at http://localhost:3000.

## Notable conventions

- API client configured in `client/src/api.js` with Axios
- Reusable UI primitives in `client/src/components/ui`
- Toast notifications via `client/src/contexts/ToastContext.jsx`
- Data fetching and caching via TanStack Query (`useQuery`, `useMutation`)

