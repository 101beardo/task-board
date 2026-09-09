import { getBoardDetail } from "@/server/boards";
import { errorResponse } from "@/server/http-error";
import { getUserOrNull } from "@/server/session";

interface Context {
  params: Promise<{ boardId: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const user = await getUserOrNull();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  try {
    return Response.json(await getBoardDetail(boardId, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
