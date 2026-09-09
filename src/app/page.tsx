import { AppHeader } from "@/components/AppHeader";
import { BoardList } from "@/components/BoardList";
import { requireUser } from "@/server/session";

export default async function HomePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader userName={user.name} />
      <BoardList />
    </div>
  );
}
