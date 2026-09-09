import type { Board, MoveTaskInput, Task } from "@/lib/types";
import { prisma } from "@/server/db";

/**
 * Board data access. The rest of the app only ever talks to these functions,
 * never to Prisma directly, so the storage can change without touching routes.
 *
 * Until auth lands there is a single shared board; `seed.ts` creates it and
 * every query is scoped to it here.
 */

export const DEFAULT_BOARD_ID = "demo-board";

const ORDER_STEP = 1000;

function toTaskDTO(task: {
  id: string;
  title: string;
  columnId: string;
  order: number;
  createdAt: Date;
}): Task {
  return {
    id: task.id,
    title: task.title,
    columnId: task.columnId,
    order: task.order,
    createdAt: task.createdAt.toISOString(),
  };
}

export async function getBoard(): Promise<Board> {
  const columns = await prisma.column.findMany({
    where: { boardId: DEFAULT_BOARD_ID },
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      tasks: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          columnId: true,
          order: true,
          createdAt: true,
        },
      },
    },
  });

  return {
    columns: columns.map((c) => ({ id: c.id, name: c.name })),
    tasks: columns.flatMap((c) => c.tasks.map(toTaskDTO)),
  };
}

export async function columnExists(columnId: string): Promise<boolean> {
  const count = await prisma.column.count({
    where: { id: columnId, boardId: DEFAULT_BOARD_ID },
  });
  return count > 0;
}

export async function createTask(
  title: string,
  columnId: string,
): Promise<Task> {
  const max = await prisma.task.aggregate({
    where: { columnId },
    _max: { order: true },
  });
  const order = (max._max.order ?? 0) + ORDER_STEP;

  const task = await prisma.task.create({
    data: { title, columnId, order },
  });
  return toTaskDTO(task);
}

export async function moveTask({
  id,
  columnId,
  beforeId,
}: MoveTaskInput): Promise<Task | null> {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return null;

  const siblings = await prisma.task.findMany({
    where: { columnId, id: { not: id } },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

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

  const updated = await prisma.task.update({
    where: { id },
    data: { columnId, order: newOrder },
  });
  return toTaskDTO(updated);
}

export async function deleteTask(id: string): Promise<boolean> {
  const result = await prisma.task.deleteMany({ where: { id } });
  return result.count > 0;
}
