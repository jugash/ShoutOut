import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

export type Db = PrismaClient;

export function createDb(connectionString: string | undefined): Db {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForDb = globalThis as unknown as { shoutoutDb?: Db };

/** Lazily created, process-wide Prisma client (survives dev hot reloads). */
export function getDb(): Db {
  globalForDb.shoutoutDb ??= createDb(process.env.DATABASE_URL);
  return globalForDb.shoutoutDb;
}
