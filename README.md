# Task Board

A real-time-ready collaborative task board. Drag cards between columns, reorder
within a column, and every change lands instantly with an optimistic update that
reconciles against the server.

**Live:** https://task-board-101beardos-projects.vercel.app

## What this slice covers

- **Board UI** with four columns (Backlog, In progress, In review, Done) and
  per-column task counts.
- **Drag and drop** across and within columns via `@dnd-kit` (pointer + keyboard
  sensors, drag overlay, `closestCorners` collision).
- **Optimistic updates** with TanStack Query: `onMutate` snapshots the cache and
  patches it, `onError` rolls back, `onSettled` refetches. Create, move and
  delete all apply before the network round-trip.
- **Fractional ordering** so a reorder only rewrites the one card that moved,
  never the whole column (`order` is a float, new position is the midpoint of its
  neighbours).
- **Route handlers** (`/api/board`, `/api/tasks`, `/api/tasks/[id]`) backed by an
  in-memory store. The store lives on `globalThis` so it survives HMR and resets
  on a cold start.
- **Ephemeral drag state** (the currently dragged card id) in Zustand, kept out
  of the server cache.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 ·
TanStack Query 5 · Zustand 5 · @dnd-kit

## Next slices

- Auth + role-based access (owner / editor / viewer)
- Postgres + Prisma replacing the in-memory store
- Live sync across clients over WebSockets

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build + typecheck
npm run lint
```
