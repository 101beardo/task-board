# Task Board

A real-time-ready collaborative task board. Sign in, create boards, invite people
with a role, and drag cards around. Every change applies optimistically and
reconciles against the server.

**Live:** https://task-board-101beardos-projects.vercel.app

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
Better Auth · Prisma 7 + PostgreSQL · TanStack Query 5 · Zustand 5 · @dnd-kit

## Next

- Live sync across clients over WebSockets (the two-tab demo)
- Framer Motion polish on cards and the members panel

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
