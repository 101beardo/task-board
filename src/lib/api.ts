import type {
  BoardDetail,
  BoardSummary,
  CreateTaskInput,
  Member,
  MoveTaskInput,
  Role,
  Task,
} from "@/lib/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(
      detail?.error ?? `Request failed with ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<T>;
}

async function noContent(res: Response): Promise<void> {
  if (!res.ok && res.status !== 204) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Request failed with ${res.status}`);
  }
}

const jsonHeaders = { "content-type": "application/json" };

export const boardsApi = {
  list: (signal?: AbortSignal) =>
    fetch("/api/boards", { signal }).then((r) => json<BoardSummary[]>(r)),

  create: (name: string) =>
    fetch("/api/boards", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ name }),
    }).then((r) => json<BoardSummary>(r)),

  get: (boardId: string, signal?: AbortSignal) =>
    fetch(`/api/boards/${boardId}`, { signal }).then((r) =>
      json<BoardDetail>(r),
    ),

  createTask: (boardId: string, { title, columnId }: CreateTaskInput) =>
    fetch(`/api/boards/${boardId}/tasks`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ title, columnId }),
    }).then((r) => json<Task>(r)),

  moveTask: ({ id, columnId, beforeId }: MoveTaskInput) =>
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ columnId, beforeId: beforeId ?? null }),
    }).then((r) => json<Task>(r)),

  deleteTask: (id: string) =>
    fetch(`/api/tasks/${id}`, { method: "DELETE" }).then(noContent),

  listMembers: (boardId: string, signal?: AbortSignal) =>
    fetch(`/api/boards/${boardId}/members`, { signal }).then((r) =>
      json<Member[]>(r),
    ),

  inviteMember: (boardId: string, email: string, role: Role) =>
    fetch(`/api/boards/${boardId}/members`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, role }),
    }).then((r) => json<Member>(r)),

  changeMemberRole: (boardId: string, userId: string, role: Role) =>
    fetch(`/api/boards/${boardId}/members/${userId}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ role }),
    }).then(noContent),

  removeMember: (boardId: string, userId: string) =>
    fetch(`/api/boards/${boardId}/members/${userId}`, {
      method: "DELETE",
    }).then(noContent),
};

export const boardKeys = {
  lists: ["boards"] as const,
  detail: (boardId: string) => ["board", boardId] as const,
  members: (boardId: string) => ["board", boardId, "members"] as const,
};
