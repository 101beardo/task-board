import { createBoard, listBoards } from "@/server/boards";
import { errorResponse } from "@/server/http-error";
import { getUserOrNull } from "@/server/session";

export async function GET() {
  const user = await getUserOrNull();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return Response.json(await listBoards(user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const user = await getUserOrNull();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name } = (body ?? {}) as Record<string, unknown>;
  if (typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (name.trim().length > 80) {
    return Response.json({ error: "name is too long" }, { status: 400 });
  }

  try {
    const board = await createBoard(user.id, name.trim());
    return Response.json(board, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
