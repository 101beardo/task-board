import type { Role } from "@/lib/types";
import { inviteMember, listMembers } from "@/server/boards";
import { errorResponse } from "@/server/http-error";
import { getUserOrNull } from "@/server/session";

interface Context {
  params: Promise<{ boardId: string }>;
}

const ROLES: Role[] = ["OWNER", "EDITOR", "VIEWER"];

export async function GET(_request: Request, { params }: Context) {
  const user = await getUserOrNull();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  try {
    return Response.json(await listMembers(boardId, user.id));
  } catch (error) {
    return errorResponse(error);
  }
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

  const { email, role } = (body ?? {}) as Record<string, unknown>;
  if (typeof email !== "string" || !email.includes("@")) {
    return Response.json({ error: "a valid email is required" }, { status: 400 });
  }
  if (typeof role !== "string" || !ROLES.includes(role as Role)) {
    return Response.json({ error: "invalid role" }, { status: 400 });
  }

  try {
    const member = await inviteMember(
      boardId,
      user.id,
      email.trim().toLowerCase(),
      role as Role,
    );
    return Response.json(member, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
