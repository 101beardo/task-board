import { columnExists, deleteTask, moveTask } from "@/server/board-store";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { columnId, beforeId } = (body ?? {}) as Record<string, unknown>;

  if (typeof columnId !== "string" || !columnExists(columnId)) {
    return Response.json({ error: "unknown columnId" }, { status: 400 });
  }
  if (beforeId != null && typeof beforeId !== "string") {
    return Response.json({ error: "beforeId must be a string or null" }, { status: 400 });
  }

  const task = moveTask({ id, columnId, beforeId: (beforeId as string) ?? null });
  if (!task) {
    return Response.json({ error: "task not found" }, { status: 404 });
  }
  return Response.json(task);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const removed = deleteTask(id);
  if (!removed) {
    return Response.json({ error: "task not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
