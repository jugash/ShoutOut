import pg from "pg";
import { toQuery, type Sql } from "./sql";

type Client = pg.Pool | pg.PoolClient;

/** A small wrapper over node-postgres: typed rows from `sql` queries, plus transactions. */
export class Db {
  constructor(
    private readonly client: Client,
    private readonly inTransaction = false,
  ) {}

  async rows<T>(query: Sql): Promise<T[]> {
    const { text, values } = toQuery(query);
    const result = await this.client.query(text, values);
    return result.rows as T[];
  }

  async one<T>(query: Sql): Promise<T | null> {
    return (await this.rows<T>(query))[0] ?? null;
  }

  /** Runs a statement and returns the number of affected rows. */
  async execute(query: Sql): Promise<number> {
    const { text, values } = toQuery(query);
    return (await this.client.query(text, values)).rowCount ?? 0;
  }

  /** Runs `work` in a transaction; nested calls join the outer transaction. */
  async transaction<T>(work: (tx: Db) => Promise<T>): Promise<T> {
    if (this.inTransaction) return work(this);
    const connection = await (this.client as pg.Pool).connect();
    try {
      await connection.query("BEGIN");
      const result = await work(new Db(connection, true));
      await connection.query("COMMIT");
      return result;
    } catch (error) {
      await connection.query("ROLLBACK");
      throw error;
    } finally {
      connection.release();
    }
  }

  async close(): Promise<void> {
    await (this.client as pg.Pool).end();
  }
}

/** Postgres error code (e.g. "23505" unique violation), if any. */
export function pgErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

export function createDb(connectionString: string | undefined): Db {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Db(new pg.Pool({ connectionString, max: 10 }));
}

const globalForDb = globalThis as unknown as { shoutoutDb?: Db };

/** Lazily created, process-wide database pool (survives dev hot reloads). */
export function getDb(): Db {
  globalForDb.shoutoutDb ??= createDb(process.env.DATABASE_URL);
  return globalForDb.shoutoutDb;
}
