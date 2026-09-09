import type { Role } from "@/lib/types";
import { changeMemberRole, removeMember } from "@/server/boards";
import { errorResponse } from "@/server/http-error";
import { getUserOrNull } from "@/server/session";

interface Context {
  params: Promise<{ boardId: string; userId: string }>;
}

const ROLES: Role[] = ["OWNER", "EDITOR", "VIEWER"];

export async function PATCH(request: Request, { params }: Context) {
  const user = await getUserOrNull();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, userId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { role } = (body ?? {}) as Record<string, unknown>;
  if (typeof role !== "string" || !ROLES.includes(role as Role)) {
    return Response.json({ error: "invalid role" }, { status: 400 });
  }

  try {
    await changeMemberRole(boardId, user.id, userId, role as Role);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getUserOrNull();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, userId } = await params;
  try {
    await removeMember(boardId, user.id, userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
