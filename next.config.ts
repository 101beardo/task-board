import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's driver adapter and the pg client rely on Node built-ins and must
  // not be bundled by Turbopack.
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
};

export default nextConfig;
