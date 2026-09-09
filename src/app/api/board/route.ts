import { getBoard } from "@/server/board-store";

export async function GET() {
  return Response.json(getBoard());
}
