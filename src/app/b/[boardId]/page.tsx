import { BoardScreen } from "@/components/BoardScreen";
import { requireUser } from "@/server/session";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const user = await requireUser();
  const { boardId } = await params;

  return <BoardScreen boardId={boardId} userName={user.name} />;
}
