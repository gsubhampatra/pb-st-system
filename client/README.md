# Client (React + Vite)

This is the React frontend for pb-st-system.

## Setup

1) Install deps

```powershell
npm install
```

2) Configure environment

Copy `.env.example` to `.env` and set your API URL if different from default:

```powershell
Copy-Item .env.example .env
```

Available vars:

- `VITE_API_URL` — base server URL (default `http://localhost:3000`)

## Run

```powershell
npm run dev
```

## Conventions

- API instance and endpoints: `src/api.js`
- Toast notifications provider: `src/contexts/ToastContext.jsx`
- Reusable UI components: `src/components/ui`
- Data fetching: TanStack Query (`useQuery`, `useMutation`)
