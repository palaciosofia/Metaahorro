import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPool } from '../src/db/pool';

async function migrate(): Promise<void> {
  const sql = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const pool = getPool();
  try {
    await pool.query(sql);
    console.log('Esquema aplicado');
  } finally {
    await pool.end();
  }
}

migrate().catch((error: unknown) => {
  console.error('Error aplicando el esquema:', error);
  process.exit(1);
});
