import type {
  BoardDetail,
  BoardSummary,
  Member,
  Role,
  Task,
} from "@/lib/types";
import { canWrite } from "@/lib/types";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http-error";

const ORDER_STEP = 1000;

const DEFAULT_COLUMNS = [
  { name: "Backlog", position: 0 },
  { name: "In progress", position: 1 },
  { name: "In review", position: 2 },
  { name: "Done", position: 3 },
];

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

/** Returns the user's role on the board, or throws 403/404. */
async function requireMembership(
  boardId: string,
  userId: string,
): Promise<Role> {
  const membership = await prisma.membership.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { role: true, board: { select: { id: true } } },
  });
  if (!membership) {
    // Don't leak whether the board exists.
    throw new HttpError(404, "Board not found");
  }
  return membership.role;
}

async function requireWriteAccess(
  boardId: string,
  userId: string,
): Promise<Role> {
  const role = await requireMembership(boardId, userId);
  if (!canWrite(role)) {
    throw new HttpError(403, "You have read-only access to this board");
  }
  return role;
}

export async function listBoards(userId: string): Promise<BoardSummary[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      board: {
        select: {
          id: true,
          name: true,
          _count: { select: { columns: true } },
          columns: { select: { _count: { select: { tasks: true } } } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.board.id,
    name: m.board.name,
    role: m.role,
    taskCount: m.board.columns.reduce((sum, c) => sum + c._count.tasks, 0),
  }));
}

export async function getBoardDetail(
  boardId: string,
  userId: string,
): Promise<BoardDetail> {
  const role = await requireMembership(boardId, userId);

  const board = await prisma.board.findUniqueOrThrow({
    where: { id: boardId },
    select: {
      id: true,
      name: true,
      columns: {
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
      },
    },
  });

  return {
    id: board.id,
    name: board.name,
    role,
    columns: board.columns.map((c) => ({ id: c.id, name: c.name })),
    tasks: board.columns.flatMap((c) => c.tasks.map(toTaskDTO)),
  };
}

export async function createBoard(
  userId: string,
  name: string,
): Promise<BoardSummary> {
  const board = await prisma.board.create({
    data: {
      name,
      ownerId: userId,
      columns: { create: DEFAULT_COLUMNS },
      memberships: { create: { userId, role: "OWNER" } },
    },
    select: { id: true, name: true },
  });
  return { id: board.id, name: board.name, role: "OWNER", taskCount: 0 };
}

async function columnInBoard(
  columnId: string,
  boardId: string,
): Promise<boolean> {
  const count = await prisma.column.count({ where: { id: columnId, boardId } });
  return count > 0;
}

export async function createTask(
  boardId: string,
  userId: string,
  title: string,
  columnId: string,
): Promise<Task> {
  await requireWriteAccess(boardId, userId);
  if (!(await columnInBoard(columnId, boardId))) {
    throw new HttpError(400, "unknown columnId");
  }

  const max = await prisma.task.aggregate({
    where: { columnId },
    _max: { order: true },
  });
  const task = await prisma.task.create({
    data: { title, columnId, order: (max._max.order ?? 0) + ORDER_STEP },
  });
  return toTaskDTO(task);
}

export async function moveTask(
  userId: string,
  taskId: string,
  columnId: string,
  beforeId: string | null,
): Promise<Task> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, column: { select: { boardId: true } } },
  });
  if (!task) throw new HttpError(404, "task not found");

  const boardId = task.column.boardId;
  await requireWriteAccess(boardId, userId);
  if (!(await columnInBoard(columnId, boardId))) {
    throw new HttpError(400, "unknown columnId");
  }

  const siblings = await prisma.task.findMany({
    where: { columnId, id: { not: taskId } },
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
    where: { id: taskId },
    data: { columnId, order: newOrder },
  });
  return toTaskDTO(updated);
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { column: { select: { boardId: true } } },
  });
  if (!task) throw new HttpError(404, "task not found");

  await requireWriteAccess(task.column.boardId, userId);
  await prisma.task.delete({ where: { id: taskId } });
}

// --- Members -------------------------------------------------------------

export async function listMembers(
  boardId: string,
  userId: string,
): Promise<Member[]> {
  await requireMembership(boardId, userId);
  const rows = await prisma.membership.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return rows.map((r) => ({
    userId: r.user.id,
    name: r.user.name,
    email: r.user.email,
    role: r.role,
  }));
}

async function requireOwner(boardId: string, userId: string): Promise<void> {
  const role = await requireMembership(boardId, userId);
  if (role !== "OWNER") {
    throw new HttpError(403, "Only the board owner can manage members");
  }
}

export async function inviteMember(
  boardId: string,
  ownerId: string,
  email: string,
  role: Role,
): Promise<Member> {
  await requireOwner(boardId, ownerId);
  if (role === "OWNER") {
    throw new HttpError(400, "A board can only have one owner");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    throw new HttpError(404, "No account with that email");
  }

  const existing = await prisma.membership.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  if (existing) {
    throw new HttpError(409, "That person is already a member");
  }

  await prisma.membership.create({ data: { boardId, userId: user.id, role } });
  return { userId: user.id, name: user.name, email: user.email, role };
}

export async function changeMemberRole(
  boardId: string,
  ownerId: string,
  targetUserId: string,
  role: Role,
): Promise<void> {
  await requireOwner(boardId, ownerId);
  if (targetUserId === ownerId) {
    throw new HttpError(400, "You cannot change your own role");
  }
  if (role === "OWNER") {
    throw new HttpError(400, "A board can only have one owner");
  }
  const result = await prisma.membership.updateMany({
    where: { boardId, userId: targetUserId, role: { not: "OWNER" } },
    data: { role },
  });
  if (result.count === 0) throw new HttpError(404, "Member not found");
}

export async function removeMember(
  boardId: string,
  ownerId: string,
  targetUserId: string,
): Promise<void> {
  await requireOwner(boardId, ownerId);
  if (targetUserId === ownerId) {
    throw new HttpError(400, "The owner cannot leave their own board");
  }
  const result = await prisma.membership.deleteMany({
    where: { boardId, userId: targetUserId, role: { not: "OWNER" } },
  });
  if (result.count === 0) throw new HttpError(404, "Member not found");
}
