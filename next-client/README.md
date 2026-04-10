# next-client

Incremental Next.js migration app for pb-st-system.

## Run

1. Install dependencies

npm install

2. Copy environment variables

cp .env.example .env

3. Start development server

npm run dev

The app runs on http://localhost:5174 by default.

## Notes

- This app currently uses the existing Express backend on port 3000.
- Dashboard summary already reads live data from /api/reports/summary.
- Module routes are scaffolded and ready for component-by-component migration.
