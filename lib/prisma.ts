import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../app/generated/prisma/client");

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  // Strip 'file:' prefix and resolve to absolute path
  const relativePath = dbUrl.replace(/^file:/, "");
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const adapter = new PrismaBetterSqlite3({ url: absolutePath });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
