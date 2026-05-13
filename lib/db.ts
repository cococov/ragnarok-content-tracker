import "server-only";

import { Pool, type QueryResultRow } from "pg";

import { getRequiredEnv, shouldUseDbSsl } from "./env";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getRequiredEnv("DATABASE_URL"),
      ssl: shouldUseDbSsl() ? { rejectUnauthorized: true } : undefined,
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}
