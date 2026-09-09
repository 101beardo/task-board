import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";

/**
 * Authorises a WebSocket upgrade: the request must carry a valid session and
 * the user must be a member of the board they want to subscribe to.
 */
export async function verifyBoardAccess(
  cookieHeader: string | undefined,
  boardId: string,
): Promise<boolean> {
  if (!cookieHeader) return false;

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });
  if (!session) return false;

  const count = await prisma.membership.count({
    where: { boardId, userId: session.user.id },
  });
  return count > 0;
}
