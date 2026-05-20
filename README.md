# theincubator.ai

A platform connecting startup founders, investors, and venture firms. Founders publish progress and milestone updates about their companies, investors and firms discover and follow them, and OpenAI is used to generate up-to-date company summaries from posts and profile data.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Wouter (routing), TanStack Query, Tailwind CSS, Radix UI / shadcn-style components, Framer Motion
- **Backend:** Node.js, Express, TypeScript (compiled with esbuild)
- **Database & auth:** Supabase (Postgres, Auth, Edge Functions, cron)
- **ORM:** Drizzle ORM + drizzle-kit (schema in `shared/schema.ts`)
- **AI:** OpenAI API (company summary generation)
- **Hosting:** Configured for Replit (`autoscale` deployment), but runs anywhere Node 20 runs

## Repository layout

```
client/        React + Vite frontend (pages, components, contexts, hooks)
server/        Express API, AI service, Supabase admin client, Vite middleware
shared/        Shared TypeScript types and Drizzle schema
supabase/      Supabase project config, seed SQL, cron setup, edge functions
```

Key entry points: `client/src/main.tsx` (frontend), `server/index.ts` (server), `client/src/App.tsx` (routes).

## Features

- Email/password and OAuth sign-in via Supabase Auth
- Role-based onboarding flows for **companies (founders)**, **investors**, and **firms**
- Activity feed with posts, milestones, and follow / express-interest interactions
- Company profile pages with stats, followers, and interested investors
- Founder dashboards and firm dashboards with company detail views
- Search across companies and people
- AI-generated company summaries with per-company rate limiting (1 hour)
- Scheduled regeneration via a Supabase Edge Function + cron

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (URL, anon key, service role key)
- An OpenAI API key (only required if you want AI summaries)

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file at the repo root. The server reads it via `tsx --env-file=.env`.

```bash
# Supabase (client + server)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (for AI summary generation)
OPENAI_API_KEY=sk-...

# Server
PORT=5000
```

You can check that everything is wired up by hitting `GET /api/ai-summary/status` after the server starts.

### Database

Schema lives in `shared/schema.ts` (Drizzle). To push schema changes to your database:

```bash
npm run db:push
```

Seed data and cron setup for Supabase are in `supabase/seed.sql` and `supabase/setup-cron.sql`. The edge function that regenerates summaries on a schedule is in `supabase/functions/regenerate-summaries/`.

### Run in development

```bash
npm run dev
```

This starts the Express server on `PORT` (default `5000`) with Vite middleware serving the React app. Both the API (under `/api/*`) and the client are served from the same port.

### Build and run in production

```bash
npm run build    # builds the client with Vite and bundles the server with esbuild
npm run start    # runs dist/index.js with NODE_ENV=production
```

### Type-check

```bash
npm run check
```

## API

All routes are prefixed with `/api`. A few notable endpoints (see `server/routes.ts` for the full list):

- `GET /api/ai-summary/status` — reports whether OpenAI and Supabase credentials are configured
- `GET /api/company/:id/summary` — fetch a stored AI summary for a company
- `POST /api/company/:id/generate-summary` — regenerate the summary (rate-limited to once per hour per company)

## Deployment

The `.replit` file configures a Replit autoscale deployment that builds with `npm run build` and runs `npm run start`, exposing port `5000` on external port `80`. To deploy elsewhere, run the same two commands and make sure the environment variables above are set.

## License

MIT — see [LICENSE](./LICENSE).
