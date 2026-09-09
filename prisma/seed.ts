import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BOARD_ID = "demo-board";
const DEMO_USER_ID = "demo-user";

const COLUMNS = [
  { id: "col-backlog", name: "Backlog", position: 0 },
  { id: "col-in-progress", name: "In progress", position: 1 },
  { id: "col-in-review", name: "In review", position: 2 },
  { id: "col-done", name: "Done", position: 3 },
];

const TASKS: Array<{ columnId: string; title: string }> = [
  { columnId: "col-backlog", title: "Add keyboard shortcuts for column navigation" },
  { columnId: "col-backlog", title: "Write the architecture note for the realtime layer" },
  { columnId: "col-in-progress", title: "Optimistic move: reconcile server order on settle" },
  { columnId: "col-in-progress", title: "Column drop zones should grow when empty" },
  { columnId: "col-in-review", title: "Card drag animation via Framer Motion" },
  { columnId: "col-done", title: "Board query with TanStack Query caching" },
  { columnId: "col-done", title: "Fractional ordering so reorders never renumber" },
];

async function main() {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      name: "Demo User",
      email: "demo@task-board.local",
      emailVerified: true,
    },
  });

  await prisma.board.upsert({
    where: { id: BOARD_ID },
    update: { name: "Product Roadmap" },
    create: { id: BOARD_ID, name: "Product Roadmap", ownerId: DEMO_USER_ID },
  });

  await prisma.membership.upsert({
    where: { boardId_userId: { boardId: BOARD_ID, userId: DEMO_USER_ID } },
    update: { role: "OWNER" },
    create: { boardId: BOARD_ID, userId: DEMO_USER_ID, role: "OWNER" },
  });

  for (const column of COLUMNS) {
    await prisma.column.upsert({
      where: { id: column.id },
      update: { name: column.name, position: column.position },
      create: { ...column, boardId: BOARD_ID },
    });
  }

  // Only seed tasks when the board has none, so re-running does not duplicate.
  const existingTasks = await prisma.task.count({
    where: { column: { boardId: BOARD_ID } },
  });
  if (existingTasks === 0) {
    const now = Date.now();
    for (const [i, task] of TASKS.entries()) {
      await prisma.task.create({
        data: {
          columnId: task.columnId,
          title: task.title,
          order: (i + 1) * 1000,
          createdAt: new Date(now - (TASKS.length - i) * 60_000),
        },
      });
    }
  }

  console.log(`Seeded board "${BOARD_ID}" with ${COLUMNS.length} columns.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
