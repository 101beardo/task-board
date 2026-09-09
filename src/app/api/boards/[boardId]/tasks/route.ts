import { createTask } from "@/server/boards";
import { errorResponse } from "@/server/http-error";
import { getUserOrNull } from "@/server/session";

interface Context {
  params: Promise<{ boardId: string }>;
}

export async function POST(request: Request, { params }: Context) {
  const user = await getUserOrNull();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;

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
  if (typeof columnId !== "string") {
    return Response.json({ error: "columnId is required" }, { status: 400 });
  }

  try {
    const task = await createTask(boardId, user.id, title.trim(), columnId);
    return Response.json(task, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
