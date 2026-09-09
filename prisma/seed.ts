import "dotenv/config";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/server/db";

const BOARD_ID = "demo-board";

const DEMO_ACCOUNTS = [
  { email: "demo@task-board.local", name: "Demo Owner", password: "demo-password" },
  { email: "viewer@task-board.local", name: "Demo Viewer", password: "demo-password" },
];

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

async function ensureAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
  const existing = await prisma.user.findUnique({
    where: { email: account.email },
    select: { id: true },
  });
  if (existing) return existing.id;

  // Sign up through Better Auth so the password hash is in its own format.
  await auth.api.signUpEmail({
    body: {
      email: account.email,
      password: account.password,
      name: account.name,
    },
  });
  const created = await prisma.user.findUniqueOrThrow({
    where: { email: account.email },
    select: { id: true },
  });
  return created.id;
}

async function main() {
  const [ownerId, viewerId] = await Promise.all(DEMO_ACCOUNTS.map(ensureAccount));

  await prisma.board.upsert({
    where: { id: BOARD_ID },
    update: { name: "Product Roadmap" },
    create: { id: BOARD_ID, name: "Product Roadmap", ownerId },
  });

  await prisma.membership.upsert({
    where: { boardId_userId: { boardId: BOARD_ID, userId: ownerId } },
    update: { role: "OWNER" },
    create: { boardId: BOARD_ID, userId: ownerId, role: "OWNER" },
  });
  await prisma.membership.upsert({
    where: { boardId_userId: { boardId: BOARD_ID, userId: viewerId } },
    update: { role: "VIEWER" },
    create: { boardId: BOARD_ID, userId: viewerId, role: "VIEWER" },
  });

  for (const column of COLUMNS) {
    await prisma.column.upsert({
      where: { id: column.id },
      update: { name: column.name, position: column.position },
      create: { ...column, boardId: BOARD_ID },
    });
  }

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

  console.log(
    `Seeded "${BOARD_ID}". Sign in as ${DEMO_ACCOUNTS[0].email} (owner) or ${DEMO_ACCOUNTS[1].email} (viewer), password "${DEMO_ACCOUNTS[0].password}".`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
