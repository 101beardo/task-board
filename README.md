# Task Board

A real-time-ready collaborative task board. Sign in, create boards, invite people
with a role, and drag cards around. Every change applies optimistically and
reconciles against the server.

**Live:** runs as one Node service (custom `server.ts`) so the WebSocket server
works. A serverless deploy also works, minus live sync.

## What's built

- **Auth** (Better Auth, email + password): sign up / in / out, session in an
  HTTP-only cookie, optimistic route protection in `proxy.ts`, real verification
  in a cached server-side data layer (`src/server/session.ts`). Every new account
  gets a starter board.
- **Boards + role-based access.** A board has members with a role:
  - `OWNER` / `EDITOR` can add, move and delete tasks
  - `VIEWER` gets a read-only board (no drag handles, no inputs)
  - only the `OWNER` can invite members or change roles
  The checks live in `src/server/boards.ts` and run on every mutation, not just
  in the UI.
- **Live sync over WebSockets.** A custom Node server (`server.ts`) runs Next and
  a `ws` server on `/api/ws`. The upgrade is authorised against the session
  cookie and board membership; after any task mutation the server broadcasts to
  everyone watching that board and their board query refetches. Open the board in
  two tabs to see it. Without the custom server (plain `next dev`, a serverless
  host) the socket just never opens and the board still works.
- **Drag and drop** across and within columns via `@dnd-kit` (pointer + keyboard
  sensors, drag overlay, `closestCorners`).
- **Optimistic updates** with TanStack Query: `onMutate` snapshots the cache and
  patches it, `onError` rolls back, `onSettled` refetches. Create, move and
  delete all apply before the network round-trip.
- **Fractional ordering** so a reorder only rewrites the card that moved, never
  the whole column (`order` is a float; a new slot is the midpoint of its
  neighbours, mirrored on client and server).
- **Postgres via Prisma 7** (driver adapter, `@prisma/adapter-pg`). Schema,
  migrations and a seed script in `prisma/`.
- **Ephemeral drag state** (the dragged card id) in Zustand, kept out of the
  server cache.

## Try it

Seeded accounts (password `demo-password`):

| Email | Role on "Product Roadmap" |
| --- | --- |
| `demo@task-board.local` | Owner |
| `viewer@task-board.local` | Viewer |

Sign in as each in two browsers to see the role gate.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 ·
Better Auth · Prisma 7 + PostgreSQL · TanStack Query 5 · Zustand 5 · @dnd-kit ·
`ws` on a custom Node server

## Next

- Framer Motion polish on cards and the members panel
- Presence (who else is looking at this board)

## Develop

```bash
npm install
npm run db:up        # Postgres in Docker (docker-compose.yml)
npm run db:migrate   # apply migrations
npm run db:seed      # demo board + accounts
npm run dev
```

Open http://localhost:3000. Copy `.env.example` to `.env` first and set
`BETTER_AUTH_SECRET` (`openssl rand -base64 32`).

```bash
npm run build   # prisma generate + production build + typecheck
npm run lint
```

## Deploy (free)

A single always-on Node process plus a Postgres database. This setup keeps both
on free tiers:

1. **Database** — create a free Postgres on [Neon](https://neon.tech) and copy
   the pooled connection string (it ends with `?sslmode=require`).
2. **App** — on [Render](https://render.com), *New > Blueprint* against this repo.
   `render.yaml` provisions a free web service; set `DATABASE_URL` (the Neon
   string), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and
   `BETTER_AUTH_URL` (the Render URL) in the dashboard.
3. **Seed once** — from the Render shell, `npm run db:seed`.
4. **Keep it warm** — set an `APP_URL` repo variable to the Render URL; the
   `keep-warm` workflow pings `/api/health` every 10 minutes so the free
   instance never cold-starts for a visitor.

Migrations run on each deploy (`prisma migrate deploy` in the start command).
