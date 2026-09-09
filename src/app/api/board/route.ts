import { getBoard } from "@/server/board-repo";

export async function GET() {
  return Response.json(await getBoard());
}
