import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '../../migrations')

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function getAppliedVersions(): Promise<Set<string>> {
  const result = await pool.query<{ version: string }>(
    'SELECT version FROM schema_migrations ORDER BY version'
  )
  return new Set(result.rows.map((r) => r.version))
}

async function runMigration(version: string, name: string, sql: string) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [
      version,
      name,
    ])
    await client.query('COMMIT')
    console.log(`  ✓ ${name}`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

async function main() {
  const command = process.argv[2] ?? 'up'
  if (command !== 'up') {
    console.log('Usage: npm run migrate  (runs all pending migrations)')
    await pool.end()
    process.exit(1)
  }

  await ensureMigrationsTable()
  const applied = await getAppliedVersions()

  const files = await readdir(MIGRATIONS_DIR)
  const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort()

  let run = 0
  for (const file of sqlFiles) {
    const version = file.replace('.sql', '')
    if (applied.has(version)) continue
    const path = join(MIGRATIONS_DIR, file)
    const sql = await readFile(path, 'utf-8')
    await runMigration(version, file, sql)
    run++
  }

  if (run === 0) {
    console.log('No pending migrations.')
  } else {
    console.log(`Ran ${run} migration(s).`)
  }
  await pool.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
