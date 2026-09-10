import "dotenv/config";
import { defineConfig } from "prisma/config";

// Use process.env directly, not prisma's env() helper: env() throws when the
// variable is missing, which breaks `prisma generate` on hosts that build
// without a database URL (it does not need one). Commands that do connect
// (migrate, seed) still fail clearly if the URL is absent.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
