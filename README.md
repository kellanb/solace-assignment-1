## Solace Candidate Assignment

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Install dependencies

```bash
npm i
```

Run the development server:

```bash
npm run dev
```

## Database set up

The app is configured to return a default list of advocates. This will allow you to get the app up and running without needing to configure a database. If you’d like to configure a database, you’re encouraged to do so. You can uncomment the url in `.env` and the line in `src/app/api/advocates/route.ts` to test retrieving advocates from the database.

1. Feel free to use whatever configuration of postgres you like. The project is set up to use docker-compose.yml to set up postgres. The url is in .env.

```bash
docker compose up -d
```

2. Create a `solaceassignment` database.

3. Push migration to the database

```bash
npx drizzle-kit push
```

4. Seed the database

```bash
curl -X POST http://localhost:3000/api/seed
```

### Advocate API contract

All frontend search/filter operations go through the Next.js API route at `/api/advocates` (no server actions). The endpoint supports pagination and filtering:

| Query param | Description |
| --- | --- |
| `q` | Text search across name, city, degree (case-insensitive). |
| `city` | Exact match city filter (use `"all"` to disable). |
| `specialties` | Comma-separated specialties; results must include all selected values. |
| `minExperience` | Minimum years of experience (integer). |
| `sort` | `name` (default) or `experience`. |
| `page`, `pageSize` | Pagination controls (page size capped at 50). |

The response shape is:

```json
{
  "data": [/* advocates */],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 200,
    "hasNextPage": true,
    "source": "database",
    "durationMs": 12.5
  }
}
```

If a database connection is not configured, the API falls back to the seeded data but still applies query filters/pagination so the frontend contract remains identical.
