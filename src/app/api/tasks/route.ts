import { columnExists, createTask } from "@/server/board-store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, columnId } = (body ?? {}) as Record<string, unknown>;

  if (typeof title !== "string" || title.trim().length === 0) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }
  if (title.trim().length > 200) {
    return Response.json({ error: "title is too long" }, { status: 400 });
  }
  if (typeof columnId !== "string" || !columnExists(columnId)) {
    return Response.json({ error: "unknown columnId" }, { status: 400 });
  }

  const task = createTask(title.trim(), columnId);
  return Response.json(task, { status: 201 });
}
