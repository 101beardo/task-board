import type { Board, CreateTaskInput, MoveTaskInput, Task } from "@/lib/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(
      detail?.error ?? `Request failed with ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<T>;
}

export const boardApi = {
  get: (signal?: AbortSignal) =>
    fetch("/api/board", { signal }).then((r) => json<Board>(r)),

  createTask: ({ title, columnId }: CreateTaskInput) =>
    fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, columnId }),
    }).then((r) => json<Task>(r)),

  moveTask: ({ id, columnId, beforeId }: MoveTaskInput) =>
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ columnId, beforeId: beforeId ?? null }),
    }).then((r) => json<Task>(r)),

  deleteTask: (id: string) =>
    fetch(`/api/tasks/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok && r.status !== 204) throw new Error("Failed to delete task");
    }),
};

export const boardKeys = {
  all: ["board"] as const,
};
