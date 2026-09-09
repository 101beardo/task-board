import type { Board, Column, MoveTaskInput, Task } from "@/lib/types";

/**
 * In-memory board store. This is the seam that Prisma + Postgres will replace
 * in a later slice, so the rest of the app only ever talks to these functions,
 * never to the storage directly.
 *
 * State lives on `globalThis` so it survives the module re-evaluation that
 * Next's dev server does on hot reload. It still resets on a cold serverless
 * start, which is fine for a demo — the seed keeps the board populated.
 */

const COLUMNS: Column[] = [
  { id: "backlog", name: "Backlog" },
  { id: "in-progress", name: "In progress" },
  { id: "in-review", name: "In review" },
  { id: "done", name: "Done" },
];

const ORDER_STEP = 1000;

interface StoreShape {
  tasks: Task[];
}

const globalForStore = globalThis as unknown as { __boardStore?: StoreShape };

function seed(): Task[] {
  const now = Date.now();
  const rows: Array<[string, string]> = [
    ["backlog", "Add keyboard shortcuts for column navigation"],
    ["backlog", "Write the architecture note for the realtime layer"],
    ["in-progress", "Optimistic move: reconcile server order on settle"],
    ["in-progress", "Column drop zones should grow when empty"],
    ["in-review", "Card drag animation via Framer Motion"],
    ["done", "Board query with TanStack Query caching"],
    ["done", "Fractional ordering so reorders never renumber"],
  ];
  return rows.map(([columnId, title], i) => ({
    id: crypto.randomUUID(),
    title,
    columnId,
    order: (i + 1) * ORDER_STEP,
    createdAt: new Date(now - (rows.length - i) * 60_000).toISOString(),
  }));
}

function getStore(): StoreShape {
  if (!globalForStore.__boardStore) {
    globalForStore.__boardStore = { tasks: seed() };
  }
  return globalForStore.__boardStore;
}

function sorted(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order);
}

export function getBoard(): Board {
  return { columns: COLUMNS, tasks: sorted(getStore().tasks) };
}

export function columnExists(columnId: string): boolean {
  return COLUMNS.some((c) => c.id === columnId);
}

export function createTask(title: string, columnId: string): Task {
  const store = getStore();
  const inColumn = store.tasks.filter((t) => t.columnId === columnId);
  const maxOrder = inColumn.reduce((max, t) => Math.max(max, t.order), 0);
  const task: Task = {
    id: crypto.randomUUID(),
    title,
    columnId,
    order: maxOrder + ORDER_STEP,
    createdAt: new Date().toISOString(),
  };
  store.tasks.push(task);
  return task;
}

export function moveTask({ id, columnId, beforeId }: MoveTaskInput): Task | null {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return null;

  const siblings = sorted(
    store.tasks.filter((t) => t.columnId === columnId && t.id !== id),
  );

  let newOrder: number;
  if (!beforeId) {
    const last = siblings.at(-1);
    newOrder = last ? last.order + ORDER_STEP : ORDER_STEP;
  } else {
    const beforeIndex = siblings.findIndex((t) => t.id === beforeId);
    if (beforeIndex === -1) {
      const last = siblings.at(-1);
      newOrder = last ? last.order + ORDER_STEP : ORDER_STEP;
    } else {
      const before = siblings[beforeIndex];
      const prev = siblings[beforeIndex - 1];
      newOrder = prev ? (prev.order + before.order) / 2 : before.order / 2;
    }
  }

  task.columnId = columnId;
  task.order = newOrder;
  return task;
}

export function deleteTask(id: string): boolean {
  const store = getStore();
  const before = store.tasks.length;
  store.tasks = store.tasks.filter((t) => t.id !== id);
  return store.tasks.length < before;
}
