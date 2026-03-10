import pg from 'pg'
import 'dotenv/config'

const { Pool, types } = pg

// Return DATE columns as "YYYY-MM-DD" string to avoid timezone shift (e.g. 10 March becoming 9 March in UTC+6)
const DATE_OID = 1082
types.setTypeParser(DATE_OID, (val: string) => val)

function getConnectionConfig(): pg.PoolConfig {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL }
  }
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME ?? 'expense',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
  }
}

export const pool = new Pool(getConnectionConfig())

export async function query<T = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params)
}
